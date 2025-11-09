// Version configuration for the application
// Update this file when releasing new versions

export const APP_VERSION = {
  version: '1.0.0',
  releaseDate: '2025-01-09',
  changes: {
    whatsNew: [
      'Enhanced user interface with improved navigation',
      'New activity monitoring dashboard',
      'Real-time notifications for important events',
      'Improved profile management features'
    ],
    bugFixes: [
      'Fixed authentication session timeout issues',
      'Resolved data synchronization delays',
      'Corrected display issues on mobile devices',
      'Fixed payment processing edge cases'
    ],
    securityUpdates: [
      'Enhanced encryption for sensitive data',
      'Updated authentication token management',
      'Improved API security headers',
      'Patched XSS vulnerabilities'
    ]
  }
};

export default APP_VERSION;
