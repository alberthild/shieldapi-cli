import ora from 'ora';
import chalk from 'chalk';
import { apiRequest } from '../lib/api.js';
import { resolveWallet } from '../lib/wallet.js';
import { formatEmail } from '../lib/formatter.js';
import { exitCodeFromResult, exitCodeFromError } from '../lib/exit.js';

/**
 * Check an email address for breaches.
 */
export async function emailCommand(email, opts) {
  const spinner = opts.quiet ? null : ora({ text: `Checking email: ${email}`, stream: process.stderr }).start();

  try {
    const wallet = opts.demo ? null : resolveWallet(opts);

    const data = await apiRequest('check-email', { email }, {
      demo: opts.demo,
      wallet,
    });

    spinner?.stop();

    if (opts.json) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      formatEmail(data, email);
    }

    process.exitCode = exitCodeFromResult(data);
  } catch (err) {
    spinner?.fail(err.message);
    process.exitCode = exitCodeFromError(err);
  }
}
