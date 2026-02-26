import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { isValidEmail, isValidIPv4, isValidDomain, isValidUrl } from '../src/lib/validator.js';

describe('isValidEmail', () => {
  it('accepts valid email', () => {
    assert.ok(isValidEmail('user@example.com'));
    assert.ok(isValidEmail('a@b.co'));
  });

  it('rejects missing @', () => {
    assert.ok(!isValidEmail('userexample.com'));
  });

  it('rejects empty local part', () => {
    assert.ok(!isValidEmail('@example.com'));
  });

  it('rejects domain without dot', () => {
    assert.ok(!isValidEmail('user@localhost'));
  });

  it('rejects null/undefined/empty', () => {
    assert.ok(!isValidEmail(null));
    assert.ok(!isValidEmail(undefined));
    assert.ok(!isValidEmail(''));
  });
});

describe('isValidIPv4', () => {
  it('accepts valid IPv4', () => {
    assert.ok(isValidIPv4('1.2.3.4'));
    assert.ok(isValidIPv4('192.168.0.1'));
    assert.ok(isValidIPv4('255.255.255.255'));
  });

  it('rejects IPv6', () => {
    assert.ok(!isValidIPv4('::1'));
  });

  it('rejects non-IP strings', () => {
    assert.ok(!isValidIPv4('example.com'));
    assert.ok(!isValidIPv4('abc'));
  });

  it('rejects null/empty', () => {
    assert.ok(!isValidIPv4(null));
    assert.ok(!isValidIPv4(''));
  });
});

describe('isValidDomain', () => {
  it('accepts valid domains', () => {
    assert.ok(isValidDomain('example.com'));
    assert.ok(isValidDomain('sub.example.co.uk'));
  });

  it('rejects URLs with protocol', () => {
    assert.ok(!isValidDomain('http://example.com'));
    assert.ok(!isValidDomain('https://example.com'));
  });

  it('rejects strings without dot', () => {
    assert.ok(!isValidDomain('localhost'));
  });

  it('rejects strings with spaces', () => {
    assert.ok(!isValidDomain('not a domain'));
  });

  it('rejects null/empty', () => {
    assert.ok(!isValidDomain(null));
    assert.ok(!isValidDomain(''));
  });
});

describe('isValidUrl', () => {
  it('accepts http URLs', () => {
    assert.ok(isValidUrl('http://example.com'));
  });

  it('accepts https URLs', () => {
    assert.ok(isValidUrl('https://example.com/path'));
  });

  it('rejects bare domains', () => {
    assert.ok(!isValidUrl('example.com'));
  });

  it('rejects ftp URLs', () => {
    assert.ok(!isValidUrl('ftp://example.com'));
  });

  it('rejects null/empty', () => {
    assert.ok(!isValidUrl(null));
    assert.ok(!isValidUrl(''));
  });
});
