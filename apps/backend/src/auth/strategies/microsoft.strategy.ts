import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-microsoft';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { SsoProvider } from '@prisma/client';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(
  Strategy,
  'microsoft',
) {
  constructor(
    private config: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: config.get('MICROSOFT_CLIENT_ID'),
      clientSecret: config.get('MICROSOFT_CLIENT_SECRET'),
      callbackURL: config.get('MICROSOFT_CALLBACK_URL'),
      scope: ['user.read'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, name } = profile;

    const user = await this.authService.validateSsoUser({
      provider: SsoProvider.MICROSOFT,
      providerUserId: id,
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
    });

    done(null, user);
  }
}
