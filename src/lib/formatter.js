import chalk from 'chalk';

/**
 * Format a risk level badge with color.
 */
export function riskBadge(level, score) {
  const displayScore = score != null ? (score > 10 ? `${score}/100` : `${score}/10`) : '?';
  const label = `${level?.toUpperCase() || 'UNKNOWN'} (${displayScore})`;
  switch (level?.toLowerCase()) {
    case 'critical':
      return chalk.bgRed.white.bold(` ${label} `);
    case 'high':
      return chalk.red.bold(label);
    case 'medium':
      return chalk.yellow.bold(label);
    case 'low':
      return chalk.green.bold(label);
    case 'safe':
    case 'none':
      return chalk.green(label);
    default:
      return chalk.gray(label);
  }
}

/**
 * Format a number with commas.
 */
export function formatNumber(n) {
  return Number(n).toLocaleString('en-US');
}

/**
 * Print a section header.
 */
export function sectionHeader(title) {
  console.log();
  console.log(chalk.bold.underline(title));
}

/**
 * Print key-value pair with indentation.
 */
export function kvLine(key, value, indent = 3) {
  const pad = ' '.repeat(indent);
  console.log(`${pad}${chalk.gray(key + ':')} ${value}`);
}

/**
 * Format password check result.
 */
export function formatPassword(data, hash) {
  console.log();
  if (data.found) {
    console.log(chalk.red.bold('⚠️  PASSWORD COMPROMISED'));
    console.log(`   Found in ${chalk.red.bold(formatNumber(data.count))} breaches`);
    console.log(`   SHA-1: ${chalk.gray(hash)}`);
    console.log();
    console.log(chalk.red('   🚨 Change this password immediately!'));
  } else {
    console.log(chalk.green.bold('✅ Password NOT found in breach databases'));
    console.log(`   SHA-1: ${chalk.gray(hash)}`);
  }
  console.log();
}

/**
 * Format email breach result.
 */
export function formatEmail(data, email) {
  console.log();
  const breaches = data.breaches || [];

  if (breaches.length > 0) {
    console.log(
      chalk.red.bold(`⚠️  ${breaches.length} breach${breaches.length > 1 ? 'es' : ''} found`) +
      ` | Risk: ${riskBadge(data.risk_level, data.risk_score)}`
    );
    console.log();

    for (const breach of breaches) {
      const name = breach.name || breach.title || 'Unknown';
      const date = breach.date || breach.breach_date || '';
      const count = breach.records || breach.pwn_count;
      const exposed = breach.exposed_data || breach.data_classes;

      let line = `   📋 ${chalk.bold(name)}`;
      if (date) line += ` (${date})`;
      if (count) line += ` — ${formatNumber(count)} accounts`;
      console.log(line);

      if (exposed) {
        const items = Array.isArray(exposed) ? exposed.join(', ') : exposed;
        console.log(`      Exposed: ${chalk.gray(items)}`);
      }
    }

    if (data.recommendations?.length) {
      console.log();
      console.log('   💡 Recommendations:');
      for (const rec of data.recommendations) {
        console.log(`      • ${rec}`);
      }
    }
  } else {
    console.log(chalk.green.bold('✅ No breaches found') + ` for ${chalk.bold(email)}`);
  }
  console.log();
}

/**
 * Format domain reputation result.
 */
