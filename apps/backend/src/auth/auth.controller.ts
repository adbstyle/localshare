import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InviteStateService } from './invite-state.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private inviteStateService: InviteStateService,
  ) {}

  @Public()
  @Get('google')
  async googleAuth(
    @Req() req: Request,
    @Res() res: Response,
    @Query('inviteToken') inviteToken?: string,
    @Query('inviteType') inviteType?: 'community' | 'group',
  ) {
    // Set cookie BEFORE initiating OAuth flow
    if (inviteToken && inviteType) {
      res.cookie(
        'pendingInvite',
        JSON.stringify({ token: inviteToken, type: inviteType }),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax', // Required for OAuth redirects
          maxAge: 15 * 60 * 1000, // 15 minutes
        },
      );
    }

    // Now trigger the OAuth flow via Passport manually
    const passport = require('passport');
    passport.authenticate('google', { session: false })(req, res);
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    const { accessToken, refreshToken, user } = await this.authService.login(
      req.user,
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 90 * 24 * 60 * 60 * 1000,
    });

    // Build redirect URL with invite context if present
    let redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}`;

    // Check for pending invite in cookie (primary method)
    const pendingInvite = req.cookies['pendingInvite'];
    if (pendingInvite) {
      try {
        const { token, type } = JSON.parse(pendingInvite);
        if (token && type) {
          const joinPath = this.inviteStateService.generateRedirectUrl(
            token,
            type,
          );
          redirectUrl += `&redirectTo=${encodeURIComponent(joinPath)}`;
        }
      } catch (error) {
        // Invalid cookie data, ignore
      }
      // Clear the cookie after use
      res.clearCookie('pendingInvite');
    }

    res.redirect(redirectUrl);
  }

  @Public()
  @Get('microsoft')
  async microsoftAuth(
    @Req() req: Request,
    @Res() res: Response,
    @Query('inviteToken') inviteToken?: string,
    @Query('inviteType') inviteType?: 'community' | 'group',
  ) {
    // Set cookie BEFORE initiating OAuth flow
    if (inviteToken && inviteType) {
      res.cookie(
        'pendingInvite',
        JSON.stringify({ token: inviteToken, type: inviteType }),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax', // Required for OAuth redirects
          maxAge: 15 * 60 * 1000, // 15 minutes
        },
      );
    }

    // Now trigger the OAuth flow via Passport manually
    const passport = require('passport');
    passport.authenticate('microsoft', { session: false })(req, res);
  }

  @Public()
  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuthCallback(@Req() req, @Res() res: Response) {
    const { accessToken, refreshToken, user } = await this.authService.login(
      req.user,
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 90 * 24 * 60 * 60 * 1000,
    });

    // Build redirect URL with invite context if present
    let redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}`;

    // Check for pending invite in cookie (primary method)
    const pendingInvite = req.cookies['pendingInvite'];
    if (pendingInvite) {
      try {
        const { token, type } = JSON.parse(pendingInvite);
        if (token && type) {
          const joinPath = this.inviteStateService.generateRedirectUrl(
            token,
            type,
          );
          redirectUrl += `&redirectTo=${encodeURIComponent(joinPath)}`;
        }
      } catch (error) {
        // Invalid cookie data, ignore
      }
      // Clear the cookie after use
      res.clearCookie('pendingInvite');
    }

    res.redirect(redirectUrl);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies['refreshToken'];
    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refreshTokens(refreshToken);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 90 * 24 * 60 * 60 * 1000,
    });

    return res.json({ accessToken });
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user, @Res() res: Response) {
    await this.authService.logout(user.id);
    res.clearCookie('refreshToken');
    return res.json({ message: 'Logged out successfully' });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      homeAddress: user.homeAddress,
      phoneNumber: user.phoneNumber,
      preferredLanguage: user.preferredLanguage,
    };
  }

  @Public()
  @Get('health')
  async health() {
    return { status: 'ok' };
  }
}
