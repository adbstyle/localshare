import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SsoProvider } from '@prisma/client';
import { GoogleStrategy } from '../../src/auth/strategies/google.strategy';

function googleProfile(overrides = {}) {
  return {
    id: 'google-123',
    displayName: 'Anna Muster',
    name: { givenName: 'Anna', familyName: 'Muster' },
    emails: [{ value: 'anna@example.com', verified: true }],
    ...overrides,
  };
}

describe('GoogleStrategy.validate', () => {
  let authService: any;
  let strategy: GoogleStrategy;

  beforeEach(() => {
    authService = {
      validateSsoUser: jest.fn<any>().mockResolvedValue({ id: 'user-1' }),
    };
    const config = { get: () => 'test' } as any;
    strategy = new GoogleStrategy(config, authService);
  });

  function validate(profile: any) {
    return strategy.validate('access-token', 'refresh-token', profile);
  }

  it('passes the verified Google identity to the auth service', async () => {
    await expect(validate(googleProfile())).resolves.toEqual({ id: 'user-1' });
    expect(authService.validateSsoUser).toHaveBeenCalledWith({
      provider: SsoProvider.GOOGLE,
      providerUserId: 'google-123',
      email: 'anna@example.com',
      emailVerified: true,
      firstName: 'Anna',
      lastName: 'Muster',
    });
  });

  it('reports an email Google has not verified as unverified', async () => {
    await validate(
      googleProfile({ emails: [{ value: 'anna@example.com', verified: false }] }),
    );

    expect(authService.validateSsoUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'anna@example.com', emailVerified: false }),
    );
  });

  it('passes an empty, unverified email when Google sends none', async () => {
    await validate(googleProfile({ emails: undefined }));

    expect(authService.validateSsoUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: '', emailVerified: false }),
    );
  });

  it('falls back to the display name when Google sends no name parts', async () => {
    await validate(googleProfile({ name: undefined, displayName: 'Anna Maria Muster' }));

    expect(authService.validateSsoUser).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'Anna', lastName: 'Maria Muster' }),
    );
  });

  it('uses empty names when Google sends neither name nor display name', async () => {
    await validate(googleProfile({ name: undefined, displayName: undefined }));

    expect(authService.validateSsoUser).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: '', lastName: '' }),
    );
  });
});
