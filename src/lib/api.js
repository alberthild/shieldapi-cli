const BASE_URL = 'https://shield.vainplex.dev/api';

/**
 * Make an API request. Uses @x402/fetch for paid requests, plain fetch for demo.
 * 
 * @param {string} endpoint - API endpoint path (e.g. 'check-password')
 * @param {Record<string, string>} params - Query parameters
 * @param {object} options
 * @param {boolean} options.demo - Use demo mode
 * @param {{ signer: object }|null} options.wallet - Wallet with x402 ClientEvmSigner
 * @returns {Promise<object>} Parsed JSON response
 */
export async function apiRequest(endpoint, params = {}, { demo = false, wallet = null } = {}) {
  if (!demo && !wallet?.signer && endpoint !== 'health') {
    console.warn('\x1b[33m⚠️  No wallet configured. Falling back to free demo mode (--demo).\x1b[0m');
    demo = true;
  }
  if (demo) {
    params.demo = 'true';
  }

  const query = new URLSearchParams(params).toString();
  const url = `${BASE_URL}/${endpoint}${query ? '?' + query : ''}`;

  if (demo || endpoint === 'health') {
    // Free endpoints — plain fetch
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new ApiError(res.status, body || res.statusText);
    }
    return res.json();
  }

  // Paid endpoint — need wallet with signer
  if (!wallet?.signer) {
    throw new Error(
      'No wallet configured. Use --wallet <key> or set SHIELDAPI_WALLET_KEY environment variable.'
    );
  }

  // Dynamic imports to keep startup fast (PR-2: lazy loading)
  const { x402Client } = await import('@x402/core/client');
  const { registerExactEvmScheme } = await import('@x402/evm/exact/client');
  const { wrapFetchWithPayment } = await import('@x402/fetch');

  // Create x402 client with EVM scheme registered
  // wallet.signer is a ClientEvmSigner (from toClientEvmSigner) with .address + .signTypedData + .readContract
  const client = new x402Client();
  registerExactEvmScheme(client, { signer: wallet.signer });

  // Wrap fetch with x402 payment handling
  const paidFetch = wrapFetchWithPayment(fetch, client);

  const res = await paidFetch(url);

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(res.status, body || res.statusText);
  }

  return res.json();
}

export class ApiError extends Error {
  constructor(status, body) {
    let message = `API returned ${status}`;
    try {
      const parsed = JSON.parse(body);
      if (parsed.error) message += `: ${parsed.error}`;
      if (parsed.details) message += ` (${parsed.details})`;
    } catch {
      if (body) message += `: ${body}`;
    }
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * POST request for Phase 2 endpoints (scan-skill, check-prompt).
 * Uses @x402/fetch for paid requests, plain fetch for demo.
 */
export async function apiRequestPost(endpoint, body = {}, { demo = false, wallet = null } = {}) {
  if (!demo && !wallet?.signer && endpoint !== 'health') {
    console.warn('\x1b[33m⚠️  No wallet configured. Falling back to free demo mode (--demo).\x1b[0m');
    demo = true;
  }
  const query = demo ? '?demo=true' : '';
  const url = `${BASE_URL}/${endpoint}${query}`;

  const fetchOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };

  if (demo || endpoint === 'health') {
    const res = await fetch(url, fetchOptions);
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new ApiError(res.status, body || res.statusText);
    }
    return res.json();
  }

  if (!wallet?.signer) {
    throw new Error(
      'No wallet configured. Use --wallet <key> or set SHIELDAPI_WALLET_KEY environment variable.'
    );
  }

  const { x402Client } = await import('@x402/core/client');
  const { registerExactEvmScheme } = await import('@x402/evm/exact/client');
  const { wrapFetchWithPayment } = await import('@x402/fetch');

  const client = new x402Client();
  registerExactEvmScheme(client, { signer: wallet.signer });

  const paidFetch = wrapFetchWithPayment(fetch, client);
  const res = await paidFetch(url, fetchOptions);

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(res.status, body || res.statusText);
  }

  return res.json();
}
