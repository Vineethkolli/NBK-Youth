export const getDeviceInfo = async () => {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';

  const sanitize = (s) =>
    (s || '')
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-._]/g, '')
      .slice(0, 60) || 'unknown';

  // Detect Access Mode
  let accessMode = 'website';
  try {
    if (window.matchMedia?.('(display-mode: standalone)').matches) {
      accessMode = 'pwa';
    } else if (navigator.standalone) {
      accessMode = 'addtohomescreen';
    } else if (document.referrer?.includes('android-app://')) {
      accessMode = 'twa';
    }
  } catch {
    accessMode = 'unknown';
  }

  let browserName = 'unknown';
  let browserVersion = 'unknown';
  let osName = 'unknown';
  let osVersion = 'unknown';
  let deviceType = 'desktop';
  let deviceIdentifier = 'unknown';

  // Prefer Client Hints (modern browsers)
  if (navigator.userAgentData) {
    try {
      const uaData = navigator.userAgentData;
      const brands = uaData.brands || uaData.uaList || [];
      if (brands.length) {
        const realBrand = brands.find(b => b.brand && !/^not\?a_brand$/i.test(b.brand));
        if (realBrand) {
          browserName = realBrand.brand;
          browserVersion = realBrand.version || 'unknown';
        }
      }

      deviceType = uaData.mobile ? 'mobile' : 'desktop';

      const high = await uaData.getHighEntropyValues?.([
        'platform',
        'platformVersion',
        'model',
        'uaFullVersion'
      ]).catch(() => ({}));

      if (high) {
        osName = high.platform || osName;
        osVersion = String(high.platformVersion || osVersion);
        deviceIdentifier = sanitize(high.model);
        browserVersion = String(high.uaFullVersion || browserVersion);
      }
    } catch {
    }
  }

  // Browser name fallback
  if (browserName === 'unknown') {
    const uaLower = ua.toLowerCase();
    if (/edg\//i.test(uaLower)) browserName = 'edge';
    else if (/opr\/|opera/i.test(uaLower)) browserName = 'opera';
    else if (/chrome|crios|chromium/i.test(uaLower)) browserName = 'chrome';
    else if (/firefox|fxios/i.test(uaLower)) browserName = 'firefox';
    else if (/safari/i.test(uaLower)) browserName = 'safari';
    else if (/msie|trident/i.test(uaLower)) browserName = 'ie';
  }

  // Browser version fallback
  if (browserVersion === 'unknown') {
    try {
      const versionRegex =
        browserName === 'safari'
          ? /version\/([\d.]+)/i
          : new RegExp(`${browserName}[\\/ ]([\\d.]+)`, 'i');
      const v = ua.match(versionRegex);
      if (v?.[1]) browserVersion = v[1];
    } catch {}
  }

  // Device type detection
  if (deviceType === 'desktop') {
    const isTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(ua);
    const isMobile = /mobile|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua);
    deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';
  }

  // OS detection
  if (osName === 'unknown') {
    const patterns = [
      { name: 'Windows', regex: /Windows NT/i },
      { name: 'MacOS', regex: /Mac OS X/i },
      { name: 'iOS', regex: /iPhone|iPad|iPod/i },
      { name: 'Android', regex: /Android/i },
      { name: 'Linux', regex: /Linux/i },
    ];
    for (const o of patterns) {
      if (o.regex.test(ua)) {
        osName = o.name;
        break;
      }
    }
  }

  // OS version detection
  if (osVersion === 'unknown') {
    const v =
      ua.match(/Windows NT ([0-9._]+)/i) ||
      ua.match(/Mac OS X ([0-9_]+)/i) ||
      ua.match(/Android ([0-9.]+)/i) ||
      ua.match(/CPU (?:iPhone )?OS ([0-9_]+)/i);
    if (v?.[1]) osVersion = v[1].replace(/_/g, '.');
  }

  // Device model detection
  if (deviceIdentifier === 'unknown') {
    const inside = ua.match(/\(([^)]+)\)/)?.[1];
    const token = inside
      ?.split(';')
      .map((s) => s.trim())
      .find((s) => s.length > 1 && s.length < 60 && /[A-Za-z0-9]/.test(s));
    if (token) deviceIdentifier = sanitize(token);
  }

  return {
    accessMode,
    deviceType,
    deviceModel: deviceIdentifier,
    platform: osName.toLowerCase() || 'unknown',
    browser: {
      name: browserName.toLowerCase(),
      version: browserVersion,
      osName,
      osVersion
    }
  };
};
