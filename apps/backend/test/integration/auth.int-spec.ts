import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { createTestApp, TestApp } from './helpers/app';
import { resetDb } from './helpers/db';
import { AuthService } from '../../src/auth/auth.service';
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

  it('keeps health and the invite preview public', async () => {
    const owner = await createUser(t);
    const community = await createCommunity(t, owner.id);

    expect((await t.request('GET', '/health')).status).toBe(200);
    expect((await t.request('GET', `/communities/preview/${community.inviteToken}`)).status).toBe(200);
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

  describe('refresh tokens', () => {
    const refresh = (token: string) => t.request('POST', '/auth/refresh', { cookie: `refreshToken=${token}` });

    it('rotates: a used refresh token is consumed and cannot be replayed', async () => {
      const user = await createUser(t);
      const { refreshToken } = await t.get(AuthService).login({ id: user.id, email: 'x@test.local' });

      expect((await refresh(refreshToken)).status).toBe(200);
      expect((await refresh(refreshToken)).status).toBe(401);
      expect(await t.prisma.refreshToken.count({ where: { userId: user.id } })).toBe(1);
    });

    it('removes expired tokens on login and all tokens on logout', async () => {
      const user = await createUser(t);
      await t.prisma.refreshToken.createMany({
        data: [{ userId: user.id, tokenHash: 'expired', expiresAt: new Date(Date.now() - 1000) }],
      });

      await t.get(AuthService).login({ id: user.id, email: 'x@test.local' });
      expect(await t.prisma.refreshToken.count({ where: { userId: user.id } })).toBe(1);

      expect((await t.request('POST', '/auth/logout', { as: user.id })).status).toBe(200);
      expect(await t.prisma.refreshToken.count({ where: { userId: user.id } })).toBe(0);
    });
  });
});
