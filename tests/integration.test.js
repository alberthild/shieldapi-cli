import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = resolve(__dirname, '../bin/shieldapi.js');

/**
 * Helper to run the CLI and return { stdout, stderr, status }.
 * Does not throw on non-zero exit.
 */
function runCLI(args, opts = {}) {
  try {
    const stdout = execFileSync('node', [CLI, ...args], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30000,
      ...opts,
    });
    return { stdout, stderr: '', status: 0 };
  } catch (err) {
    return {
      stdout: err.stdout || '',
      stderr: err.stderr || '',
      status: err.status,
    };
  }
}

describe('E2E: password command (demo)', () => {
  it('password "test123" --demo exits 1 (risk found)', () => {
    const { status } = runCLI(['password', 'test123', '--demo', '-q']);
    assert.equal(status, 1, 'Expected exit code 1 (RISK) for a known breached password');
  });

  it('password "test123" --demo --json returns valid JSON on stdout', () => {
    const { stdout, status } = runCLI(['password', 'test123', '--demo', '--json']);
    assert.equal(status, 1);
    const data = JSON.parse(stdout);
    assert.ok('found' in data, 'Expected "found" field in response');
    assert.equal(data.found, true);
  });
});

describe('E2E: hash command', () => {
  it('hash "test123" outputs correct SHA-1', () => {
    const { stdout, status } = runCLI(['hash', 'test123', '--json']);
    assert.equal(status, 0);
    const data = JSON.parse(stdout);
    assert.equal(data.sha1, '7288EDD0FC3FFCBE93A0CF06E3568E28521687BC');
  });
});

describe('E2E: health command', () => {
  it('health exits 0', () => {
    const { status } = runCLI(['health', '-q']);
    assert.equal(status, 0, 'Expected exit code 0 for health check');
  });
});

describe('E2E: password usage error', () => {
  it('password --demo with no arg and no stdin exits 2', () => {
    const { status, stderr } = runCLI(['password', '--demo']);
    assert.equal(status, 2, 'Expected exit code 2 (USAGE) for missing password');
    assert.ok(stderr.includes('Provide a password') || stderr.includes('Error'), 'Expected usage error on stderr');
  });
});

describe('E2E: input validation', () => {
  it('email with invalid format exits 2', () => {
    const { status, stderr } = runCLI(['email', 'not-an-email', '--demo']);
    assert.equal(status, 2);
    assert.ok(stderr.includes('Invalid email'));
  });

  it('ip with invalid format exits 2', () => {
    const { status, stderr } = runCLI(['ip', 'not-an-ip', '--demo']);
    assert.equal(status, 2);
    assert.ok(stderr.includes('Invalid IPv4'));
  });

  it('domain with protocol prefix exits 2', () => {
    const { status, stderr } = runCLI(['domain', 'https://example.com', '--demo']);
    assert.equal(status, 2);
    assert.ok(stderr.includes('Invalid domain'));
  });

  it('url without protocol exits 2', () => {
    const { status, stderr } = runCLI(['url', 'example.com', '--demo']);
    assert.equal(status, 2);
    assert.ok(stderr.includes('Invalid URL'));
  });
});
