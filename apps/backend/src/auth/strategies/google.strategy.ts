import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { SsoLoginException } from '../sso-login.exception';
import { SsoProvider } from '@prisma/client';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private config: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: config.get('GOOGLE_CLIENT_ID'),
      clientSecret: config.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: config.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<any> {
    const { id, emails, name, displayName } = profile;
    const email = emails?.[0];

    // AuthService trusts Google emails for account linking
    if (email?.verified !== true) {
      throw new SsoLoginException('email_not_verified');
    }

    const [displayFirstName = '', ...displayLastNames] = (displayName || '')
      .trim()
      .split(/\s+/);
    const firstName = name ? name.givenName || '' : displayFirstName;
    const lastName = name ? name.familyName || '' : displayLastNames.join(' ');

    return this.authService.validateSsoUser({
      provider: SsoProvider.GOOGLE,
      providerUserId: id,
      email: email.value,
      firstName: firstName.trim().substring(0, 50),
      lastName: lastName.trim().substring(0, 50),
    });
  }
}
