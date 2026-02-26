import { createHash } from 'node:crypto';
import ora from 'ora';
import { apiRequest } from '../lib/api.js';
import { resolveWallet } from '../lib/wallet.js';
import { formatPassword } from '../lib/formatter.js';

/**
 * Check a password against breach databases.
 * Hashes locally with SHA-1, sends hash to API.
 */
export async function passwordCommand(password, opts) {
  const spinner = ora('Checking password...').start();

  try {
    const hash = createHash('sha1').update(password).digest('hex').toUpperCase();
    const wallet = opts.demo ? null : resolveWallet(opts);

    const data = await apiRequest('check-password', { hash }, {
      demo: opts.demo,
      wallet,
    });

    spinner.stop();

    if (opts.json) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      formatPassword(data, hash);
    }
  } catch (err) {
    spinner.fail(err.message);
    process.exitCode = 1;
  }
}
