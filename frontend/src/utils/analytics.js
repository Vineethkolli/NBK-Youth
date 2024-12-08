import ReactGA from 'react-ga4';

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export const initializeAnalytics = () => {
  if (!MEASUREMENT_ID) {
    console.warn('Google Analytics Measurement ID is not configured. Tracking is disabled.');
    return;
  }

  try {
    // Initialize Google Analytics
    ReactGA.initialize(MEASUREMENT_ID);
    console.log('Google Analytics initialized.');
  } catch (error) {
    console.error('Failed to initialize Google Analytics:', error);
  }
};

export const trackPageView = (path) => {
  if (!MEASUREMENT_ID) return;
  try {
    ReactGA.send({ hitType: 'pageview', page: path });
    console.log(`Page view tracked: ${path}`);
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
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
    console.log(`Event tracked: ${category}, ${action}`);
  } catch (error) {
    console.error('Failed to track event:', error);
  }
};
