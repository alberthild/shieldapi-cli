import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { EXIT, exitCodeFromResult, exitCodeFromError } from '../src/lib/exit.js';

describe('EXIT constants', () => {
  it('has expected values', () => {
    assert.equal(EXIT.SAFE, 0);
    assert.equal(EXIT.RISK, 1);
    assert.equal(EXIT.USAGE, 2);
    assert.equal(EXIT.NETWORK, 3);
    assert.equal(EXIT.PAYMENT, 4);
  });
});

describe('exitCodeFromResult', () => {
  it('returns RISK when found is true (password breach)', () => {
    assert.equal(exitCodeFromResult({ found: true }), EXIT.RISK);
  });

  it('returns SAFE when found is false', () => {
    assert.equal(exitCodeFromResult({ found: false }), EXIT.SAFE);
  });

  it('returns RISK for critical risk_level', () => {
    assert.equal(exitCodeFromResult({ risk_level: 'critical' }), EXIT.RISK);
  });

  it('returns RISK for high risk_level', () => {
    assert.equal(exitCodeFromResult({ risk_level: 'high' }), EXIT.RISK);
  });

  it('returns RISK for medium risk_level', () => {
    assert.equal(exitCodeFromResult({ risk_level: 'medium' }), EXIT.RISK);
  });

  it('returns SAFE for low risk_level', () => {
    assert.equal(exitCodeFromResult({ risk_level: 'low' }), EXIT.SAFE);
  });

  it('returns SAFE for safe risk_level', () => {
    assert.equal(exitCodeFromResult({ risk_level: 'safe' }), EXIT.SAFE);
  });

  it('returns SAFE for none risk_level', () => {
    assert.equal(exitCodeFromResult({ risk_level: 'none' }), EXIT.SAFE);
  });

  it('returns RISK when threats array is non-empty', () => {
    assert.equal(exitCodeFromResult({ threats: ['phishing'] }), EXIT.RISK);
  });

  it('returns SAFE when threats array is empty', () => {
    assert.equal(exitCodeFromResult({ threats: [] }), EXIT.SAFE);
  });

  it('returns RISK when breaches array is non-empty', () => {
    assert.equal(exitCodeFromResult({ breaches: [{ name: 'test' }] }), EXIT.RISK);
  });

  it('returns SAFE for empty object', () => {
    assert.equal(exitCodeFromResult({}), EXIT.SAFE);
  });

  it('returns RISK for overall_risk_level (scan)', () => {
    assert.equal(exitCodeFromResult({ overall_risk_level: 'high' }), EXIT.RISK);
  });

  it('returns RISK when nested checks have found:true', () => {
    assert.equal(exitCodeFromResult({ checks: { password: { found: true } } }), EXIT.RISK);
  });

  it('returns RISK when data.password.found is true', () => {
    assert.equal(exitCodeFromResult({ password: { found: true } }), EXIT.RISK);
  });

  it('returns SAFE when nested checks are all safe', () => {
    assert.equal(exitCodeFromResult({ checks: { domain: { risk_level: 'low' } } }), EXIT.SAFE);
  });
});

describe('exitCodeFromError', () => {
  it('returns PAYMENT for 402 status', () => {
    assert.equal(exitCodeFromError({ status: 402 }), EXIT.PAYMENT);
  });

  it('returns PAYMENT for payment-related message', () => {
    assert.equal(exitCodeFromError({ message: 'payment required' }), EXIT.PAYMENT);
  });

  it('returns PAYMENT for x402 message', () => {
    assert.equal(exitCodeFromError({ message: 'x402 failed' }), EXIT.PAYMENT);
  });

  it('returns PAYMENT for wallet message', () => {
    assert.equal(exitCodeFromError({ message: 'wallet not found' }), EXIT.PAYMENT);
  });

  it('returns USAGE for 4xx client errors', () => {
    assert.equal(exitCodeFromError({ status: 400 }), EXIT.USAGE);
    assert.equal(exitCodeFromError({ status: 404 }), EXIT.USAGE);
    assert.equal(exitCodeFromError({ status: 422 }), EXIT.USAGE);
  });

  it('returns NETWORK for 5xx server errors', () => {
    assert.equal(exitCodeFromError({ status: 500 }), EXIT.NETWORK);
  });

  it('returns NETWORK for generic errors', () => {
    assert.equal(exitCodeFromError(new Error('ECONNREFUSED')), EXIT.NETWORK);
  });

  it('returns NETWORK for null/undefined', () => {
    assert.equal(exitCodeFromError(null), EXIT.NETWORK);
    assert.equal(exitCodeFromError(undefined), EXIT.NETWORK);
  });
});
