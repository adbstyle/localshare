import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { SsoProvider } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { SsoLoginException } from './sso-login.exception';

interface SsoUser {
  provider: SsoProvider;
  providerUserId: string;
  email: string;
  // Only set by providers that report it (Google); unverified emails can't create accounts
  emailVerified?: boolean;
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
    // Prisma drops undefined filters, which would match any account of the provider
    if (!ssoUser.providerUserId) {
      throw new UnauthorizedException('Missing provider user id');
    }

    const email = ssoUser.email.trim().toLowerCase();
    if (!email) {
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

    if (ssoUser.emailVerified === false) {
      throw new SsoLoginException('email_not_verified');
    }

    await this.assertEmailUnused(email);
    return this.createSsoUser(ssoUser, email);
  }

  // Never link by email: Microsoft does not verify mail/UPN (any tenant admin
  // can set them) and Google addresses can be reassigned to a new account.
  // lower() because older rows may be mixed-case (Prisma's mode: 'insensitive'
  // compiles to ILIKE, where _ and % in an address act as wildcards).
  // Includes soft-deleted users, whose email stays taken.
  private async assertEmailUnused(email: string) {
    const [existingUser] = await this.prisma.$queryRaw<
      { deleted_at: Date | null }[]
    >`SELECT deleted_at FROM users WHERE lower(email) = ${email} LIMIT 1`;

    if (existingUser) {
      throw new SsoLoginException(
        existingUser.deleted_at ? 'account_deleted' : 'account_exists',
      );
    }
  }

  private createSsoUser(ssoUser: SsoUser, email: string) {
    return this.prisma.user.create({
      data: {
        email,
        firstName: ssoUser.firstName,
        lastName: ssoUser.lastName,
        consentGivenAt: new Date(),
        ssoAccounts: {
          create: {
            provider: ssoUser.provider,
            providerUserId: ssoUser.providerUserId,
            providerEmail: email,
          },
        },
      },
      include: {
        ssoAccounts: true,
      },
    });
  }

  async login(user: { id: string; email: string }) {
    // Housekeeping: expired tokens and rows revoked by the old rotation logic
    await this.prisma.refreshToken.deleteMany({
      where: { userId: user.id, OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null } }] },
    });

    return {
      accessToken: this.jwtService.sign({ sub: user.id, email: user.email }),
      refreshToken: await this.generateRefreshToken(user.id),
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

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashRefreshToken(refreshToken) },
      select: { id: true, expiresAt: true, revokedAt: true, user: { select: { id: true, email: true } } },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Rotation: the used token is consumed. deleteMany (not delete) keeps two
    // requests that raced with the same token from failing on each other.
    await this.prisma.refreshToken.deleteMany({ where: { id: stored.id } });

    return {
      accessToken: this.jwtService.sign({ sub: stored.user.id, email: stored.user.email }),
      refreshToken: await this.generateRefreshToken(stored.user.id),
    };
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }
}
