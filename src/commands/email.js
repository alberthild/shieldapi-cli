import { runCommand } from '../lib/command.js';
import { formatEmail } from '../lib/formatter.js';
import { isValidEmail } from '../lib/validator.js';

/**
 * Check an email address for breaches.
 */
export async function emailCommand(email, opts) {
  await runCommand({
    endpoint: 'check-email',
    paramName: 'email',
    paramValue: email,
    formatFn: formatEmail,
    spinnerText: `Checking email: ${email}`,
    validateFn: isValidEmail,
    validateMsg: `Invalid email: "${email}". Expected format: user@example.com.`,
  }, opts);
}