export function formatDomain(data) {
  console.log();
  console.log(
    `🌐 Domain: ${chalk.bold(data.domain)} | Risk: ${riskBadge(data.risk_level, data.risk_score)}`
  );
  console.log();

  if (data.dns) {
    sectionHeader('DNS');
    if (data.dns.a?.length) kvLine('A Records', data.dns.a.join(', '));
    if (data.dns.mx?.length) kvLine('MX Records', data.dns.mx.join(', '));
    if (data.dns.ns?.length) kvLine('NS Records', data.dns.ns.join(', '));
    const hasSPF = data.dns.spf ?? data.dns.has_spf;
    const hasDMARC = data.dns.dmarc ?? data.dns.has_dmarc;
    if (hasSPF !== undefined) kvLine('SPF', hasSPF ? chalk.green('✓') : chalk.red('✗'));
    if (hasDMARC !== undefined) kvLine('DMARC', hasDMARC ? chalk.green('✓') : chalk.red('✗'));
  }

  if (data.ssl) {
    sectionHeader('SSL/TLS');
    kvLine('Valid', data.ssl.valid ? chalk.green('✓') : chalk.red('✗'));
    if (data.ssl.error) kvLine('Error', chalk.red(data.ssl.error));
    if (data.ssl.issuer) kvLine('Issuer', data.ssl.issuer);
    if (data.ssl.expires) kvLine('Expires', data.ssl.expires);
  }

  if (data.blacklists) {
    sectionHeader('Blacklists');
    if (Array.isArray(data.blacklists)) {
      const listed = data.blacklists.filter(b => b.listed);
      if (listed.length > 0) {
        kvLine('Listed on', chalk.red(listed.map(b => b.list).join(', ')));
      } else {
        kvLine('Status', chalk.green('Not blacklisted'));
      }
    } else {
      const listed = data.blacklists.listed_on || [];
      if (listed.length > 0) {
        kvLine('Listed on', chalk.red(listed.join(', ')));
      } else {
        kvLine('Status', chalk.green('Not blacklisted'));
      }
    }
  }
  console.log();
}

/**
 * Format IP reputation result.
 */
export function formatIp(data) {
  console.log();
  console.log(
    `🖥  IP: ${chalk.bold(data.ip)} | Risk: ${riskBadge(data.risk_level, data.risk_score)}`
  );
  console.log();

  if (data.reverse_dns) {
    kvLine('Reverse DNS', data.reverse_dns);
  }
  if (data.is_tor_exit !== undefined) {
    kvLine('Tor Exit Node', data.is_tor_exit ? chalk.red('Yes') : chalk.green('No'));
  }

  if (data.blacklists) {
    if (Array.isArray(data.blacklists)) {
      const listed = data.blacklists.filter(b => b.listed);
      if (listed.length > 0) {
        kvLine('Blacklisted on', chalk.red(listed.map(b => b.name || b.list).join(', ')));
      } else {
        kvLine('Blacklists', chalk.green('Clean'));
      }
    } else if (data.blacklists.listed_on?.length) {
      kvLine('Blacklisted on', chalk.red(data.blacklists.listed_on.join(', ')));
    } else {
      kvLine('Blacklists', chalk.green('Clean'));
    }
  }
  console.log();
}

/**
 * Format URL safety result.
 */
export function formatUrl(data) {
  console.log();
  console.log(
    `🔗 URL: ${chalk.bold(data.url)} | Risk: ${riskBadge(data.risk_level, data.risk_score)}`
  );
  console.log();

  if (data.threats?.length) {
    console.log('   ⚠️  Threats detected:');
    for (const threat of data.threats) {
      if (typeof threat === 'string') {
        console.log(`      • ${chalk.red(threat)}`);
      } else {
        const src = threat.source ? chalk.gray(`[${threat.source}]`) + ' ' : '';
        console.log(`      • ${src}${chalk.red(threat.detail || threat.type || JSON.stringify(threat))}`);
      }
    }
  } else {
    console.log(`   ${chalk.green('✅ No threats detected')}`);
  }

  if (data.checks) {
    sectionHeader('Checks');
    for (const [key, value] of Object.entries(data.checks)) {
      const label = key.replace(/_/g, ' ');
      if (typeof value === 'object' && value !== null) {
        // Complex check result — show found/reachable status or warnings
        if (value.found !== undefined) {
          kvLine(label, value.found ? chalk.red('Found in database') : chalk.green('Clean'));
        } else if (value.reachable !== undefined) {
          kvLine(label, value.reachable ? chalk.green('Reachable') : chalk.yellow('Unreachable'));
        } else if (value.warnings?.length) {
          kvLine(label, chalk.yellow(`${value.warnings.length} warning(s)`));
        } else {
          kvLine(label, chalk.green('OK'));
        }
      } else {
        const status = value ? chalk.green('Passed') : chalk.red('Failed');
        kvLine(label, status);
      }
    }
  }
  console.log();
}

