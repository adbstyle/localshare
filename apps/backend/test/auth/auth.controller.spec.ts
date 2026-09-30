import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthGuard } from '@nestjs/passport';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { InviteStateService } from '../../src/auth/invite-state.service';
import { SsoLoginException } from '../../src/auth/sso-login.exception';

const rejectingGuard = {
  canActivate: () => {
    throw new SsoLoginException('account_exists');
  },
};

describe('AuthController SSO callbacks', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    process.env.FRONTEND_URL = 'https://app.example.com';
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: {} },
        { provide: InviteStateService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard('google'))
      .useValue(rejectingGuard)
      .overrideGuard(AuthGuard('microsoft'))
      .useValue(rejectingGuard)
      .compile();

    app = moduleRef.createNestApplication();
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(['google', 'microsoft'])(
    'redirects a rejected %s login to the frontend with the error code',
    async (provider) => {
      const response = await fetch(`${baseUrl}/auth/${provider}/callback`, {
        redirect: 'manual',
      });

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe(
        'https://app.example.com/auth/callback?error=account_exists',
      );
    },
  );
});
