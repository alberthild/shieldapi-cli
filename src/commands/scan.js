import { createHash } from 'node:crypto';
import ora from 'ora';
import { apiRequest } from '../lib/api.js';
import { resolveWallet } from '../lib/wallet.js';
import { formatScan } from '../lib/formatter.js';

/**
 * Run a full security scan with multiple targets.
 */
export async function scanCommand(opts) {
  const params = {};

  if (opts.password) {
    params.password_hash = createHash('sha1').update(opts.password).digest('hex').toUpperCase();
  }
  if (opts.email) params.email = opts.email;
  if (opts.domain) params.domain = opts.domain;
  if (opts.ip) params.ip = opts.ip;
  if (opts.url) params.url = opts.url;

  if (Object.keys(params).length === 0) {
    console.error('Error: At least one target required. Use --email, --password, --domain, --ip, or --url.');
    process.exitCode = 1;
    return;
  }

  const spinner = ora('Running full security scan...').start();

  try {
    const wallet = opts.demo ? null : resolveWallet(opts);

    const data = await apiRequest('full-scan', params, {
      demo: opts.demo,
      wallet,
    });

    spinner.stop();

    if (opts.json) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      formatScan(data);
    }
  } catch (err) {
    spinner.fail(err.message);
    process.exitCode = 1;
  }
}
