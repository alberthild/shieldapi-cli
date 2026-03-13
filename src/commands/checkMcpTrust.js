import chalk from 'chalk';
import ora from 'ora';
import { apiRequestPost } from '../lib/api.js';
import { resolveWallet } from '../lib/wallet.js';
import { sectionHeader, kvLine, riskBadge } from '../lib/formatter.js';
import { EXIT, exitCodeFromError } from '../lib/exit.js';

export async function checkMcpTrustCommand(endpoint, opts) {
  const spinner = opts.quiet ? null : ora({ text: `Checking MCP Trust for: ${endpoint}`, stream: process.stderr }).start();

  try {
    const wallet = opts.demo ? null : resolveWallet(opts);
    const data = await apiRequestPost('check-mcp-trust', { endpoint }, {
      demo: opts.demo,
      wallet,
    });

    if (spinner) spinner.stop();

    if (opts.json) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      formatMcpTrust(data);
    }

    // Exit code: 0 if score >= 70 (safe), 1 if < 70 (risk)
    if (data.trust_score >= 70) {
      process.exitCode = EXIT.SAFE;
    } else {
      process.exitCode = EXIT.RISK;
    }
  } catch (err) {
    if (spinner) spinner.fail(err.message);
    process.exitCode = exitCodeFromError(err);
  }
}

function formatMcpTrust(data) {
  console.log();
  console.log(chalk.bold.underline('🛡️  MCP Trust Results'));
  console.log();

  console.log(`   Endpoint: ${chalk.cyan(data.endpoint)}`);

  let tierColor = chalk.gray;
  if (data.tier === 'gold') tierColor = chalk.yellow.bold;
  else if (data.tier === 'silver') tierColor = chalk.white.bold;
  else if (data.tier === 'bronze') tierColor = chalk.redBright.bold;
  else tierColor = chalk.gray.bold;

  let trustColor = chalk.gray;
  if (data.trust_score >= 80) trustColor = chalk.green.bold;
  else if (data.trust_score >= 50) trustColor = chalk.yellow.bold;
  else trustColor = chalk.red.bold;

  console.log(`   Tier: ${tierColor(data.tier?.toUpperCase() || 'UNKNOWN')}`);
  console.log(`   Trust Score: ${trustColor(data.trust_score + '/100')}`);
  console.log(`   On-Chain Verified: ${data.on_chain_verified ? chalk.green('Yes') : chalk.red('No')}`);

  if (data.signals) {
    console.log();
    sectionHeader('Signals');
    
    if (data.signals.reliability) {
      const rel = data.signals.reliability;
      kvLine('Reliability Score', rel.score + '/100');
      kvLine('Status', rel.status === 'online' ? chalk.green('Online') : chalk.red('Offline'));
      if (rel.response_ms) kvLine('Response Time', `${rel.response_ms}ms`);
      if (rel.error) kvLine('Error', chalk.red(rel.error));
    }
    
    if (data.signals.security) {
      const sec = data.signals.security;
      kvLine('Security Score', sec.score + '/100');
      kvLine('Risk Level', riskBadge(sec.risk_level, sec.risk_score));
      if (sec.ssl?.error) kvLine('SSL Error', chalk.red(sec.ssl.error));
    }
    
    if (data.signals.on_chain) {
      const oc = data.signals.on_chain;
      kvLine('On-Chain Score', oc.score + '/100');
      if (oc.agentproof_registered) {
        kvLine('AgentProof', chalk.green('Registered'));
      }
    }
    
    if (data.signals.injection_risk) {
      const inj = data.signals.injection_risk;
      kvLine('Injection Risk Score', inj.score + '/100');
      if (inj.prompt_patterns_found > 0) {
        kvLine('Injection Patterns', chalk.red(inj.prompt_patterns_found));
      }
    }

    if (data.signals.supply_chain) {
      const sc = data.signals.supply_chain;
      kvLine('Supply Chain Score', sc.score + '/100');
      kvLine('Supply Risk Level', riskBadge(sc.riskLevel?.toLowerCase(), sc.riskScore));
    }
  }
  console.log();
}
