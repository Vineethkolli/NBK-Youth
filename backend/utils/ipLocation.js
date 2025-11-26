import axios from 'axios';

export const getLocationFromIP = async (ip) => {
  const defaultLocation = { city: null, state: null, country: null };

  if (!ip) return defaultLocation;

  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}`, {
      params: { fields: 'status,city,regionName,country' },
      timeout: 2000
    });

    if (response.data && response.data.status === 'success') {
      return {
        city: response.data.city || null,
        state: response.data.regionName || null,
        country: response.data.country || null
      };
    }
  } catch (error) {
    console.warn('ip-api.com failed, trying backup:', error.message);
  }

  try {
    const response = await axios.get(`https://ipwho.is/${ip}`, {
      timeout: 3000
    });

    if (response.data && response.data.success !== false) {
      return {
        city: response.data.city || null,
        state: response.data.region || null,
        country: response.data.country || null
      };
    }
  } catch (error) {
    console.warn('ipwho.is also failed:', error.message);
  }

  return defaultLocation;
};
