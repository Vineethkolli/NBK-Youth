import ReactGA from 'react-ga4';

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Avoid re-initializing GA
let initialized = false;

export const initializeAnalytics = () => {
  if (!MEASUREMENT_ID || initialized) return;
  try {
    ReactGA.initialize(MEASUREMENT_ID);
    initialized = true;
  } catch (err) {
    console.error("Failed to initialize GA:", err);
  }
};

// Call function when the user logs in and have their registerId
export const setAnalyticsUser = (userId) => {
  if (!initialized || !userId) return;
  try {
    ReactGA.set({ userId: userId });
  } catch (err) {
    console.error("Failed to set GA User ID:", err);
  }
};

// Call this when the user logs out
export const clearAnalyticsUser = () => {
  if (!initialized) return;
  try {
    ReactGA.set({ userId: null });
  } catch (err) {
    console.error("Failed to clear GA User ID:", err);
  }
};

// Track page views
export const trackPageView = (path) => {
  if (!initialized) return;
  try {
    ReactGA.send({ hitType: 'pageview', page: path });
  } catch (err) {
    console.error("Failed to track page view:", err);
  }
};