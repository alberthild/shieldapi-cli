import chalk from 'chalk';
import { apiRequest } from './api.js';
import { resolveWallet } from './wallet.js';
import { exitCodeFromResult, exitCodeFromError, EXIT } from './exit.js';
import { createSpinner, delay, glitchPrint } from './ui.js';

export async function runCommand(config, opts) {
  const { endpoint, paramName, paramValue, formatFn, spinnerText, validateFn, validateMsg } = config;

  if (validateFn && !validateFn(paramValue)) {
    process.stderr.write(chalk.red(`Error: ${validateMsg || 'Invalid input.'}\n`));
    process.exitCode = EXIT.USAGE;
    return;
  }

  if (!opts.quiet && !opts.json && process.stderr.isTTY) {
    await glitchPrint(`[SHIELDAPI] Initializing ${endpoint.replace('-', ' ')}...`);
    await delay(150);
  }

  const spinner = opts.quiet ? null : createSpinner(spinnerText).start();

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
