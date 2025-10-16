import ReactGA from 'react-ga4';

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export const initializeAnalytics = () => {
  try {
    // Initialize Google Analytics
    ReactGA.initialize(MEASUREMENT_ID);
  } catch {}
};

export const trackPageView = (path) => {
  if (!MEASUREMENT_ID) return;
  try {
    ReactGA.send({ hitType: 'pageview', page: path });
  } catch {}
};

export const trackEvent = (category, action, label = null, value = null) => {
  if (!MEASUREMENT_ID) return;
  try {
    ReactGA.event({
      category,
      action,
      ...(label && { label }),
      ...(value && { value }),
    });
  } catch {}
};
