import ReactGA from 'react-ga4';

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Avoid re-initializing GA
let initialized = false;
// --- ADDED ---
// Store the current user ID locally to ensure it's available for events
let currentUserId = null;
// --- END ADDED ---

export const initializeAnalytics = () => {
  if (!MEASUREMENT_ID || initialized) return;
  try {
    ReactGA.initialize(MEASUREMENT_ID);
    initialized = true;
  } catch (err) {
    console.error("Failed to initialize GA:", err);
  }
};

/**
 * Call this function when the user logs in and you have their ID
 * @param {string} userId - Your app's internal user ID (e.g., "R1", "R2")
 */
export const setAnalyticsUser = (userId) => {
  if (!initialized || !userId) return;
  try {
    // --- ADDED ---
    currentUserId = userId; // Store the ID locally
    // --- END ADDED ---
    ReactGA.set({ userId: userId }); // Still set it globally for GA
  } catch (err) {
    currentUserId = null; // Clear local ID if setting fails
    console.error("Failed to set GA User ID:", err);
  }
};

/**
 * Call this when the user logs out
 */
export const clearAnalyticsUser = () => {
  if (!initialized) return;
  try {
    // --- ADDED ---
    currentUserId = null; // Clear the local ID
    // --- END ADDED ---
    ReactGA.set({ userId: null }); // Clear the global GA ID
  } catch (err) {
    console.error("Failed to clear GA User ID:", err);
  }
};

/**
 * Track page views, ensuring userId is included if available
 * @param {string} path - The page path to track
 */
export const trackPageView = (path) => {
  if (!initialized) return;
  try {
    // --- MODIFIED ---
    const payload = { hitType: 'pageview', page: path };
    // Explicitly include the stored userId if it exists
    if (currentUserId) {
      payload.userId = currentUserId;
    }
    ReactGA.send(payload);
    // --- END MODIFIED ---
  } catch (err) {
    console.error("Failed to track page view:", err);
  }
};

/**
 * Tracks a specific event (like 'login' or 'signup'), ensuring userId is included
 * @param {string} eventName - The name of the event
 */
export const trackEvent = (eventName) => {
  if (!initialized || !eventName) return;
  try {
    // --- MODIFIED ---
    const payload = {}; // Start with empty payload for event parameters
    // Explicitly include the stored userId if it exists
    if (currentUserId) {
      payload.userId = currentUserId;
    }
    // Note: ReactGA.event sends the name first, then the parameters object
    ReactGA.event(eventName, payload);
    // --- END MODIFIED ---
  } catch (err) {
    console.error(`Failed to track event ${eventName}:`, err);
  }
};

/**
 * Sets a custom user property (like 'app_mode')
 * @param {string} propertyName - The name of the property
 * @param {string} propertyValue - The value
 */
export const setUserProperty = (propertyName, propertyValue) => {
  if (!initialized || !propertyName) return;
  try {
    // Setting user properties uses ReactGA.set()
    ReactGA.set({ [propertyName]: propertyValue });
  } catch (err) {
    console.error(`Failed to set user property ${propertyName}:`, err);
  }
};