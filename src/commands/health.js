import ora from 'ora';
import chalk from 'chalk';
import { apiRequest } from '../lib/api.js';
import { formatHealth } from '../lib/formatter.js';
import { EXIT } from '../lib/exit.js';

/**
 * Check API health status.
 */
export async function healthCommand(opts) {
  const spinner = opts.quiet ? null : ora({ text: 'Checking API health...', stream: process.stderr }).start();

  try {
    const data = await apiRequest('health', {}, { demo: opts.demo });

    spinner?.stop();

    if (opts.json) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      formatHealth(data);
    }

    process.exitCode = EXIT.SAFE;
  } catch (err) {
    spinner?.fail(err.message);
    process.exitCode = EXIT.NETWORK;
  }
}
