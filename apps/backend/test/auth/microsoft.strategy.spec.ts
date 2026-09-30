import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SsoProvider } from '@prisma/client';
import { MicrosoftStrategy } from '../../src/auth/strategies/microsoft.strategy';
import { SsoLoginException } from '../../src/auth/sso-login.exception';

describe('MicrosoftStrategy.validate', () => {
  let authService: any;
  let strategy: MicrosoftStrategy;

  function mockGraphMe(body: object) {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => body,
    } as Response);
  }

  beforeEach(() => {
    authService = {
      validateSsoUser: jest.fn<any>().mockResolvedValue({ id: 'user-1' }),
    };
    const config = { get: () => 'test' } as any;
    strategy = new MicrosoftStrategy(config, authService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the user for the Graph profile, falling back to the UPN as email', async () => {
    mockGraphMe({
      id: 'ms-123',
      givenName: 'Anna',
      surname: 'Muster',
      userPrincipalName: 'anna@contoso.com',
    });

    await expect(strategy.validate('access-token')).resolves.toEqual({ id: 'user-1' });
    expect(authService.validateSsoUser).toHaveBeenCalledWith({
      provider: SsoProvider.MICROSOFT,
      providerUserId: 'ms-123',
      email: 'anna@contoso.com',
      firstName: 'Anna',
      lastName: 'Muster',
    });
  });

  it('propagates login rejections from the auth service', async () => {
    mockGraphMe({ id: 'ms-123' });
    authService.validateSsoUser.mockRejectedValue(new SsoLoginException('email_missing'));

    await expect(strategy.validate('access-token')).rejects.toBeInstanceOf(
      SsoLoginException,
    );
  });
});
