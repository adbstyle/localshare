import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseInviteInput } from './parse-invite';

const TOKEN = '3f1c2b4a-8d6e-4f7a-9b0c-1d2e3f4a5b6c';

describe('parseInviteInput', () => {
  it('reads the token from community and old group invite links', () => {
    assert.equal(parseInviteInput(`https://app.localshare.ch/de/communities/join?token=${TOKEN}`).token, TOKEN);
    assert.equal(parseInviteInput(`https://app.localshare.ch/de/groups/join?token=${TOKEN}`).token, TOKEN);
  });

  it('accepts a raw token', () => {
    assert.deepEqual(parseInviteInput(`  ${TOKEN} `), { token: TOKEN, isValid: true });
  });

  it('returns namespace-relative error keys', () => {
    assert.equal(parseInviteInput('https://example.com/join').errorKey, 'errors.invalidUrl');
    assert.equal(parseInviteInput('abc').errorKey, 'errors.invalidToken');
  });
});
