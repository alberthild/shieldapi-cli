import chalk from 'chalk';
import { createSpinner } from "../lib/ui.js";
import { apiRequest } from '../lib/api.js';
import { resolveWallet } from '../lib/wallet.js';
import { EXIT, exitCodeFromError } from '../lib/exit.js';

export async function checkPackageCommand(ecosystem, name, version, opts) {
  const spinner = opts.quiet ? null : createSpinner(`Checking package: ${ecosystem}/${name}${version ? '@' + version : ''}`).start();

  try {
    const wallet = opts.demo ? null : resolveWallet(opts);
    
    const params = { ecosystem, name };
    if (version) params.version = version;
    
    const data = await apiRequest('check-package', params, {
      demo: opts.demo,
      wallet,
    });

    if (spinner) spinner.stop();

    if (opts.json) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      formatPackageCheck(data, ecosystem, name, version);
    }

    if (data.status === 'ALLOW') {
      process.exitCode = EXIT.SAFE;
    } else {
      process.exitCode = EXIT.RISK;
    }
  } catch (err) {
    if (spinner) spinner.fail(err.message);
    process.exitCode = exitCodeFromError(err);
  }
}

function formatPackageCheck(data, ecosystem, name, version) {
  console.log();
  console.log(chalk.bold.underline('📦  Package Pre-Flight Check Results'));
  console.log();

  const pkgString = `${ecosystem}/${name}${version ? '@' + version : ''}`;
  console.log(`   Package: ${chalk.cyan(pkgString)}`);

  let statusColor = chalk.gray;
  if (data.status === 'ALLOW') statusColor = chalk.green.bold;
  else if (data.status === 'DENY') statusColor = chalk.red.bold;
  else if (data.status === 'WARN') statusColor = chalk.yellow.bold;

  console.log(`   Status:  ${statusColor(data.status || 'UNKNOWN')}`);
  console.log(`   Score:   ${data.score}/100`);
  
  if (data.flags && data.flags.length > 0) {
    console.log(`   Flags:`);
    for (const flag of data.flags) {
      console.log(`     - ${chalk.yellow(flag)}`);
    }
  } else {
    console.log(`   Flags:   None`);
  }
  
  console.log();
}
