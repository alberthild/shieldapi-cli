import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = resolve(__dirname, '../bin/shieldapi.js');

describe('SHA-1 hash correctness', () => {
  it('hashes "test123" correctly', () => {
    const hash = createHash('sha1').update('test123').digest('hex').toUpperCase();
    assert.equal(hash, '7288EDD0FC3FFCBE93A0CF06E3568E28521687BC');
  });

  it('hashes empty string correctly', () => {
    const hash = createHash('sha1').update('').digest('hex').toUpperCase();
    assert.equal(hash, 'DA39A3EE5E6B4B0D3255BFEF95601890AFD80709');
  });

  it('hashes "password" correctly', () => {
    const hash = createHash('sha1').update('password').digest('hex').toUpperCase();
    assert.equal(hash, '5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8');
  });
});

describe('hash command output', () => {
  it('outputs correct SHA-1 in text mode', () => {
    const result = execFileSync('node', [CLI, 'hash', 'test123'], {
      encoding: 'utf8',
      env: { ...process.env, NO_COLOR: '1' },
    });
    assert.ok(result.includes('7288EDD0FC3FFCBE93A0CF06E3568E28521687BC'));
    assert.ok(result.includes('7288E')); // prefix
  });

  it('outputs correct JSON in --json mode', () => {
    const result = execFileSync('node', [CLI, 'hash', 'test123', '--json'], {
      encoding: 'utf8',
    });
    const data = JSON.parse(result);
    assert.equal(data.sha1, '7288EDD0FC3FFCBE93A0CF06E3568E28521687BC');
    assert.equal(data.prefix, '7288E');
    assert.equal(data.password_length, 7);
  });
});
