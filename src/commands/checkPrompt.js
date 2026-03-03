import chalk from 'chalk';
import ora from 'ora';
import { apiRequestPost } from '../lib/api.js';
import { resolveWallet } from '../lib/wallet.js';
import { riskBadge, sectionHeader } from '../lib/formatter.js';
import { EXIT } from '../lib/exit.js';

export async function checkPromptCommand(prompt, opts) {
  const spinner = opts.quiet ? null : ora({ text: 'Analyzing prompt for injection patterns...', stream: process.stderr }).start();

  try {
    let inputPrompt = prompt;

    // Read from stdin if --stdin flag
    if (opts.stdin || !prompt) {
      const chunks = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk);
      }
      inputPrompt = Buffer.concat(chunks).toString('utf-8').trim();
    }

    if (!inputPrompt) {
      if (spinner) spinner.fail('No prompt provided');
      process.exitCode = EXIT.USAGE;
      return;
    }

    const body = {
      prompt: inputPrompt,
      ...(opts.context && { context: opts.context }),
    };

    const wallet = opts.demo ? null : resolveWallet(opts);
    const data = await apiRequestPost('check-prompt', body, {
      demo: opts.demo,
      wallet,
    });

    if (spinner) spinner.stop();

    if (opts.json) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      formatCheckPrompt(data, inputPrompt);
    }

    // Exit code: 0=clean, 1=injection detected
    process.exitCode = data.isInjection ? 1 : 0;
  } catch (err) {
    if (spinner) spinner.fail(err.message);
    process.exitCode = EXIT.API_ERROR;
  }
}

function formatCheckPrompt(data, prompt) {
  console.log();

  if (data.isInjection) {
    console.log(chalk.red.bold('⚠️  PROMPT INJECTION DETECTED'));
    console.log();
    console.log(`   Confidence: ${chalk.red.bold(Math.round(data.confidence * 100) + '%')}`);
    console.log(`   Category: ${chalk.yellow(data.category)}`);
    console.log(`   Patterns Checked: ${data.patternsChecked}`);
    console.log(`   Scan Duration: ${data.scanDuration}ms`);

    if (data.patterns?.length > 0) {
      sectionHeader('Detected Patterns');
      console.log();

      for (const p of data.patterns) {
        console.log(`   🔴 ${chalk.bold(p.type)}`);
        console.log(`      ${p.description}`);
        if (p.evidence) {
          const truncated = p.evidence.length > 100 
            ? p.evidence.slice(0, 100) + '...'
            : p.evidence;
          console.log(`      ${chalk.gray('Evidence:')} ${chalk.dim(truncated)}`);
        }
      }
    }

    if (data.decodedContent) {
      sectionHeader('Decoded Content');
      console.log(`   ${chalk.dim(data.decodedContent.slice(0, 200))}`);
    }
  } else {
    console.log(chalk.green.bold('✅ No injection detected'));
    console.log();
    console.log(`   Confidence: ${chalk.green('0%')}`);
    console.log(`   Patterns Checked: ${data.patternsChecked}`);
    console.log(`   Scan Duration: ${data.scanDuration}ms`);
  }

  if (data.demo) {
    console.log();
    console.log(chalk.yellow('   ⚠️  Demo mode — results limited. Pay with x402 for full analysis.'));
  }

  console.log();
}
