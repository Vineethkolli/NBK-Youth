import 'dotenv/config';

const API_KEY = process.env.RENDER_API_KEY;
const SERVICE_ID = process.env.RENDER_SERVICE_ID;
const BASE_URL = 'https://api.render.com/v1';

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  Accept: 'application/json',
};

async function renderFetch(url) {
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`Render API failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  return { start: start.toISOString(), end: now.toISOString() };
}

function getMetricParams() {
  const { start, end } = getMonthRange();
  return new URLSearchParams({ startTime: start, endTime: end, resource: SERVICE_ID });
}

function sumMetricValues(data) {
  return (data || []).reduce(
    (total, series) => total + (series.values || []).reduce((sum, item) => sum + Number(item.value || 0), 0),
    0
  );
}

function extractSource(data, sourceName) {
  const item = (data || []).find((series) =>
    series.labels?.some((label) => label.field === 'trafficSource' && label.value === sourceName)
  );

  return (item?.values || []).reduce((total, value) => total + Number(value.value || 0), 0);
}

function formatMB(mb) {
  if (mb < 1) return `${(mb * 1024).toFixed(2)} KB`;
  return `${mb.toFixed(2)} MB`;
}

function formatPercent(used, limit) {
  return limit ? Number(((used / limit) * 100).toFixed(1)) : 0;
}

export const renderController = {
  getUsage: async (req, res) => {
    if (!API_KEY || !SERVICE_ID) {
      return res.status(503).json({ message: 'Render monitor is not configured' });
    }

    try {
      const servicesData = await renderFetch(`${BASE_URL}/services?limit=100`);
      const services = (servicesData || []).filter((item) => item.service).map((item) => item.service);
      const customDomains = await Promise.all(
        services.map((service) => renderFetch(`${BASE_URL}/services/${service.id}/custom-domains?limit=100`))
      );
      const bandwidth = await renderFetch(`${BASE_URL}/metrics/bandwidth?${getMetricParams()}`);
      const sources = await renderFetch(`${BASE_URL}/metrics/bandwidth-sources?${getMetricParams()}`);

      const bandwidthUsedMB = sumMetricValues(bandwidth);
      const breakdown = {
        serviceInitiated: extractSource(sources, 'nat'),
        httpResponses: extractSource(sources, 'http'),
        websocketResponses: extractSource(sources, 'websocket'),
        privateLink: extractSource(sources, 'privatelink'),
      };
      const limits = { customDomains: 2, services: 25, bandwidthMB: 5120 };
      const customDomainCount = customDomains.reduce(
        (total, domains) => total + (domains || []).filter((item) => item.customDomain).length,
        0
      );

      return res.json({
        updatedAt: new Date().toISOString(),
        period: 'Current month',
        resources: {
          customDomains: { used: customDomainCount, limit: limits.customDomains, usagePercent: formatPercent(customDomainCount, limits.customDomains) },
          services: { used: services.length, limit: limits.services, usagePercent: formatPercent(services.length, limits.services) },
          bandwidth: { usedMB: bandwidthUsedMB, used: formatMB(bandwidthUsedMB), limitMB: limits.bandwidthMB, limit: '5 GB', usagePercent: formatPercent(bandwidthUsedMB, limits.bandwidthMB) },
        },
        breakdown: Object.fromEntries(Object.entries(breakdown).map(([key, value]) => [key, { valueMB: value, value: formatMB(value) }])),
      });
    } catch (error) {
      console.error('Render usage error:', error.message);
      return res.status(502).json({ message: 'Failed to fetch Render usage' });
    }
  },
};