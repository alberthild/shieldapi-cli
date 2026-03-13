import { apiRequest } from '../lib/api.js';
import { formatHealth } from '../lib/formatter.js';
import { EXIT } from '../lib/exit.js';
import { createSpinner, glitchPrint, delay } from '../lib/ui.js';

export async function healthCommand(opts) {
  if (!opts.quiet && !opts.json && process.stderr.isTTY) {
    await glitchPrint('[SHIELDAPI] Initializing health check...');
    await delay(150);
  }

  const spinner = opts.quiet ? null : createSpinner('Checking API health...').start();

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
