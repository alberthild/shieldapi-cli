/**
 * Exit code constants per RFC-001.
 * 
 * 0 = safe / low risk
 * 1 = risk found (medium/high/critical)
 * 2 = usage error (invalid args)
 * 3 = network / API error
 * 4 = payment error (insufficient balance, x402 failure)
 */
export const EXIT = {
  SAFE: 0,
  RISK: 1,
  USAGE: 2,
  NETWORK: 3,
  PAYMENT: 4,
};

/**
 * Determine exit code from API response data.
 * Checks risk_level, found (password), breaches (email), threats (url).
 */
export function exitCodeFromResult(data) {
  // Password check
  if (data.found === true) return EXIT.RISK;
  if (data.found === false) return EXIT.SAFE;

  // Risk level based
  const level = (data.risk_level || data.overall_risk_level || '').toLowerCase();
  if (['critical', 'high', 'medium'].includes(level)) return EXIT.RISK;
  if (['low', 'safe', 'none'].includes(level)) return EXIT.SAFE;

  // Threats array
  if (data.threats?.length > 0) return EXIT.RISK;

  // Email breaches
  if (data.breaches?.length > 0) return EXIT.RISK;

  // Full scan — check nested
  const checks = data.checks || {};
  for (const val of Object.values(checks)) {
    if (val?.found === true) return EXIT.RISK;
    const rl = (val?.risk_level || '').toLowerCase();
    if (['critical', 'high', 'medium'].includes(rl)) return EXIT.RISK;
  }
  if (data.password?.found) return EXIT.RISK;

  return EXIT.SAFE;
}

/**
 * Determine exit code from an error.
 */
export function exitCodeFromError(err) {
  if (err?.status === 402 || err?.message?.includes('payment') || err?.message?.includes('x402') || err?.message?.includes('wallet')) {
    return EXIT.PAYMENT;
  }
  if (err?.status >= 400 && err?.status < 500) {
    return EXIT.USAGE;
  }
  return EXIT.NETWORK;
}
