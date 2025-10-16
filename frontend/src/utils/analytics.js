import ReactGA from 'react-ga4';

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Flag to avoid re-initializing GA
let initialized = false;

export const initializeAnalytics = () => {
  if (!MEASUREMENT_ID || initialized) return;
  try {
    ReactGA.initialize(MEASUREMENT_ID);
    initialized = true;
  } catch (err) {
  }
};

// Track page views
export const trackPageView = (path) => {
  if (!initialized) return;
  try {
    ReactGA.send({ hitType: 'pageview', page: path });
  } catch {}
};
