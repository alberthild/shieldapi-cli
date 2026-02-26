import { runCommand } from '../lib/command.js';
import { formatDomain } from '../lib/formatter.js';
import { isValidDomain } from '../lib/validator.js';

/**
 * Check domain reputation.
 */
export async function domainCommand(domain, opts) {
  await runCommand({
    endpoint: 'check-domain',
    paramName: 'domain',
    paramValue: domain,
    formatFn: formatDomain,
    spinnerText: `Checking domain: ${domain}`,
    validateFn: isValidDomain,
    validateMsg: `Invalid domain: "${domain}". Provide a domain without protocol (e.g. example.com).`,
  }, opts);
}
