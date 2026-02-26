import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = resolve(__dirname, '../bin/shieldapi.js');

describe('password --hash validation', () => {
  it('rejects invalid hash (too short)', () => {
    try {
      execFileSync('node', [CLI, 'password', 'abc123', '--hash', '--demo'], {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      assert.fail('Should have exited with non-zero');
    } catch (err) {
      assert.equal(err.status, 2); // EXIT.USAGE
      assert.ok(err.stderr.includes('Invalid SHA-1 hash'));
    }
  });

  it('rejects invalid hash (non-hex characters)', () => {
    try {
      execFileSync('node', [CLI, 'password', 'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ', '--hash', '--demo'], {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      assert.fail('Should have exited with non-zero');
    } catch (err) {
      assert.equal(err.status, 2); // EXIT.USAGE
      assert.ok(err.stderr.includes('Invalid SHA-1 hash'));
    }
  });

  it('accepts valid SHA-1 hash in demo mode', () => {
    // Valid SHA-1 hash for "test123" — exit 1 (RISK) is expected since the password is breached
    try {
      const result = execFileSync('node', [CLI, 'password', '7288EDD0FC3FFCBE93A0CF06E3568E28521687BC', '--hash', '--demo', '--json'], {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      // If exit 0, the hash was accepted and the password was not found
      const data = JSON.parse(result);
      assert.ok('found' in data);
    } catch (err) {
      // Exit 1 (RISK) is also valid — means the hash was accepted and breach found
      assert.equal(err.status, 1, 'Expected exit code 1 (RISK) for known breached password hash');
      const data = JSON.parse(err.stdout);
      assert.ok(data.found === true, 'Expected found:true for breached password');
    }
  });
});
