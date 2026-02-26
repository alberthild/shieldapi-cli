import ora from 'ora';
import { apiRequest } from '../lib/api.js';
import { resolveWallet } from '../lib/wallet.js';
import { formatUrl } from '../lib/formatter.js';

/**
 * Check URL safety.
 */
export async function urlCommand(url, opts) {
  const spinner = ora(`Checking URL: ${url}`).start();

  try {
    const wallet = opts.demo ? null : resolveWallet(opts);

    const data = await apiRequest('check-url', { url }, {
      demo: opts.demo,
      wallet,
    });

    spinner.stop();

    if (opts.json) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      formatUrl(data);
    }
  } catch (err) {
    spinner.fail(err.message);
    process.exitCode = 1;
  }
}
