import axios from 'axios';
import yaml from 'js-yaml';
import { DateTime } from 'luxon';

export const githubActionsController = {
  getWorkflows: async (req, res) => {
    try {
      const owner = process.env.GITHUB_OWNER;
      const repo = process.env.GITHUB_REPO;
      const token = process.env.GITHUB_TOKEN;
      const headers =
        token && token.trim() !== '' ? { Authorization: `Bearer ${token}` } : {};
      const apiBase = `https://api.github.com/repos/${owner}/${repo}/actions`;

      const { data: workflowsData } = await axios.get(`${apiBase}/workflows`, { headers });
      const workflows = workflowsData.workflows || [];

      let totalJobMinutes = 0;
      let totalRuns = 0;
      let failedJobsMinutes = 0;
      let failedJobsCount = 0;
      let allJobDurations = [];
      let allQueueTimes = [];

      const result = [];

      for (const wf of workflows) {
        // Get workflow YAML
        const { data: fileData } = await axios.get(
          `https://api.github.com/repos/${owner}/${repo}/contents/${wf.path}`,
          { headers }
        );
        const yamlContent = Buffer.from(fileData.content, 'base64').toString('utf8');
        const parsed = yaml.load(yamlContent);
        const schedules = parsed?.on?.schedule || [];

        // Skip next run calculations (cron-parser removed)
        const nextRuns = []; // intentionally left empty

        // Previous runs
        const { data: runsData } = await axios.get(
          `${apiBase}/workflows/${wf.id}/runs?per_page=100`,
          { headers }
        );
        const prevRuns = [];
        for (const r of runsData.workflow_runs || []) {
          totalRuns++;
          const runCreated = DateTime.fromISO(r.created_at);
          const runStarted = DateTime.fromISO(r.run_started_at);
          const queueTime = runStarted.diff(runCreated, 'seconds').seconds || 0;

          // Fetch jobs for this run
          const { data: jobsData } = await axios.get(r.jobs_url, { headers });
          for (const job of jobsData.jobs || []) {
            const started = DateTime.fromISO(job.started_at);
            const completed = DateTime.fromISO(job.completed_at);
            const durationSec = completed.diff(started, 'seconds').seconds || 0;

            allJobDurations.push(durationSec);
            allQueueTimes.push(queueTime);
            totalJobMinutes += durationSec / 60;

            if (job.conclusion !== 'success') {
              failedJobsCount++;
              failedJobsMinutes += durationSec / 60;
            }
          }

          prevRuns.push({
            id: r.id,
            status: r.status,
            conclusion: r.conclusion,
            created_at: DateTime.fromISO(r.created_at)
              .setZone('Asia/Kolkata')
              .toFormat('dd MMM yyyy, hh:mm a'),
            url: r.html_url,
          });
        }

        result.push({
          id: wf.id,
          name: wf.name,
          path: wf.path,
          state: wf.state,
          nextRuns, // still included as empty array for compatibility
          prevRuns: prevRuns.slice(0, 5),
        });
      }

      const metrics = {
        avgRunTime: allJobDurations.length
          ? `${(allJobDurations.reduce((a, b) => a + b, 0) / allJobDurations.length).toFixed(1)}s`
          : '0s',
        avgQueueTime: allQueueTimes.length
          ? `${(allQueueTimes.reduce((a, b) => a + b, 0) / allQueueTimes.length).toFixed(1)}s`
          : '0s',
        failureRate: totalRuns
          ? `${((failedJobsCount / totalRuns) * 100).toFixed(1)}%`
          : '0%',
        failedJobMinutes: failedJobsMinutes.toFixed(1),
        totalMinutes: totalJobMinutes.toFixed(1),
        totalRuns,
        lastUpdated: DateTime.now()
          .setZone('Asia/Kolkata')
          .toFormat('dd MMM yyyy, hh:mm a'),
      };

      res.json({ metrics, workflows: result });
    } catch (err) {
      console.error('Error fetching GitHub Actions data:', err.response?.data || err.message);
      res.status(500).json({ error: 'Failed to fetch GitHub Actions data' });
    }
  },
};
