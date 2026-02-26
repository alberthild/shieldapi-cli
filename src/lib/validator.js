/**
 * Input validators for fast-fail before API calls.
 */

/**
 * Check if string is a plausible email address.
 * @param {string} s
 * @returns {boolean}
 */
export function isValidEmail(s) {
  if (!s || typeof s !== 'string') return false;
  const parts = s.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  return local.length > 0 && domain.includes('.') && domain.length > 2;
}

/**
 * Check if string is a valid IPv4 address.
 * @param {string} s
 * @returns {boolean}
 */
export function isValidIPv4(s) {
  if (!s || typeof s !== 'string') return false;
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(s);
}

/**
 * Check if string is a valid domain (no protocol prefix, contains a dot).
 * @param {string} s
 * @returns {boolean}
 */
export function isValidDomain(s) {
  if (!s || typeof s !== 'string') return false;
  if (s.startsWith('http://') || s.startsWith('https://')) return false;
  return s.includes('.') && s.length > 3 && !s.includes(' ');
}

/**
 * Check if string is a valid URL (starts with http:// or https://).
 * @param {string} s
 * @returns {boolean}
 */
export function isValidUrl(s) {
  if (!s || typeof s !== 'string') return false;
  return s.startsWith('http://') || s.startsWith('https://');
}
