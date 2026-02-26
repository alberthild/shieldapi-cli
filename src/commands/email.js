import ora from 'ora';
import { apiRequest } from '../lib/api.js';
import { resolveWallet } from '../lib/wallet.js';
import { formatEmail } from '../lib/formatter.js';

/**
 * Check an email address for breaches.
 */
export async function emailCommand(email, opts) {
  const spinner = ora(`Checking email: ${email}`).start();

  try {
    const wallet = opts.demo ? null : resolveWallet(opts);

    const data = await apiRequest('check-email', { email }, {
      demo: opts.demo,
      wallet,
    });

    spinner.stop();

    if (opts.json) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      formatEmail(data, email);
    }
  } catch (err) {
    spinner.fail(err.message);
    process.exitCode = 1;
  }
}
