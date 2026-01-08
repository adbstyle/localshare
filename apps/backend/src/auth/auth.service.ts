import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { SsoProvider } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

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
    // Check if SSO account exists
    let user = await this.prisma.user.findFirst({
      where: {
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

    if (user) {
      return user;
    }

    // Check if user exists with same email (account linking)
    user = await this.prisma.user.findUnique({
      where: { email: ssoUser.email },
      include: { ssoAccounts: true },
    });

    if (user) {
      // Link new SSO account to existing user
      await this.prisma.ssoAccount.create({
        data: {
          userId: user.id,
          provider: ssoUser.provider,
          providerUserId: ssoUser.providerUserId,
          providerEmail: ssoUser.email,
        },
      });
      return user;
    }

    // Create new user with SSO account
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

  async generateRefreshToken(userId: string): Promise<string> {
    const token = uuidv4();
    const tokenHash = await bcrypt.hash(token, 10);

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

    // Find valid refresh token
    const tokens = await this.prisma.refreshToken.findMany({
      where: {
        revokedAt: null,
        expiresAt: { gte: new Date() },
      },
      include: { user: true },
    });

    let validToken: typeof tokens[0] | null = null;
    for (const token of tokens) {
      const isValid = await bcrypt.compare(refreshToken, token.tokenHash);
      if (isValid) {
        validToken = token;
        break;
      }
    }

    if (!validToken) {
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
