import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getPageNumbers } from './pagination';

describe('getPageNumbers', () => {
  it('lists every page up to seven', () => {
    assert.deepEqual(getPageNumbers(1, 3), [1, 2, 3]);
    assert.deepEqual(getPageNumbers(4, 7), [1, 2, 3, 4, 5, 6, 7]);
  });

  it('collapses distant pages into ellipses', () => {
    assert.deepEqual(getPageNumbers(1, 20), [1, 2, 'ellipsis', 20]);
    assert.deepEqual(getPageNumbers(10, 20), [1, 'ellipsis', 9, 10, 11, 'ellipsis', 20]);
    assert.deepEqual(getPageNumbers(20, 20), [1, 'ellipsis', 19, 20]);
  });
});
