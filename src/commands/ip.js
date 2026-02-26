import { runCommand } from '../lib/command.js';
import { formatIp } from '../lib/formatter.js';
import { isValidIPv4 } from '../lib/validator.js';

/**
 * Check IP reputation.
 */
export async function ipCommand(ip, opts) {
  await runCommand({
    endpoint: 'check-ip',
    paramName: 'ip',
    paramValue: ip,
    formatFn: formatIp,
    spinnerText: `Checking IP: ${ip}`,
    validateFn: isValidIPv4,
    validateMsg: `Invalid IPv4 address: "${ip}". Expected format: 1.2.3.4.`,
  }, opts);
}
