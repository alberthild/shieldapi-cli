import { Command } from 'commander';
import { passwordCommand } from './commands/password.js';
import { emailCommand } from './commands/email.js';
import { domainCommand } from './commands/domain.js';
import { ipCommand } from './commands/ip.js';
import { urlCommand } from './commands/url.js';
import { scanCommand } from './commands/scan.js';
import { healthCommand } from './commands/health.js';
import { hashCommand } from './commands/hash.js';

export function run(argv) {
  const program = new Command();

  program
    .name('shieldapi')
    .description('🛡️  ShieldAPI CLI — Security intelligence from your terminal. Pay-per-request with USDC.')
    .version('1.2.2')
    .option('--wallet <key>', 'Private key for x402 payments (or set SHIELDAPI_WALLET_KEY)')
    .option('--json', 'Output raw JSON instead of formatted output')
    .option('--no-color', 'Disable colors')
    .option('-y, --yes', 'Skip payment confirmation prompts')
    .option('-q, --quiet', 'Suppress non-essential output (spinners, warnings)');

  program
    .command('password')
    .description('Check a password against breach databases')
    .argument('<password>', 'Password to check (hashed locally with SHA-1)')
    .option('--demo', 'Use demo mode (free, no wallet needed)')
    .option('--stdin', 'Read password from stdin (avoids shell history)')
    .option('--hash', 'Treat input as pre-computed SHA-1 hash')
    .action((password, cmdOpts, cmd) => {
      const globalOpts = cmd.parent.opts();
      passwordCommand(password, { ...globalOpts, ...cmdOpts });
    });

  program
    .command('email')
    .description('Check an email address for known breaches')
    .argument('<email>', 'Email address to check')
    .option('--demo', 'Use demo mode (free, no wallet needed)')
    .action((email, cmdOpts, cmd) => {
      const globalOpts = cmd.parent.opts();
      emailCommand(email, { ...globalOpts, ...cmdOpts });
    });

  program
    .command('domain')
    .description('Check domain reputation (DNS, blacklists, SSL, SPF/DMARC)')
    .argument('<domain>', 'Domain to check')
    .option('--demo', 'Use demo mode (free, no wallet needed)')
    .action((domain, cmdOpts, cmd) => {
      const globalOpts = cmd.parent.opts();
      domainCommand(domain, { ...globalOpts, ...cmdOpts });
    });

  program
    .command('ip')
    .description('Check IP reputation (blacklists, Tor, rDNS)')
    .argument('<ip>', 'IPv4 address to check')
    .option('--demo', 'Use demo mode (free, no wallet needed)')
    .action((ip, cmdOpts, cmd) => {
      const globalOpts = cmd.parent.opts();
      ipCommand(ip, { ...globalOpts, ...cmdOpts });
    });

  program
    .command('url')
    .description('Check URL safety (phishing, malware, brand impersonation)')
    .argument('<url>', 'URL to check')
    .option('--demo', 'Use demo mode (free, no wallet needed)')
    .action((url, cmdOpts, cmd) => {
      const globalOpts = cmd.parent.opts();
      urlCommand(url, { ...globalOpts, ...cmdOpts });
    });

  program
    .command('scan')
    .description('Run a full security scan with multiple targets')
    .option('--email <email>', 'Email address to include')
    .option('--password <password>', 'Password to include (hashed locally)')
    .option('--domain <domain>', 'Domain to include')
    .option('--ip <ip>', 'IP address to include')
    .option('--url <url>', 'URL to include')
    .option('--demo', 'Use demo mode (free, no wallet needed)')
    .action((cmdOpts, cmd) => {
      const globalOpts = cmd.parent.opts();
      scanCommand({ ...globalOpts, ...cmdOpts });
    });

  program
    .command('health')
    .description('Check ShieldAPI health and available endpoints')
    .option('--demo', 'Use demo mode')
    .action((cmdOpts, cmd) => {
      const globalOpts = cmd.parent.opts();
      healthCommand({ ...globalOpts, ...cmdOpts });
    });

  program
    .command('hash')
    .description('Compute SHA-1 hash locally (offline, no API call)')
    .argument('<password>', 'Password to hash')
    .action((password, cmdOpts, cmd) => {
      const globalOpts = cmd.parent.opts();
      hashCommand(password, { ...globalOpts, ...cmdOpts });
    });

  program.parse(argv);
}
