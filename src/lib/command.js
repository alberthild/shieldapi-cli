import ora from 'ora';
import chalk from 'chalk';
import { apiRequest } from './api.js';
import { resolveWallet } from './wallet.js';
import { exitCodeFromResult, exitCodeFromError, EXIT } from './exit.js';

/**
 * Generic command runner that extracts common boilerplate from
 * domain, email, ip, and url commands.
 *
 * @param {object} config
 * @param {string} config.endpoint - API endpoint (e.g. 'check-domain')
 * @param {string} config.paramName - Query parameter name (e.g. 'domain')
 * @param {string} config.paramValue - The user-supplied value
 * @param {function} config.formatFn - Formatter function (data, paramValue) => void
 * @param {string} config.spinnerText - Text for the spinner
 * @param {function} [config.validateFn] - Optional validator (value) => boolean
 * @param {string} [config.validateMsg] - Error message if validation fails
 * @param {object} opts - Merged global + command options
 */
export async function runCommand(config, opts) {
  const { endpoint, paramName, paramValue, formatFn, spinnerText, validateFn, validateMsg } = config;

  // Input validation (S2)
  if (validateFn && !validateFn(paramValue)) {
    process.stderr.write(chalk.red(`Error: ${validateMsg || 'Invalid input.'}\n`));
    process.exitCode = EXIT.USAGE;
    return;
  }

  const spinner = opts.quiet ? null : ora({ text: spinnerText, stream: process.stderr }).start();

  try {
    const wallet = opts.demo ? null : resolveWallet(opts);

    const data = await apiRequest(endpoint, { [paramName]: paramValue }, {
      demo: opts.demo,
      wallet,
    });

    spinner?.stop();

    if (opts.json) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      formatFn(data, paramValue);
    }

    process.exitCode = exitCodeFromResult(data);
  } catch (err) {
    spinner?.fail(err.message);
    process.exitCode = exitCodeFromError(err);
  }
}
