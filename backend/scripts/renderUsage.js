// Command:
// node scripts/renderUsage.js

import "dotenv/config";

const API_KEY = process.env.RENDER_API_KEY;
const SERVICE_ID = process.env.RENDER_SERVICE_ID;

if (!API_KEY || !SERVICE_ID) {
  console.error("❌ Missing RENDER_API_KEY or RENDER_SERVICE_ID");
  process.exit(1);
}

const BASE_URL = "https://api.render.com/v1";

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  Accept: "application/json",
};

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

async function renderFetch(url) {
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `Render API failed: ${response.status} ${response.statusText}\n${body}`
    );
  }

  return response.json();
}

function formatMB(mb) {
  if (mb < 1) {
    return `${(mb * 1024).toFixed(2)} KB`;
  }

  return `${mb.toFixed(2)} MB`;
}

function percent(used, limit) {
  return limit ? ((used / limit) * 100).toFixed(1) : "0.0";
}

function getMonthRange() {
  const now = new Date();

  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  return {
    start: start.toISOString(),
    end: now.toISOString(),
  };
}

// ------------------------------------------------------------
// SERVICES
// ------------------------------------------------------------

async function getServices() {
  const data = await renderFetch(
    `${BASE_URL}/services?limit=100`
  );

  return data
    .filter((item) => item.service)
    .map((item) => item.service);
}

// ------------------------------------------------------------
// CUSTOM DOMAINS
// ------------------------------------------------------------

async function getCustomDomains(serviceId) {
  const data = await renderFetch(
    `${BASE_URL}/services/${serviceId}/custom-domains?limit=100`
  );

  return data
    .filter((item) => item.customDomain)
    .map((item) => item.customDomain);
}

// ------------------------------------------------------------
// BANDWIDTH
// ------------------------------------------------------------

async function getBandwidth() {
  const { start, end } = getMonthRange();

  const params = new URLSearchParams({
    startTime: start,
    endTime: end,
    resource: SERVICE_ID,
  });

  return renderFetch(
    `${BASE_URL}/metrics/bandwidth?${params}`
  );
}

// ------------------------------------------------------------
// BANDWIDTH SOURCES
// ------------------------------------------------------------

async function getBandwidthSources() {
  const { start, end } = getMonthRange();

  const params = new URLSearchParams({
    startTime: start,
    endTime: end,
    resource: SERVICE_ID,
  });

  return renderFetch(
    `${BASE_URL}/metrics/bandwidth-sources?${params}`
  );
}

// ------------------------------------------------------------
// EXTRACT BANDWIDTH SOURCE
// ------------------------------------------------------------

function extractSource(data, sourceName) {
  const item = data.find((item) =>
    item.labels?.some(
      (label) =>
        label.field === "trafficSource" &&
        label.value === sourceName
    )
  );

  if (!item) return 0;

  return item.values.reduce(
    (total, value) =>
      total + Number(value.value || 0),
    0
  );
}

// ------------------------------------------------------------
// MAIN
// ------------------------------------------------------------

async function main() {
  try {
    console.clear();

    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "                 RENDER USAGE MONITOR"
    );
    console.log(
      "============================================================"
    );
    console.log("");

    // --------------------------------------------------------
    // FETCH SERVICES
    // --------------------------------------------------------

    const services = await getServices();
    const serviceCount = services.length;

    // --------------------------------------------------------
    // FETCH CUSTOM DOMAINS
    // --------------------------------------------------------

    let customDomainCount = 0;

    for (const service of services) {
      const domains = await getCustomDomains(service.id);
      customDomainCount += domains.length;
    }

    // --------------------------------------------------------
    // FETCH BANDWIDTH
    // --------------------------------------------------------

    const bandwidthData = await getBandwidth();

    const bandwidthUsedMB =
      bandwidthData.reduce(
        (total, series) =>
          total +
          (series.values?.reduce(
            (sum, item) =>
              sum + Number(item.value || 0),
            0
          ) || 0),
        0
      );

    // --------------------------------------------------------
    // FETCH BANDWIDTH BREAKDOWN
    // --------------------------------------------------------

    const sourcesData =
      await getBandwidthSources();

    const serviceInitiatedMB =
      extractSource(
        sourcesData,
        "nat"
      );

    const httpResponsesMB =
      extractSource(
        sourcesData,
        "http"
      );

    const websocketResponsesMB =
      extractSource(
        sourcesData,
        "websocket"
      );

    const privateLinkMB =
      extractSource(
        sourcesData,
        "privatelink"
      );

    // --------------------------------------------------------
    // LIMITS
    // --------------------------------------------------------

    const limits = {
      customDomains: 2,
      services: 25,
      bandwidthMB: 5120,
    };

    // --------------------------------------------------------
    // DISPLAY
    // --------------------------------------------------------

    console.log(
      " Resource                         Used        Limit       Usage"
    );

    console.log(
      " ----------------------------------------------------------------"
    );

    console.log(
      ` Included Custom Domains`.padEnd(34) +
      `${customDomainCount}`.padStart(12) +
      `${limits.customDomains}`.padStart(12) +
      `${percent(
        customDomainCount,
        limits.customDomains
      )}%`.padStart(12)
    );

    console.log(
      ` Included Services`.padEnd(34) +
      `${serviceCount}`.padStart(12) +
      `${limits.services}`.padStart(12) +
      `${percent(
        serviceCount,
        limits.services
      )}%`.padStart(12)
    );

    console.log(
      ` Included Bandwidth`.padEnd(34) +
      `${formatMB(bandwidthUsedMB)}`.padStart(12) +
      `5 GB`.padStart(12) +
      `${percent(
        bandwidthUsedMB,
        limits.bandwidthMB
      )}%`.padStart(12)
    );

    console.log(
      " ----------------------------------------------------------------"
    );

    // --------------------------------------------------------
    // BANDWIDTH BREAKDOWN
    // --------------------------------------------------------

    console.log("");
    console.log(" BANDWIDTH BREAKDOWN");

    console.log(
      " ----------------------------------------------------------------"
    );

    console.log(
      ` Service-Initiated               ${formatMB(
        serviceInitiatedMB
      )}`
    );

    console.log(
      ` HTTP Responses                  ${formatMB(
        httpResponsesMB
      )}`
    );

    console.log(
      ` WebSocket Responses             ${formatMB(
        websocketResponsesMB
      )}`
    );

    console.log(
      ` Service-Initiated (Private Link) ${formatMB(
        privateLinkMB
      )}`
    );

    console.log(
      " ----------------------------------------------------------------"
    );

    console.log("");
    console.log(
      ` Updated: ${new Date().toLocaleString()}`
    );

    console.log("");

    console.log(
      "============================================================"
    );

  } catch (error) {
    console.error("");
    console.error("❌ ERROR");
    console.error("----------------------------------------");
    console.error(error.message);
    console.error("");
    process.exit(1);
  }
}

main();
