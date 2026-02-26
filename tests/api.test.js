import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { ApiError } from '../src/lib/api.js';

describe('ApiError', () => {
  it('constructs with status and plain body', () => {
    const err = new ApiError(404, 'Not Found');
    assert.equal(err.name, 'ApiError');
    assert.equal(err.status, 404);
    assert.ok(err.message.includes('404'));
    assert.ok(err.message.includes('Not Found'));
  });

  it('constructs with status and JSON body with error field', () => {
    const body = JSON.stringify({ error: 'Bad Request', details: 'missing param' });
    const err = new ApiError(400, body);
    assert.equal(err.status, 400);
    assert.ok(err.message.includes('Bad Request'));
    assert.ok(err.message.includes('missing param'));
  });

  it('constructs with status and empty body', () => {
    const err = new ApiError(500, '');
    assert.equal(err.status, 500);
    assert.ok(err.message.includes('500'));
  });

  it('constructs with JSON body without error field', () => {
    const body = JSON.stringify({ status: 'ok' });
    const err = new ApiError(503, body);
    assert.equal(err.status, 503);
    // Should just say "API returned 503" without extra detail
    assert.ok(err.message.includes('503'));
  });

  it('is an instance of Error', () => {
    const err = new ApiError(422, 'Invalid');
    assert.ok(err instanceof Error);
    assert.ok(err instanceof ApiError);
  });
});
