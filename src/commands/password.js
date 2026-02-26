import { createHash } from 'node:crypto';
import { createInterface } from 'node:readline';
import ora from 'ora';
import chalk from 'chalk';
import { apiRequest } from '../lib/api.js';
import { resolveWallet } from '../lib/wallet.js';
import { formatPassword } from '../lib/formatter.js';
import { exitCodeFromResult, exitCodeFromError, EXIT } from '../lib/exit.js';

/**
 * Read a line from stdin (for --stdin mode).
 */
function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    const rl = createInterface({ input: process.stdin });
    rl.on('line', (line) => { data = line; rl.close(); });
    rl.on('close', () => resolve(data.trim()));
    rl.on('error', reject);
    // Timeout after 10s
    setTimeout(() => { rl.close(); reject(new Error('Stdin timeout — no input received')); }, 10000);
  });
}

/**
 * Check a password against breach databases.
 * Hashes locally with SHA-1, sends hash to API.
 */
export async function passwordCommand(password, opts) {
  try {
    let hash;

    // --stdin: read password from stdin
    if (opts.stdin) {
      if (!opts.quiet) {
        process.stderr.write(chalk.gray('Reading password from stdin...\n'));
      }
      const stdinPassword = await readStdin();
      if (!stdinPassword) {
        process.stderr.write(chalk.red('Error: No password received from stdin.\n'));
        process.exitCode = EXIT.USAGE;
        return;
      }
      hash = createHash('sha1').update(stdinPassword).digest('hex').toUpperCase();
    } else if (opts.hash) {
      // --hash: treat input as pre-computed SHA-1
      hash = password.toUpperCase();
      if (!/^[A-F0-9]{40}$/.test(hash)) {
        process.stderr.write(chalk.red('Error: Invalid SHA-1 hash. Must be 40 hex characters.\n'));
        process.exitCode = EXIT.USAGE;
        return;
      }
    } else {
      // Normal mode: hash the password locally
      hash = createHash('sha1').update(password).digest('hex').toUpperCase();

      // Shell history warning (SR-5)
      if (!opts.quiet && process.stdout.isTTY) {
        process.stderr.write(
          chalk.yellow('⚠  Password may appear in shell history. Use --stdin for sensitive passwords.\n')
        );
      }
    }

    const spinner = opts.quiet ? null : ora({ text: 'Checking password...', stream: process.stderr }).start();
    const wallet = opts.demo ? null : resolveWallet(opts);

    const data = await apiRequest('check-password', { hash }, {
      demo: opts.demo,
      wallet,
    });

    spinner?.stop();

    if (opts.json) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      formatPassword(data, hash);
    }

    process.exitCode = exitCodeFromResult(data);
  } catch (err) {
    if (!opts.quiet) process.stderr.write(chalk.red(`✖ ${err.message}\n`));
    process.exitCode = exitCodeFromError(err);
  }
}
