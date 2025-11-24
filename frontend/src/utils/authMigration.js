/**
 * Migration utility to clean up old authentication system
 * Run this once after deploying the new authentication system
 */

// Clear old token from localStorage
export const clearOldAuthData = () => {
  try {
    // Remove old token
    const oldToken = localStorage.getItem('token');
    if (oldToken) {
      console.log('Clearing old authentication token...');
      localStorage.removeItem('token');
    }
    
    return true;
  } catch (error) {
    console.error('Migration error:', error);
    return false;
  }
};

// Check if user needs to re-authenticate
export const needsReAuthentication = () => {
  // If there's an old token but no valid session, user needs to re-login
  const oldToken = localStorage.getItem('token');
  return !!oldToken;
};

// Run migration on app load (called once)
export const runAuthMigration = () => {
  const migrated = clearOldAuthData();
  
  if (migrated) {
    console.log('✅ Authentication migration completed');
  }
  
  return migrated;
};

export default {
  clearOldAuthData,
  needsReAuthentication,
  runAuthMigration
};
