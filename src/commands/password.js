import { createHash } from 'node:crypto';
import ora from 'ora';
import chalk from 'chalk';
import { apiRequest } from '../lib/api.js';
import { resolveWallet } from '../lib/wallet.js';
import { formatPassword } from '../lib/formatter.js';
import { exitCodeFromResult, exitCodeFromError, EXIT } from '../lib/exit.js';

/**
 * Read password from stdin.
 * If stdin is a TTY (interactive), prompts with hidden input (like Linux `read -s`).
 * If piped, reads data directly.
 */
function readStdin() {
  return new Promise((resolve, reject) => {
    if (process.stdin.isTTY) {
      // Interactive mode: hide typed characters
      process.stderr.write('Password: ');
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');

      let password = '';

      const onData = (char) => {
        const c = char.toString();
        if (c === '\n' || c === '\r') {
          cleanup();
          process.stderr.write('\n');
          resolve(password);
        } else if (c === '\u0003') {
          // Ctrl+C
          cleanup();
          process.stderr.write('\n');
          process.exit(130);
        } else if (c === '\u007f' || c === '\b') {
          // Backspace
          password = password.slice(0, -1);
        } else {
          password += c;
        }
      };

      const cleanup = () => {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
      };

      process.stdin.on('data', onData);
    } else {
      // Piped mode: read all data from stdin
      let data = '';
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', (chunk) => { data += chunk; });
      process.stdin.on('end', () => resolve(data.trim()));
      process.stdin.on('error', reject);
      setTimeout(() => {
        process.stdin.destroy();
        if (data) resolve(data.trim());
        else reject(new Error('Stdin timeout — no input received'));
      }, 10000);
    }
  });
}

/**
 * Check a password against breach databases.
 * Hashes locally with SHA-1, sends hash to API.
 */
export async function passwordCommand(password, opts) {
  let spinner = null;

  try {
    let hash;

    if (opts.stdin) {
      // --stdin: read password from stdin, ignore positional argument
      const stdinPassword = await readStdin();
      if (!stdinPassword) {
        process.stderr.write(chalk.red('Error: No password received.\n'));
        process.exitCode = EXIT.USAGE;
        return;
      }
      hash = createHash('sha1').update(stdinPassword).digest('hex').toUpperCase();
    } else if (!password) {
      // No password argument and no --stdin
      process.stderr.write(chalk.red('Error: Provide a password argument or use --stdin.\n'));
      process.stderr.write(chalk.gray('  shieldapi password "mypassword" --demo\n'));
      process.stderr.write(chalk.gray('  shieldapi password --stdin --demo\n'));
      process.exitCode = EXIT.USAGE;
      return;
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
      if (!opts.quiet && process.stderr.isTTY) {
        process.stderr.write(
          chalk.yellow('⚠  Password may appear in shell history. Use --stdin for sensitive passwords.\n')
        );
      }
    }

    spinner = opts.quiet ? null : ora({ text: 'Checking password...', stream: process.stderr }).start();
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
    spinner?.fail(err.message);
    process.exitCode = exitCodeFromError(err);
  }
}
