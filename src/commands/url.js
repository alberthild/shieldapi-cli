import { runCommand } from '../lib/command.js';
import { formatUrl } from '../lib/formatter.js';
import { isValidUrl } from '../lib/validator.js';

/**
 * Check URL safety.
 */
export async function urlCommand(url, opts) {
  await runCommand({
    endpoint: 'check-url',
    paramName: 'url',
    paramValue: url,
    formatFn: formatUrl,
    spinnerText: `Checking URL: ${url}`,
    validateFn: isValidUrl,
    validateMsg: `Invalid URL: "${url}". Expected format: https://example.com.`,
  }, opts);
}
