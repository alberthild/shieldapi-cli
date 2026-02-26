import ora from 'ora';
import { apiRequest } from '../lib/api.js';
import { resolveWallet } from '../lib/wallet.js';
import { formatDomain } from '../lib/formatter.js';

/**
 * Check domain reputation.
 */
export async function domainCommand(domain, opts) {
  const spinner = ora(`Checking domain: ${domain}`).start();

  try {
    const wallet = opts.demo ? null : resolveWallet(opts);

    const data = await apiRequest('check-domain', { domain }, {
      demo: opts.demo,
      wallet,
    });

    spinner.stop();

    if (opts.json) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      formatDomain(data);
    }
  } catch (err) {
    spinner.fail(err.message);
    process.exitCode = 1;
  }
}
