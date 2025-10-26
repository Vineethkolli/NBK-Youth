import ReactGA from 'react-ga4';

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Flag to avoid re-initializing GA
let initialized = false;
// Stored register id (e.g. operations user id) to attach to GA hits
let registerId = null;

export const initializeAnalytics = () => {
  if (!MEASUREMENT_ID || initialized) return;
  try {
    ReactGA.initialize(MEASUREMENT_ID);
    initialized = true;
  } catch (err) {
  }
};

// Allow other parts of the app to set the register id (user id) so that
// GA hits (pageviews/events) are attributed to this id. Call this after
// the operations user logs in or when the id becomes available.
export const setRegisterId = (id) => {
  if (!id) return;
  registerId = id;
  if (!initialized) return;
  try {
    // Set both common variants so it works with different GA setups.
    ReactGA.set({ user_id: id, userId: id });
  } catch (err) {
    // swallow errors silently as analytics should not break app flow
  }
};

// Track page views
export const trackPageView = (path) => {
  if (!initialized) return;
  try {
    // Include registerId (user_id) when present so pageviews are attributed
    // to the operations/user making the request.
    const payload = { hitType: 'pageview', page: path };
    if (registerId) payload.user_id = registerId;
    ReactGA.send(payload);
  } catch {}
};
