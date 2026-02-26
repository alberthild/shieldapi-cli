import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { toClientEvmSigner } from '@x402/evm';

/**
 * Create a wallet + x402-compatible signer from a private key.
 * 
 * Uses toClientEvmSigner to compose an account (for signing) with
 * a publicClient (for readContract), producing a ClientEvmSigner
 * that has both `.address` and `.signTypedData` + `.readContract`.
 * 
 * @param {string} privateKey - Hex private key (with or without 0x prefix)
 * @returns {{ signer: object, address: string }}
 */
export function createWallet(privateKey) {
  if (!privateKey) return null;

  const key = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;

  try {
    const account = privateKeyToAccount(key);
    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    });

    // toClientEvmSigner composes account.signTypedData + publicClient.readContract
    // and exposes .address correctly
    const signer = toClientEvmSigner(account, publicClient);

    return { signer, address: account.address };
  } catch (err) {
    throw new Error('Invalid private key. Expected 64 hex characters (with or without 0x prefix).');
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
