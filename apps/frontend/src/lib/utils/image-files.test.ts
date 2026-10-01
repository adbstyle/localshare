import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateImageFiles } from './image-files';

const MB = 1024 * 1024;

describe('validateImageFiles', () => {
  it('accepts files within count and size limits', () => {
    assert.equal(validateImageFiles([{ size: MB }, { size: 2 * MB }], 1), null);
  });

  it('rejects more than three images in total', () => {
    assert.equal(validateImageFiles([{ size: MB }, { size: MB }], 2), 'tooMany');
  });

  it('rejects files larger than 10 MB', () => {
    assert.equal(validateImageFiles([{ size: 11 * MB }], 0), 'tooLarge');
  });
});
