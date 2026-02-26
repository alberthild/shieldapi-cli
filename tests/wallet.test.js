import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { createWallet } from '../src/lib/wallet.js';

describe('createWallet', () => {
  it('returns null for null input', () => {
    assert.equal(createWallet(null), null);
  });

  it('returns null for undefined input', () => {
    assert.equal(createWallet(undefined), null);
  });

  it('returns null for empty string', () => {
    assert.equal(createWallet(''), null);
  });

  it('throws for invalid private key', () => {
    assert.throws(
      () => createWallet('not-a-valid-key'),
      { message: 'Invalid private key. Expected 64 hex characters (with or without 0x prefix).' }
    );
  });

  it('throws for too-short key', () => {
    assert.throws(
      () => createWallet('0xabc123'),
      { message: 'Invalid private key. Expected 64 hex characters (with or without 0x prefix).' }
    );
  });

  it('accepts valid 64-char hex key with 0x prefix', () => {
    // This is a well-known test private key — never use in production
    const testKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const result = createWallet(testKey);
    assert.ok(result);
    assert.ok(result.signer);
    assert.ok(result.address);
    assert.ok(result.address.startsWith('0x'));
  });

  it('accepts valid 64-char hex key without 0x prefix', () => {
    const testKey = 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const result = createWallet(testKey);
    assert.ok(result);
    assert.ok(result.signer);
    assert.ok(result.address);
    assert.ok(result.address.startsWith('0x'));
  });
});
