import ora from 'ora';
import chalk from 'chalk';
import { apiRequest } from '../lib/api.js';
import { resolveWallet } from '../lib/wallet.js';
import { formatDomain } from '../lib/formatter.js';
import { exitCodeFromResult, exitCodeFromError } from '../lib/exit.js';

/**
 * Check domain reputation.
 */
export async function domainCommand(domain, opts) {
  const spinner = opts.quiet ? null : ora({ text: `Checking domain: ${domain}`, stream: process.stderr }).start();

  try {
    const wallet = opts.demo ? null : resolveWallet(opts);

    const data = await apiRequest('check-domain', { domain }, {
      demo: opts.demo,
      wallet,
    });

    spinner?.stop();

    if (opts.json) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      formatDomain(data);
    }

    process.exitCode = exitCodeFromResult(data);
  } catch (err) {
    spinner?.fail(err.message);
    process.exitCode = exitCodeFromError(err);
  }
}
