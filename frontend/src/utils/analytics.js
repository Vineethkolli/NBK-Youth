import ReactGA from 'react-ga4';

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export const initializeAnalytics = () => {
  if (!MEASUREMENT_ID) {
    console.warn('Google Analytics Measurement ID is not configured');
    return;
  }

  // Initialize Google Analytics
  ReactGA.initialize(MEASUREMENT_ID);
  
};

export const trackPageView = (path) => {
  if (!MEASUREMENT_ID) return;
  ReactGA.send({ hitType: "pageview", page: path });
};

export const trackEvent = (category, action, label = null, value = null) => {
  if (!MEASUREMENT_ID) return;
  ReactGA.event({
    category,
    action,
    ...(label && { label }),
    ...(value && { value })
  });
};