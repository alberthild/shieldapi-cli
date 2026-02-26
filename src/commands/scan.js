import { createHash } from 'node:crypto';
import ora from 'ora';
import chalk from 'chalk';
import { apiRequest } from '../lib/api.js';
import { resolveWallet } from '../lib/wallet.js';
import { formatScan } from '../lib/formatter.js';
import { exitCodeFromResult, exitCodeFromError, EXIT } from '../lib/exit.js';

/**
 * Run a full security scan with multiple targets.
 */
export async function scanCommand(opts) {
  const params = {};

  if (opts.password) {
    // Shell history warning (C2: scan --password leak)
    if (!opts.quiet && process.stderr.isTTY) {
      process.stderr.write(
        chalk.yellow('⚠  Password may appear in shell history. Use `shieldapi password --stdin` for sensitive passwords.\n')
      );
    }
    params.password_hash = createHash('sha1').update(opts.password).digest('hex').toUpperCase();
  }
  if (opts.email) params.email = opts.email;
  if (opts.domain) params.domain = opts.domain;
  if (opts.ip) params.ip = opts.ip;
  if (opts.url) params.url = opts.url;

  if (Object.keys(params).length === 0) {
    process.stderr.write(chalk.red('Error: At least one target required. Use --email, --password, --domain, --ip, or --url.\n'));
    process.exitCode = EXIT.USAGE;
    return;
  }

  const spinner = opts.quiet ? null : ora({ text: 'Running full security scan...', stream: process.stderr }).start();

  try {
    const wallet = opts.demo ? null : resolveWallet(opts);

    const data = await apiRequest('full-scan', params, {
      demo: opts.demo,
      wallet,
    });

    spinner?.stop();

    if (opts.json) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      formatScan(data);
    }

    process.exitCode = exitCodeFromResult(data);
  } catch (err) {
    spinner?.fail(err.message);
    process.exitCode = exitCodeFromError(err);
  }
}
