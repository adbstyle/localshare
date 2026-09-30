import { describe, expect, it, jest } from '@jest/globals';
import {
  SsoLoginException,
  SsoLoginExceptionFilter,
} from '../../src/auth/sso-login.exception';

describe('SsoLoginExceptionFilter', () => {
  it('redirects to the frontend callback with the error code', () => {
    process.env.FRONTEND_URL = 'https://app.example.com';
    const response = { redirect: jest.fn() };
    const host = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as any;

    new SsoLoginExceptionFilter().catch(
      new SsoLoginException('account_exists'),
      host,
    );

    expect(response.redirect).toHaveBeenCalledWith(
      'https://app.example.com/auth/callback?error=account_exists',
    );
  });
});