/**
 * Format full scan result.
 */
export function formatScan(data) {
  console.log();
  console.log(chalk.bold.underline('🛡️  Full Security Scan Results'));

  // Support both flat (data.password) and nested (data.checks.password) structures
  const checks = data.checks || {};
  const pw = data.password || checks.password;
  const emailData = data.email || checks.email_breaches || checks.email;
  const domainData = data.domain || checks.domain;
  const ipData = data.ip || checks.ip;
  const urlData = data.url || checks.url;

  if (pw) {
    sectionHeader('🔑 Password');
    if (pw.found) {
      console.log(`   ${chalk.red.bold('COMPROMISED')} — found in ${formatNumber(pw.count)} breaches`);
    } else {
      console.log(`   ${chalk.green('Safe')} — not found in breach databases`);
    }
  }

  if (emailData) {
    sectionHeader('📧 Email');
    const breaches = emailData.breaches || [];
    if (breaches.length > 0) {
      console.log(`   ${chalk.red.bold(breaches.length + ' breaches')} | Risk: ${riskBadge(emailData.risk_level, emailData.risk_score)}`);
      for (const b of breaches) {
        console.log(`   • ${b.name || b.title || 'Unknown'}`);
      }
    } else if (emailData.domain_breach_count > 0) {
      console.log(`   ${chalk.yellow(emailData.domain_breach_count + ' domain breach(es)')} | Risk: ${riskBadge(emailData.risk_level, emailData.risk_score)}`);
    } else {
      console.log(`   ${chalk.green('No breaches found')}`);
    }
  }

  if (domainData) {
    sectionHeader('🌐 Domain');
    const label = domainData.domain ? `${domainData.domain} — ` : '';
    console.log(`   ${label}Risk: ${riskBadge(domainData.risk_level, domainData.risk_score)}`);
  }

  if (ipData) {
    sectionHeader('🖥  IP');
    console.log(`   Risk: ${riskBadge(ipData.risk_level, ipData.risk_score)}`);
    if (ipData.is_tor_exit) console.log(`   ${chalk.red('⚠️  Tor exit node')}`);
  }

  if (urlData) {
    sectionHeader('🔗 URL');
    console.log(`   Risk: ${riskBadge(urlData.risk_level, urlData.risk_score)}`);
    if (urlData.threats?.length) {
      for (const t of urlData.threats) {
        const text = typeof t === 'string' ? t : (t.detail || t.type || JSON.stringify(t));
        console.log(`   • ${chalk.red(text)}`);
      }
    }
  }

  // Overall risk
  if (data.overall_risk_level || data.overall_risk_score != null) {
    console.log();
    console.log(`Overall Risk: ${riskBadge(data.overall_risk_level, data.overall_risk_score)}`);
  }

  // Summary lines
  if (data.summary?.length) {
    console.log();
    for (const line of data.summary) {
      console.log(`   ${line}`);
    }
  }

  console.log();
}

/**
 * Format health check result.
 */
export function formatHealth(data) {
  console.log();
  console.log(chalk.green.bold('✅ ShieldAPI is healthy'));
  console.log();

  if (data.endpoints) {
    console.log(chalk.bold('Available endpoints:'));
    console.log();
    for (const ep of data.endpoints) {
      const name = ep.path || ep.endpoint || ep.name;
      const price = ep.price || ep.cost;
      console.log(`   ${chalk.cyan(name)}${price ? ` — ${chalk.yellow(price + ' USDC')}` : ''}`);
    }
  } else if (typeof data === 'object') {
    // Fallback: just show the keys
    for (const [key, value] of Object.entries(data)) {
      console.log(`   ${chalk.gray(key + ':')} ${JSON.stringify(value)}`);
    }
  }
  console.log();
}
