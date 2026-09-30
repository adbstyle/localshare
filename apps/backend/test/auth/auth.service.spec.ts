import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SsoProvider } from '@prisma/client';
import { AuthService } from '../../src/auth/auth.service';
import { SsoLoginException } from '../../src/auth/sso-login.exception';

const EMAIL = 'anna@example.com';

function googleLogin(overrides = {}) {
  return {
    provider: SsoProvider.GOOGLE,
    providerUserId: 'google-new',
    email: EMAIL,
    firstName: 'Anna',
    lastName: 'Muster',
    ...overrides,
  };
}

function microsoftLogin(overrides = {}) {
  return googleLogin({
    provider: SsoProvider.MICROSOFT,
    providerUserId: 'ms-new',
    ...overrides,
  });
}

function existingUser(providers: SsoProvider[], overrides = {}) {
  return {
    id: 'user-1',
    email: EMAIL,
    deletedAt: null,
    ssoAccounts: providers.map((provider, i) => ({
      provider,
      providerUserId: `existing-${i}`,
    })),
    ...overrides,
  };
}

describe('AuthService.validateSsoUser', () => {
  let prisma: any;
  let service: AuthService;

  beforeEach(() => {
    prisma = {
      user: {
        findFirst: jest.fn<any>().mockResolvedValue(null),
        findUnique: jest.fn<any>().mockResolvedValue(null),
        create: jest.fn<any>().mockImplementation(async ({ data }) => ({
          id: 'user-created',
          ...data,
        })),
      },
      ssoAccount: { create: jest.fn<any>().mockResolvedValue({}) },
    };
    service = new AuthService(prisma, {} as any, {} as any);
  });

  async function expectRejected(login: any, code: string) {
    const error = await service.validateSsoUser(login).catch((e) => e);
    expect(error).toBeInstanceOf(SsoLoginException);
    expect(error.code).toBe(code);
    expect(prisma.ssoAccount.create).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  }

  it('returns the user already linked to this SSO account', async () => {
    const linked = existingUser([SsoProvider.MICROSOFT]);
    prisma.user.findFirst.mockResolvedValue(linked);

    await expect(service.validateSsoUser(microsoftLogin())).resolves.toBe(linked);
    expect(prisma.ssoAccount.create).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('ignores soft-deleted users when looking up the SSO account', async () => {
    await service.validateSsoUser(googleLogin());

    expect(prisma.user.findFirst.mock.calls[0][0]).toMatchObject({
      where: { deletedAt: null },
    });
  });

  it('creates a new user with the SSO account for an unknown email', async () => {
    const user = await service.validateSsoUser(microsoftLogin());

    expect(user.id).toBe('user-created');
    expect(prisma.user.create.mock.calls[0][0]).toMatchObject({
      data: {
        email: EMAIL,
        firstName: 'Anna',
        lastName: 'Muster',
        ssoAccounts: {
          create: {
            provider: SsoProvider.MICROSOFT,
            providerUserId: 'ms-new',
            providerEmail: EMAIL,
          },
        },
      },
    });
  });

  it('rejects a login without email', async () => {
    await expectRejected(microsoftLogin({ email: '' }), 'email_missing');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('never links a Microsoft login to an existing user by email', async () => {
    prisma.user.findUnique.mockResolvedValue(existingUser([SsoProvider.GOOGLE]));

    await expectRejected(microsoftLogin(), 'account_exists');
  });

  it('links a Google login to an existing user that already signs in with Google', async () => {
    const existing = existingUser([SsoProvider.GOOGLE]);
    prisma.user.findUnique.mockResolvedValue(existing);

    await expect(service.validateSsoUser(googleLogin())).resolves.toBe(existing);
    expect(prisma.ssoAccount.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        provider: SsoProvider.GOOGLE,
        providerUserId: 'google-new',
        providerEmail: EMAIL,
      },
    });
  });

  it('does not link a Google login to a user whose email came only from Microsoft', async () => {
    prisma.user.findUnique.mockResolvedValue(existingUser([SsoProvider.MICROSOFT]));

    await expectRejected(googleLogin(), 'account_exists');
  });

  it('rejects a login whose email belongs to a deleted user', async () => {
    prisma.user.findUnique.mockResolvedValue(
      existingUser([], { deletedAt: new Date('2026-09-01') }),
    );

    await expectRejected(googleLogin(), 'account_deleted');
  });
});
