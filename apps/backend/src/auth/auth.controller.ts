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
import { Response, Request, CookieOptions } from 'express';
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

  private getCookieOptions(
    type: 'access' | 'refresh' | 'pending',
  ): CookieOptions {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.COOKIE_DOMAIN;

    const baseOptions: CookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      domain: cookieDomain || undefined,
    };

    if (type === 'refresh') {
      return {
        ...baseOptions,
        maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
        path: '/api/v1/auth',
      };
    }

    // Both 'access' and 'pending' use 15 minutes
    return {
      ...baseOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    };
  }

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
        this.getCookieOptions('pending'),
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

    // Set refresh token as HTTPOnly cookie (restricted to auth endpoints)
    res.cookie('refreshToken', refreshToken, this.getCookieOptions('refresh'));

    // Set access token as HTTPOnly cookie (available for all API calls)
    res.cookie('accessToken', accessToken, this.getCookieOptions('access'));

    // Build redirect URL WITHOUT token in URL (security best practice)
    let redirectUrl = `${process.env.FRONTEND_URL}/auth/callback`;

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
          redirectUrl += `?redirectTo=${encodeURIComponent(joinPath)}`;
        }
      } catch (error) {
        // Invalid cookie data, ignore
      }
      // Clear the cookie after use
      res.clearCookie('pendingInvite', this.getCookieOptions('pending'));
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
        this.getCookieOptions('pending'),
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

    // Set refresh token as HTTPOnly cookie (restricted to auth endpoints)
    res.cookie('refreshToken', refreshToken, this.getCookieOptions('refresh'));

    // Set access token as HTTPOnly cookie (available for all API calls)
    res.cookie('accessToken', accessToken, this.getCookieOptions('access'));

    // Build redirect URL WITHOUT token in URL (security best practice)
    let redirectUrl = `${process.env.FRONTEND_URL}/auth/callback`;

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
          redirectUrl += `?redirectTo=${encodeURIComponent(joinPath)}`;
        }
      } catch (error) {
        // Invalid cookie data, ignore
      }
      // Clear the cookie after use
      res.clearCookie('pendingInvite', this.getCookieOptions('pending'));
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

    // Set new refresh token as HTTPOnly cookie
    res.cookie('refreshToken', newRefreshToken, this.getCookieOptions('refresh'));

    // Set new access token as HTTPOnly cookie
    res.cookie('accessToken', accessToken, this.getCookieOptions('access'));

    return res.json({ success: true });
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user, @Res() res: Response) {
    await this.authService.logout(user.id);
    res.clearCookie('refreshToken', this.getCookieOptions('refresh'));
    res.clearCookie('accessToken', this.getCookieOptions('access'));
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
