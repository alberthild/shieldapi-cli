import { createHash } from 'node:crypto';
import chalk from 'chalk';
import { EXIT } from '../lib/exit.js';

/**
 * Compute SHA-1 hash locally (offline, no API call).
 */
export async function hashCommand(password, opts) {
  const hash = createHash('sha1').update(password).digest('hex').toUpperCase();

  if (opts.json) {
    console.log(JSON.stringify({ password_length: password.length, sha1: hash, prefix: hash.slice(0, 5) }));
  } else {
    console.log();
    console.log(`   SHA-1:  ${chalk.bold(hash)}`);
    console.log(`   Prefix: ${chalk.cyan(hash.slice(0, 5))}`);
    console.log(`   Length: ${password.length} characters`);
    console.log();
  }

  process.exitCode = EXIT.SAFE;
}
