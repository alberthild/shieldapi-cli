const BASE_URL = 'https://shield.vainplex.dev/api';

/**
 * Make an API request. Uses @x402/fetch for paid requests, plain fetch for demo or free tier.
 */
export async function apiRequest(endpoint, params = {}, { demo = false, wallet = null } = {}) {
  if (demo) {
    params.demo = 'true';
  }

  const query = new URLSearchParams(params).toString();
  const url = `${BASE_URL}/${endpoint}${query ? '?' + query : ''}`;

  if (demo || endpoint === 'health' || !wallet?.signer) {
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 402 && !wallet?.signer) {
        throw new Error('Free tier (10 req/day) exceeded. Please configure a wallet using --wallet <key> or set SHIELDAPI_WALLET_KEY environment variable to pay per request.');
      }
      const body = await res.text().catch(() => '');
      throw new ApiError(res.status, body || res.statusText);
    }
    return res.json();
  }

  const { x402Client } = await import('@x402/core/client');
  const { registerExactEvmScheme } = await import('@x402/evm/exact/client');
  const { wrapFetchWithPayment } = await import('@x402/fetch');

  const client = new x402Client();
  registerExactEvmScheme(client, { signer: wallet.signer });

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
 * Uses @x402/fetch for paid requests, plain fetch for demo or free tier.
 */
export async function apiRequestPost(endpoint, body = {}, { demo = false, wallet = null } = {}) {
  const query = demo ? '?demo=true' : '';
  const url = `${BASE_URL}/${endpoint}${query}`;

  const fetchOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };

  if (demo || endpoint === 'health' || !wallet?.signer) {
    const res = await fetch(url, fetchOptions);
    if (!res.ok) {
      if (res.status === 402 && !wallet?.signer) {
        throw new Error('Free tier (10 req/day) exceeded. Please configure a wallet using --wallet <key> or set SHIELDAPI_WALLET_KEY environment variable to pay per request.');
      }
      const bodyText = await res.text().catch(() => '');
      throw new ApiError(res.status, bodyText || res.statusText);
    }
    return res.json();
  }

  const { x402Client } = await import('@x402/core/client');
  const { registerExactEvmScheme } = await import('@x402/evm/exact/client');
  const { wrapFetchWithPayment } = await import('@x402/fetch');

  const client = new x402Client();
  registerExactEvmScheme(client, { signer: wallet.signer });

  const paidFetch = wrapFetchWithPayment(fetch, client);
  const res = await paidFetch(url, fetchOptions);

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    throw new ApiError(res.status, bodyText || res.statusText);
  }

  return res.json();
}
