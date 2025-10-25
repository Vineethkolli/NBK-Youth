import axios from 'axios';
import yaml from 'js-yaml';
import { DateTime } from 'luxon';

const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const token = process.env.GITHUB_TOKEN;
const headers = token ? { Authorization: `Bearer ${token}` } : {};
const apiBase = `https://api.github.com/repos/${owner}/${repo}/actions`;

async function fetchWorkflows() {
  const { data } = await axios.get(`${apiBase}/workflows`, { headers });
  return data.workflows || [];
}

async function fetchWorkflowYAML(wf) {
  try {
    if (!wf.path) {
      return [];
    }
    const { data: fileData } = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${wf.path}`,
      { headers }
    );

    if (!fileData || !fileData.content) return [];

    const yamlContent = Buffer.from(fileData.content, 'base64').toString('utf8');
    const parsed = yaml.load(yamlContent);
    const on = parsed?.on;
    if (!on) return [];

    let schedules = [];
    const rawSchedule = on.schedule;
    if (!rawSchedule) return [];

    if (Array.isArray(rawSchedule)) {
      schedules = rawSchedule;
    } else if (typeof rawSchedule === 'object' || typeof rawSchedule === 'string') {
      schedules = [rawSchedule];
    }

    return schedules;
  } catch (err) {
    console.warn(`[githubActions] failed to fetch/parse YAML for ${wf.path}:`, err.response?.data || err.message);
    return [];
  }
}

function getScheduleStrings(schedules) {
  // convert schedule entries to human-readable strings (cron string or JSON fallback)
  const out = [];
  for (const s of schedules || []) {
    if (!s && s !== 0) continue;
    if (typeof s === 'string') {
      out.push(s.trim());
      continue;
    }
    if (typeof s === 'object') {
      if ('cron' in s && s.cron) {
        out.push(String(s.cron).trim());
      } else {
        try {
          out.push(JSON.stringify(s));
        } catch {
          out.push(String(s));
        }
      }
      continue;
    }
    out.push(String(s));
  }
  return out;
}

async function fetchRuns(wf, per_page = 100) {
  const { data } = await axios.get(`${apiBase}/workflows/${wf.id}/runs?per_page=${per_page}`, { headers });
  return data.workflow_runs || [];
}

async function fetchJobs(jobs_url) {
  const { data } = await axios.get(jobs_url, { headers });
  return data.jobs || [];
}


export const githubActionsController = {

  getAllData: async (req, res) => {
    try {
      const workflows = await fetchWorkflows();

      const workflowPromises = workflows.map(async (wf) => {
        const schedulesRaw = await fetchWorkflowYAML(wf);
        const schedules = getScheduleStrings(schedulesRaw); 
        const allRuns = await fetchRuns(wf);
        const prevRuns = (allRuns || []).slice(0, 5).map((r) => ({
          id: r.id,
          status: r.status,
          conclusion: r.conclusion,
          created_at: DateTime.fromISO(r.created_at).setZone('Asia/Kolkata').toFormat('dd MMM yyyy, hh:mm a'),
          url: r.html_url,
          jobs_url: r.jobs_url,
        }));

        return { id: wf.id, name: wf.name, state: wf.state, path: wf.path, schedules, prevRuns };
      });

      const workflowsWithRuns = await Promise.all(workflowPromises);

      // Compute quick metrics from prevRuns/jobs
      let totalJobMinutes = 0,
        totalRuns = 0,
        failedJobsMinutes = 0,
        failedJobsCount = 0,
        allJobDurations = [],
        allQueueTimes = [];

      const jobPromises = workflowsWithRuns.flatMap((wf) =>
        wf.prevRuns.map(async (run) => {
          totalRuns++;
          const runCreatedISO = DateTime.fromFormat(run.created_at, 'dd LLL yyyy, hh:mm a', { zone: 'Asia/Kolkata' }).toISO();
          const jobs = await fetchJobs(run.jobs_url);
          for (const job of jobs || []) {
            if (!job.started_at || !job.completed_at) continue;
            const started = DateTime.fromISO(job.started_at);
            const completed = DateTime.fromISO(job.completed_at);
            const durationSec = Math.max(0, completed.diff(started, 'seconds').seconds || 0);
            const queueTime = started.diff(DateTime.fromISO(runCreatedISO), 'seconds').seconds || 0;

            allJobDurations.push(durationSec);
            allQueueTimes.push(queueTime);
            totalJobMinutes += durationSec / 60;

            if (job.conclusion !== 'success') {
              failedJobsCount++;
              failedJobsMinutes += durationSec / 60;
            }
          }
        })
      );

      await Promise.all(jobPromises);

      const metrics = {
        totalWorkflows: workflows.length,
        totalRuns,
        totalMinutes: totalJobMinutes.toFixed(1),
        failedJobMinutes: failedJobsMinutes.toFixed(1),
        avgRunTime: allJobDurations.length
          ? (allJobDurations.reduce((a, b) => a + b, 0) / allJobDurations.length).toFixed(1) + 's'
          : '0s',
        avgQueueTime: allQueueTimes.length
          ? (allQueueTimes.reduce((a, b) => a + b, 0) / allQueueTimes.length).toFixed(1) + 's'
          : '0s',
        failureRate: totalRuns ? ((failedJobsCount / totalRuns) * 100).toFixed(1) + '%' : '0%',
        lastUpdated: DateTime.now().setZone('Asia/Kolkata').toFormat('dd MMM yyyy, hh:mm a'),
      };

      return res.json({ metrics, workflows: workflowsWithRuns });
    } catch (err) {
      console.error('getAllData error:', err.response?.data || err.message);
      return res.status(500).json({ error: 'Failed to fetch GitHub Actions data' });
    }
  },

  getMetricsOnly: async (req, res) => {
  try {
    const workflowFilter = req.query.workflow || 'all';
    const workflows = await fetchWorkflows();

    const workflowsToProcess =
      workflowFilter === 'all'
        ? workflows
        : workflows.filter((w) => String(w.id) === String(workflowFilter));

    let totalJobMinutes = 0,
      totalRuns = 0,
      failedJobsMinutes = 0,
      failedJobsCount = 0,
      allJobDurations = [],
      allQueueTimes = [];

    const workflowRunPromises = workflowsToProcess.map(async (wf) => {
      const runs = await fetchRuns(wf);
      // Always use only the latest 100 runs per workflow
      return (runs || []).slice(0, 100).map((r) => ({ ...r, workflowId: wf.id }));
    });

    const runsNested = await Promise.all(workflowRunPromises);
    const allSelectedRuns = runsNested.flat();

    const jobFetchPromises = allSelectedRuns.map(async (r) => {
      totalRuns++;
      const runCreatedDT = DateTime.fromISO(r.created_at).setZone('Asia/Kolkata');
      const jobs = await fetchJobs(r.jobs_url);
      for (const job of jobs || []) {
        if (!job.started_at || !job.completed_at) continue;
        const started = DateTime.fromISO(job.started_at);
        const completed = DateTime.fromISO(job.completed_at);
        const durationSec = Math.max(0, completed.diff(started, 'seconds').seconds || 0);
        const queueTime = started.diff(runCreatedDT, 'seconds').seconds || 0;

        allJobDurations.push(durationSec);
        allQueueTimes.push(queueTime);
        totalJobMinutes += durationSec / 60;

        if (job.conclusion !== 'success') {
          failedJobsCount++;
          failedJobsMinutes += durationSec / 60;
        }
      }
    });

    await Promise.all(jobFetchPromises);

    const metrics = {
      totalWorkflows: workflows.length,
      totalRuns,
      totalMinutes: totalJobMinutes.toFixed(1),
      failedJobMinutes: failedJobsMinutes.toFixed(1),
      avgRunTime: allJobDurations.length
        ? (allJobDurations.reduce((a, b) => a + b, 0) / allJobDurations.length).toFixed(1) + 's'
        : '0s',
      avgQueueTime: allQueueTimes.length
        ? (allQueueTimes.reduce((a, b) => a + b, 0) / allQueueTimes.length).toFixed(1) + 's'
        : '0s',
      failureRate: totalRuns
        ? ((failedJobsCount / totalRuns) * 100).toFixed(1) + '%'
        : '0%',
      lastUpdated: DateTime.now()
        .setZone('Asia/Kolkata')
        .toFormat('dd MMM yyyy, hh:mm a'),
    };

    return res.json({ metrics });
  } catch (err) {
    console.error('getMetricsOnly error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Failed to fetch metrics' });
  }
},

  getWorkflowsOnly: async (req, res) => {
    try {
      const workflows = await fetchWorkflows();

      const workflowPromises = workflows.map(async (wf) => {
        const schedulesRaw = await fetchWorkflowYAML(wf);
        const schedules = getScheduleStrings(schedulesRaw);
        const allRuns = await fetchRuns(wf);
        const prevRuns = (allRuns || []).slice(0, 5).map((r) => ({
          id: r.id,
          status: r.status,
          conclusion: r.conclusion,
          created_at: DateTime.fromISO(r.created_at).setZone('Asia/Kolkata').toFormat('dd MMM yyyy, hh:mm a'),
          url: r.html_url,
          jobs_url: r.jobs_url,
        }));
        return { id: wf.id, name: wf.name, state: wf.state, path: wf.path, schedules, prevRuns };
      });

      const workflowsWithRuns = await Promise.all(workflowPromises);

      res.json({ workflows: workflowsWithRuns });
    } catch (err) {
      console.error('getWorkflowsOnly error:', err.response?.data || err.message);
      return res.status(500).json({ error: 'Failed to fetch workflows' });
    }
  },
};
