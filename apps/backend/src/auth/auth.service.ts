import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { SsoAccount, SsoProvider } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { SsoLoginException } from './sso-login.exception';

interface SsoUser {
  provider: SsoProvider;
  providerUserId: string;
  email: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async validateSsoUser(ssoUser: SsoUser) {
    if (!ssoUser.email) {
      throw new SsoLoginException('email_missing');
    }

    const linkedUser = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        ssoAccounts: {
          some: {
            provider: ssoUser.provider,
            providerUserId: ssoUser.providerUserId,
          },
        },
      },
      include: {
        ssoAccounts: true,
      },
    });

    if (linkedUser) {
      return linkedUser;
    }

    // Includes soft-deleted users: their email stays taken (unique)
    const existingUser = await this.prisma.user.findUnique({
      where: { email: ssoUser.email },
      include: { ssoAccounts: true },
    });

    if (!existingUser) {
      return this.createSsoUser(ssoUser);
    }

    if (existingUser.deletedAt) {
      throw new SsoLoginException('account_deleted');
    }

    if (!this.canLinkByEmail(ssoUser, existingUser.ssoAccounts)) {
      throw new SsoLoginException('account_exists');
    }

    await this.prisma.ssoAccount.create({
      data: {
        userId: existingUser.id,
        provider: ssoUser.provider,
        providerUserId: ssoUser.providerUserId,
        providerEmail: ssoUser.email,
      },
    });
    return existingUser;
  }

  // Only Google verifies email ownership (GoogleStrategy rejects unverified
  // addresses). Microsoft returns whatever a tenant admin set as mail/UPN, so a
  // Microsoft login must never link by email, and an account whose email came
  // only from Microsoft must not receive links either (pre-account takeover).
  private canLinkByEmail(
    ssoUser: SsoUser,
    existingAccounts: Pick<SsoAccount, 'provider'>[],
  ): boolean {
    return (
      ssoUser.provider === SsoProvider.GOOGLE &&
      existingAccounts.some((account) => account.provider === SsoProvider.GOOGLE)
    );
  }

  private createSsoUser(ssoUser: SsoUser) {
    return this.prisma.user.create({
      data: {
        email: ssoUser.email,
        firstName: ssoUser.firstName,
        lastName: ssoUser.lastName,
        consentGivenAt: new Date(),
        ssoAccounts: {
          create: {
            provider: ssoUser.provider,
            providerUserId: ssoUser.providerUserId,
            providerEmail: ssoUser.email,
          },
        },
      },
      include: {
        ssoAccounts: true,
      },
    });
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  // High-entropy random token, so a fast deterministic hash is sufficient and
  // allows a direct unique-index lookup instead of comparing against every row.
  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async generateRefreshToken(userId: string): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    const tokenHash = this.hashRefreshToken(token);

    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() +
        parseInt(this.config.get('JWT_REFRESH_EXPIRATION', '90')),
    );

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return token;
  }

  async refreshTokens(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    const validToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashRefreshToken(refreshToken) },
      include: { user: true },
    });

    if (!validToken || validToken.revokedAt || validToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old token (token rotation)
    await this.prisma.refreshToken.update({
      where: { id: validToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const payload = {
      sub: validToken.user.id,
      email: validToken.user.email,
    };
    const accessToken = this.jwtService.sign(payload);
    const newRefreshToken = await this.generateRefreshToken(
      validToken.user.id,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}
