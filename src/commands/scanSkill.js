import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import chalk from 'chalk';
import ora from 'ora';
import { apiRequestPost } from '../lib/api.js';
import { resolveWallet } from '../lib/wallet.js';
import { riskBadge, sectionHeader, kvLine, formatNumber } from '../lib/formatter.js';
import { EXIT } from '../lib/exit.js';

const SCANNABLE_EXTENSIONS = new Set([
  '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.py', '.sh', '.bash',
  '.md', '.markdown', '.json', '.yml', '.yaml', '.toml', '.env',
  '.bat', '.ps1', '.rb', '.go', '.rs', '.java',
]);

function loadSkillFiles(path) {
  const files = [];
  const stat = statSync(path);

  if (stat.isFile()) {
    const content = readFileSync(path, 'utf-8');
    return [{ name: basename(path), content }];
  }

  if (stat.isDirectory()) {
    const entries = readdirSync(path, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const fullPath = join(path, entry.name);
      if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (SCANNABLE_EXTENSIONS.has(ext) || entry.name === 'Dockerfile' || entry.name === 'Makefile') {
          try {
            const content = readFileSync(fullPath, 'utf-8');
            if (content.length <= 100 * 1024) { // 100KB per file max
              files.push({ name: entry.name, content });
            }
          } catch { /* skip unreadable files */ }
        }
      }
    }
  }

  return files;
}

export async function scanSkillCommand(target, opts) {
  const spinner = opts.quiet ? null : ora({ text: `Scanning skill: ${target || 'stdin'}`, stream: process.stderr }).start();

  try {
    let body = {};

    if (target && existsSync(target)) {
      // Local file or directory
      const files = loadSkillFiles(target);
      if (files.length === 0) {
        if (spinner) spinner.fail('No scannable files found');
        process.exitCode = EXIT.USAGE;
        return;
      }

      // If there's a SKILL.md, use it as the skill field
      const skillMd = files.find(f => f.name.toLowerCase() === 'skill.md');
      if (skillMd) {
        body.skill = skillMd.content;
      }
      body.files = files;
      if (spinner) spinner.text = `Scanning ${files.length} files from ${target}`;
    } else if (target) {
      // Assume it's raw skill content or a skill name
      body.skill = target;
    } else {
      if (spinner) spinner.fail('No target specified');
      process.exitCode = EXIT.USAGE;
      return;
    }

    const wallet = opts.demo ? null : resolveWallet(opts);
    const data = await apiRequestPost('scan-skill', body, {
      demo: opts.demo,
      wallet,
    });

    if (spinner) spinner.stop();

    if (opts.json) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      formatScanSkill(data);
    }

    // Exit code: 0=clean, 1=findings, 2=critical
    if (data.riskLevel === 'CLEAN') {
      process.exitCode = 0;
    } else if (data.riskLevel === 'CRITICAL') {
      process.exitCode = 2;
    } else {
      process.exitCode = 1;
    }
  } catch (err) {
    if (spinner) spinner.fail(err.message);
    process.exitCode = EXIT.API_ERROR;
  }
}

function formatScanSkill(data) {
  console.log();
  console.log(chalk.bold.underline('🛡️  Skill Safety Scan Results'));
  console.log();

  // Risk badge
  const badge = riskBadge(data.riskLevel?.toLowerCase(), data.riskScore);
  console.log(`   Risk Level: ${badge}`);
  console.log(`   Files Analyzed: ${data.filesAnalyzed || '?'}`);
  console.log(`   Patterns Checked: ${formatNumber(data.totalPatterns || 0)}`);
  console.log(`   Scan Duration: ${data.scanDuration}ms`);

  if (data.findings?.length > 0) {
    sectionHeader(`Findings (${data.findings.length})`);
    console.log();

    const bySeverity = { CRITICAL: [], HIGH: [], MEDIUM: [], LOW: [] };
    for (const f of data.findings) {
      (bySeverity[f.severity] || bySeverity.LOW).push(f);
    }

    for (const [sev, findings] of Object.entries(bySeverity)) {
      if (findings.length === 0) continue;
      const color = sev === 'CRITICAL' ? chalk.red.bold
        : sev === 'HIGH' ? chalk.red
        : sev === 'MEDIUM' ? chalk.yellow
        : chalk.gray;
      
      for (const f of findings) {
        console.log(`   ${color(`[${sev}]`)} ${f.description}`);
        if (f.location) console.log(`      📍 ${chalk.gray(f.location)}`);
        if (f.category) console.log(`      📂 ${chalk.gray(f.category)}`);
      }
    }
  } else {
    console.log();
    console.log(chalk.green.bold('   ✅ No security issues detected'));
  }

  // Summary
  if (data.summary) {
    console.log();
    console.log(`   ${chalk.gray(data.summary)}`);
  }

  if (data.demo) {
    console.log();
    console.log(chalk.yellow('   ⚠️  Demo mode — results limited. Pay with x402 for full scan.'));
  }

  console.log();
}
