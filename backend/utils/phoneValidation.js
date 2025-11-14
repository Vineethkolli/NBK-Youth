import { parsePhoneNumberFromString } from 'libphonenumber-js';

export const normalizePhoneNumber = (phoneNumber) => {
  if (!phoneNumber || typeof phoneNumber !== 'string' || !phoneNumber.trim()) {
    return null;
  }

  const normalized = phoneNumber.trim().replace(/^00/, '+').replace(/[()\s-]+/g, '');
  let parsed;

  if (normalized.startsWith('+')) {
    parsed = parsePhoneNumberFromString(normalized);
  } else if (/^\d{6,15}$/.test(normalized)) {
    parsed = parsePhoneNumberFromString(`+${normalized}`);
  }

  if (!parsed || !parsed.isValid()) {
    return null;
  }

  return parsed.number;
};
