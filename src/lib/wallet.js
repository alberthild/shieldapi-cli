import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

/**
 * Create a viem wallet client from a private key.
 * Returns a wallet client with publicActions (needed for readContract in x402).
 * 
 * @param {string} privateKey - Hex private key (with or without 0x prefix)
 * @returns {{ client: import('viem').WalletClient, address: string }}
 */
export function createWallet(privateKey) {
  if (!privateKey) return null;

  const key = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;

  try {
    const account = privateKeyToAccount(key);
    const client = createWalletClient({
      account,
      chain: base,
      transport: http(),
    }).extend(publicActions);

    return { client, address: account.address };
  } catch (err) {
    throw new Error(`Invalid private key: ${err.message}`);
  }
}

/**
 * Resolve wallet client from CLI option or environment variable.
 * 
 * @param {object} opts - Commander options
 * @returns {{ client: object, address: string }|null}
 */
export function resolveWallet(opts) {
  const key = opts?.wallet || process.env.SHIELDAPI_WALLET_KEY;
  if (!key) return null;
  return createWallet(key);
}
