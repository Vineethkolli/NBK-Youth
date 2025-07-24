export const ROLES = {
  DEVELOPER: 'developer',
  FINANCIER: 'financier',
  ADMIN: 'admin',
  USER: 'user'
};

export const hasPermission = (userRole, requiredRoles) => {
  if (!userRole || !requiredRoles) return false;
  return requiredRoles.includes(userRole);
};

export const PRIVILEGED_ROLES = [ROLES.DEVELOPER, ROLES.FINANCIER, ROLES.ADMIN];

export const canManageIncome = (role) => 
  hasPermission(role, [ROLES.DEVELOPER, ROLES.FINANCIER, ROLES.ADMIN]);

export const canAccessModificationLog = (role) =>
  hasPermission(role, [ROLES.DEVELOPER, ROLES.FINANCIER]);

export const canDeleteIncome = (role) =>
  hasPermission(role, [ROLES.DEVELOPER, ROLES.FINANCIER]);