import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { createTestApp, TestApp } from './helpers/app';
import { resetDb } from './helpers/db';
import { createCommunity, createUser } from './helpers/factories';

describe('Authentication', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });
  beforeEach(() => resetDb(t.prisma));
  afterAll(() => t.close());

  it('rejects protected routes without a token', async () => {
    const response = await t.request('GET', '/communities');
    expect(response.status).toBe(401);
  });

  it('keeps health and invite previews public', async () => {
    const owner = await createUser(t);
    const community = await createCommunity(t, owner.id);

    expect((await t.request('GET', '/health')).status).toBe(200);
    expect((await t.request('GET', `/communities/preview/${community.inviteToken}`)).status).toBe(200);
    expect((await t.request('GET', `/groups/preview/${community.inviteToken}`)).status).toBe(404);
  });

  it('accepts the access token as bearer header and as cookie', async () => {
    const user = await createUser(t);

    expect((await t.request('GET', '/auth/me', { as: user.id })).status).toBe(200);
    expect((await t.request('GET', '/auth/me', { as: user.id, viaCookie: true })).status).toBe(200);
  });

  it('rejects the token of a deleted user', async () => {
    const user = await createUser(t);
    await t.prisma.user.update({ where: { id: user.id }, data: { deletedAt: new Date() } });

    expect((await t.request('GET', '/auth/me', { as: user.id })).status).toBe(401);
  });
});
