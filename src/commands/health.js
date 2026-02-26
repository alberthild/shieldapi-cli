import ora from 'ora';
import { apiRequest } from '../lib/api.js';
import { formatHealth } from '../lib/formatter.js';

/**
 * Check API health status.
 */
export async function healthCommand(opts) {
  const spinner = ora('Checking API health...').start();

  try {
    const data = await apiRequest('health', {}, { demo: opts.demo });

    spinner.stop();

    if (opts.json) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      formatHealth(data);
    }
  } catch (err) {
    spinner.fail(err.message);
    process.exitCode = 1;
  }
}
