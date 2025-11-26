import { UAParser } from "ua-parser-js";

export const getDeviceInfo = async () => {
  const ua = navigator.userAgent || "";
  const uaLower = ua.toLowerCase();
  const parser = new UAParser(ua);
  const parsed = parser.getResult();

  let browserName = parsed.browser.name?.toLowerCase() || "unknown";
  let osName = parsed.os.name || "unknown";
  let osVersion = parsed.os.version || "unknown";
  let deviceType = parsed.device.type || "desktop";
  let deviceModel = parsed.device.model || "unknown";

  // Access Mode
  let accessMode = "website";
  try {
    if (window.matchMedia?.("(display-mode: standalone)").matches) {
      accessMode = "pwa";
    } else if (navigator.standalone) {
      accessMode = "addtohomescreen";
    } else if (document.referrer.includes("android-app://")) {
      accessMode = "twa";
    }
  } catch {}

  // Client Hints
  if (navigator.userAgentData) {
    try {
      const high = await navigator.userAgentData
        .getHighEntropyValues?.(["platform", "platformVersion", "model"])
        .catch(() => null);

      if (high?.platform) osName = high.platform;
      if (high?.platformVersion) osVersion = high.platformVersion;
      if (high?.model && high.model !== "") deviceModel = high.model;

      deviceType = navigator.userAgentData.mobile ? "mobile" : deviceType;
    } catch {}
  }

  // Tablets detection
  const tabletRegex =
    /ipad|tablet|tab|galaxy tab|sm-t|lenovo tb|nexus 7|nexus 10|xoom|shield tablet/i;

  const isTablet =
    parsed.device.type === "tablet" || 
    tabletRegex.test(uaLower) ||      
    /ipad/i.test(uaLower);            

  if (isTablet) {
    deviceType = "tablet";

    if (/ipad/i.test(uaLower)) {
      deviceModel = "iPad";
      if (osName === "macOS") osName = "iOS";
    }
  }

  // OS fallback detection
  if (osName === "unknown") {
    if (/windows/i.test(uaLower)) osName = "Windows";
    else if (/mac os x|macintosh/i.test(uaLower)) osName = "macOS";
    else if (/iphone|ipad|ipod/i.test(uaLower)) osName = "iOS";
    else if (/android/i.test(uaLower)) osName = "Android";
    else if (/linux/i.test(uaLower)) osName = "Linux";
  }

  // Windows version normalization
  if (osName.toLowerCase() === "windows" && osVersion !== "unknown") {
    const v = Number(osVersion.split(".")[0]);
    if (v >= 13 && v <= 24) osVersion = "10/11";
    else if (v < 13 && v >= 1) osVersion = "7/8/8.1";
  }

  // UA version fallback
  if (osVersion === "unknown") {
    const m =
      ua.match(/Windows NT ([0-9.]+)/i) ||
      ua.match(/Mac OS X ([0-9_]+)/i) ||
      ua.match(/Android ([0-9.]+)/i) ||
      ua.match(/OS ([0-9_]+)/i);

    if (m?.[1]) osVersion = m[1].replace(/_/g, ".");
  }

  // Device model fallback
  if (deviceModel === "unknown") {
    if (deviceType === "desktop") {
      if (/windows/i.test(uaLower)) deviceModel = "Windows PC";
      else if (/mac/i.test(uaLower)) deviceModel = "Mac";
      else if (/linux/i.test(uaLower)) deviceModel = "Linux PC";
    } else {
      const inside = ua.match(/\(([^)]+)\)/)?.[1];
      if (inside) {
        const parts = inside.split(";").map((p) => p.trim());
        const token = parts.find(
          (p) =>
            /[A-Za-z0-9]/.test(p) &&
            !/windows|android|linux|mac|intel|iphone|ipad|cpu|build/i.test(p)
        );
        if (token) deviceModel = token;
      }
    }
  }

  return {
    deviceType,
    deviceModel,
    os: osVersion !== "unknown" ? `${osName} ${osVersion}` : osName,
    browserName,
    accessMode,
  };
};
