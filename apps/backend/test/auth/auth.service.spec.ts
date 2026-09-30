import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { SsoProvider } from '@prisma/client';
import { AuthService } from '../../src/auth/auth.service';
import { SsoLoginException } from '../../src/auth/sso-login.exception';

const EMAIL = 'anna@example.com';

function googleLogin(overrides = {}) {
  return {
    provider: SsoProvider.GOOGLE,
    providerUserId: 'google-new',
    email: EMAIL,
    emailVerified: true,
    firstName: 'Anna',
    lastName: 'Muster',
    ...overrides,
  };
}

function microsoftLogin(overrides = {}) {
  return {
    provider: SsoProvider.MICROSOFT,
    providerUserId: 'ms-new',
    email: EMAIL,
    firstName: 'Anna',
    lastName: 'Muster',
    ...overrides,
  };
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

  // `linked` answers the SSO-account lookup, `byEmail` the raw email lookup
  function givenUsers({ linked = null, byEmail = null }: { linked?: any; byEmail?: any }) {
    prisma.user.findFirst.mockResolvedValue(linked);
    prisma.$queryRaw.mockResolvedValue(byEmail ? [byEmail] : []);
  }

  beforeEach(() => {
    prisma = {
      user: {
        findFirst: jest.fn<any>(),
        create: jest.fn<any>().mockImplementation(async ({ data }) => ({
          id: 'user-created',
          ...data,
        })),
      },
      ssoAccount: { create: jest.fn<any>().mockResolvedValue({}) },
      $queryRaw: jest.fn<any>(),
    };
    givenUsers({});
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
    givenUsers({ linked });

    await expect(service.validateSsoUser(microsoftLogin())).resolves.toBe(linked);
    expect(prisma.ssoAccount.create).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('lets a returning user in even if Google reports the email as unverified', async () => {
    const linked = existingUser([SsoProvider.GOOGLE]);
    givenUsers({ linked });

    await expect(
      service.validateSsoUser(googleLogin({ emailVerified: false })),
    ).resolves.toBe(linked);
  });

  it('looks up active users by provider and provider user id', async () => {
    await service.validateSsoUser(googleLogin());

    expect(prisma.user.findFirst.mock.calls[0][0]).toMatchObject({
      where: {
        deletedAt: null,
        ssoAccounts: {
          some: { provider: SsoProvider.GOOGLE, providerUserId: 'google-new' },
        },
      },
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

  it('stores new emails trimmed and lowercase', async () => {
    await service.validateSsoUser(microsoftLogin({ email: ' Anna@Example.COM ' }));

    expect(prisma.user.create.mock.calls[0][0]).toMatchObject({
      data: { email: EMAIL, ssoAccounts: { create: { providerEmail: EMAIL } } },
    });
  });

  it('matches existing emails case-insensitively but exactly (no LIKE wildcards)', async () => {
    await service.validateSsoUser(microsoftLogin({ email: 'Anna_B@Example.COM' }));

    const [sql, ...values] = prisma.$queryRaw.mock.calls[0];
    expect(sql.join('?')).toMatch(/WHERE lower\(email\) = \? /);
    expect(values).toEqual(['anna_b@example.com']);
  });

  it('rejects a login without email', async () => {
    await expectRejected(microsoftLogin({ email: ' ' }), 'email_missing');
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('rejects a login without provider user id', async () => {
    const error = await service
      .validateSsoUser(microsoftLogin({ providerUserId: undefined }))
      .catch((e) => e);

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('never links a Microsoft login to an existing user by email', async () => {
    givenUsers({ byEmail: { deleted_at: null } });

    await expectRejected(microsoftLogin(), 'account_exists');
  });

  it('never links a Google login to an existing user by email', async () => {
    givenUsers({ byEmail: { deleted_at: null } });

    await expectRejected(googleLogin(), 'account_exists');
  });

  it('rejects a login whose email belongs to a deleted user', async () => {
    givenUsers({ byEmail: { deleted_at: new Date('2026-09-01') } });

    await expectRejected(googleLogin(), 'account_deleted');
  });

  it('does not create an account for an unverified Google email', async () => {
    await expectRejected(googleLogin({ emailVerified: false }), 'email_not_verified');
  });

  it('rejects an unverified email before revealing that it is taken', async () => {
    givenUsers({ byEmail: { deleted_at: null } });

    await expectRejected(googleLogin({ emailVerified: false }), 'email_not_verified');
  });
});
