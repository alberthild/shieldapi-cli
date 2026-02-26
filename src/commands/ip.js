import ora from 'ora';
import { apiRequest } from '../lib/api.js';
import { resolveWallet } from '../lib/wallet.js';
import { formatIp } from '../lib/formatter.js';

/**
 * Check IP reputation.
 */
export async function ipCommand(ip, opts) {
  const spinner = ora(`Checking IP: ${ip}`).start();

  try {
    const wallet = opts.demo ? null : resolveWallet(opts);

    const data = await apiRequest('check-ip', { ip }, {
      demo: opts.demo,
      wallet,
    });

    spinner.stop();

    if (opts.json) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      formatIp(data);
    }
  } catch (err) {
    spinner.fail(err.message);
    process.exitCode = 1;
  }
}
