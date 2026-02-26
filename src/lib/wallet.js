import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { toClientEvmSigner } from '@x402/evm';

/**
 * Create a viem wallet client + x402 signer from a private key.
 * 
 * @param {string} privateKey - Hex private key (with or without 0x prefix)
 * @returns {{ client: import('viem').WalletClient, signer: object }}
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

    const signer = toClientEvmSigner(client);

    return { client, signer, address: account.address };
  } catch (err) {
    throw new Error(`Invalid private key: ${err.message}`);
  }
}

/**
 * Resolve wallet/signer from CLI option or environment variable.
 * 
 * @param {object} opts - Commander options
 * @returns {{ signer: object, address: string }|null}
 */
export function resolveWallet(opts) {
  const key = opts?.wallet || process.env.SHIELDAPI_WALLET_KEY;
  if (!key) return null;
  return createWallet(key);
}
