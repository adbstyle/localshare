import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { SsoProvider } from '@prisma/client';

interface MicrosoftUserInfo {
  id: string;
  displayName?: string;
  givenName?: string;
  surname?: string;
  mail?: string;
  userPrincipalName?: string;
}

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(
  OAuth2Strategy,
  'microsoft',
) {
  constructor(
    private config: ConfigService,
    private authService: AuthService,
  ) {
    super({
      authorizationURL:
        'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      clientID: config.get('MICROSOFT_CLIENT_ID'),
      clientSecret: config.get('MICROSOFT_CLIENT_SECRET'),
      callbackURL: config.get('MICROSOFT_CALLBACK_URL'),
      scope: ['openid', 'profile', 'email', 'User.Read'],
    });
  }

  async validate(
    accessToken: string,
    _refreshToken: string,
    _profile: any,
    done: any,
  ): Promise<any> {
    try {
      // Fetch user info from Microsoft Graph API
      const userInfoResponse = await fetch(
        'https://graph.microsoft.com/v1.0/me',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!userInfoResponse.ok) {
        return done(new Error('Failed to fetch user profile'), null);
      }

      const userInfo: MicrosoftUserInfo = await userInfoResponse.json();

      const user = await this.authService.validateSsoUser({
        provider: SsoProvider.MICROSOFT,
        providerUserId: userInfo.id,
        email: userInfo.mail || userInfo.userPrincipalName || '',
        firstName: userInfo.givenName || '',
        lastName: userInfo.surname || '',
      });

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
}
