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
  UseFilters,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request, CookieOptions } from 'express';
import passport from 'passport';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InviteStateService } from './invite-state.service';
import { SsoLoginExceptionFilter } from './sso-login.exception';

type InviteType = 'community' | 'group';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private inviteStateService: InviteStateService,
  ) {}

  private getCookieOptions(
    type: 'access' | 'refresh' | 'pending',
  ): CookieOptions {
    const cookieDomain = process.env.COOKIE_DOMAIN;
    // Auto-detect: COOKIE_DOMAIN is only set in deployed environments (Vercel)
    const isProduction = process.env.NODE_ENV === 'production' || !!cookieDomain;

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
  googleAuth(
    @Req() req: Request,
    @Res() res: Response,
    @Query('inviteToken') inviteToken?: string,
    @Query('inviteType') inviteType?: InviteType,
  ) {
    this.startOAuth('google', req, res, inviteToken, inviteType);
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @UseFilters(SsoLoginExceptionFilter)
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    await this.finishLogin(req, res);
  }

  @Public()
  @Get('microsoft')
  microsoftAuth(
    @Req() req: Request,
    @Res() res: Response,
    @Query('inviteToken') inviteToken?: string,
    @Query('inviteType') inviteType?: InviteType,
  ) {
    this.startOAuth('microsoft', req, res, inviteToken, inviteType);
  }

  @Public()
  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  @UseFilters(SsoLoginExceptionFilter)
  async microsoftAuthCallback(@Req() req, @Res() res: Response) {
    await this.finishLogin(req, res);
  }

  /** Parks a pending invite in a cookie, then hands over to the provider. */
  private startOAuth(
    provider: 'google' | 'microsoft',
    req: Request,
    res: Response,
    inviteToken?: string,
    inviteType?: InviteType,
  ) {
    if (inviteToken && inviteType) {
      res.cookie(
        'pendingInvite',
        JSON.stringify({ token: inviteToken, type: inviteType }),
        this.getCookieOptions('pending'),
      );
    }
    passport.authenticate(provider, { session: false })(req, res);
  }

  /** Sets the session cookies and redirects to the frontend (no token in the URL). */
  private async finishLogin(req, res: Response) {
    const { accessToken, refreshToken } = await this.authService.login(req.user);
    res.cookie('refreshToken', refreshToken, this.getCookieOptions('refresh'));
    res.cookie('accessToken', accessToken, this.getCookieOptions('access'));

    let redirectUrl = `${process.env.FRONTEND_URL}/auth/callback`;
    const joinPath = this.pendingInvitePath(req.cookies['pendingInvite']);
    if (joinPath) redirectUrl += `?redirectTo=${encodeURIComponent(joinPath)}`;
    if (req.cookies['pendingInvite']) {
      res.clearCookie('pendingInvite', this.getCookieOptions('pending'));
    }

    res.redirect(redirectUrl);
  }

  private pendingInvitePath(cookie?: string): string | null {
    if (!cookie) return null;
    try {
      const { token, type } = JSON.parse(cookie);
      return token && type ? this.inviteStateService.generateRedirectUrl(token, type) : null;
    } catch {
      return null; // malformed cookie or token: log in without the invite
    }
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
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user, @Res() res: Response) {
    await this.authService.logout(user.id);
    res.clearCookie('refreshToken', this.getCookieOptions('refresh'));
    res.clearCookie('accessToken', this.getCookieOptions('access'));
    return res.json({ message: 'Logged out successfully' });
  }

  @Get('me')
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
