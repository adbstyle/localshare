import { BadRequestException, Injectable } from '@nestjs/common';

export interface InviteState {
  inviteToken?: string;
  inviteType?: 'community' | 'group';
  timestamp?: number;
}

@Injectable()
export class InviteStateService {
  /**
   * Generate a base64url-encoded state parameter for OAuth flow
   * Contains invite token and type for post-auth redirect
   */
  generateState(
    inviteToken?: string,
    inviteType?: 'community' | 'group',
  ): string {
    const state: InviteState = {
      inviteToken,
      inviteType,
      timestamp: Date.now(),
    };
    return Buffer.from(JSON.stringify(state)).toString('base64url');
  }

  /**
   * Parse and decode the OAuth state parameter
   * Returns invite token and type if present
   */
  parseState(state: string): InviteState {
    try {
      const decoded = Buffer.from(state, 'base64url').toString('utf-8');
      return JSON.parse(decoded);
    } catch {
      return {};
    }
  }

  /**
   * Generate the frontend redirect URL based on invite type and token
   * Implements defense-in-depth: validates input format and encodes output
   */
  generateRedirectUrl(inviteToken: string, inviteType: string): string {
    // Layer 1: Input Validation - ensure token is valid UUID format
    if (!this.isValidUUID(inviteToken)) {
      throw new BadRequestException('Invalid invite token format');
    }

    // Layer 2: Output Encoding - defense-in-depth against potential XSS
    const encodedToken = encodeURIComponent(inviteToken);

    if (inviteType === 'community') {
      return `/communities/join?token=${encodedToken}`;
    } else if (inviteType === 'group') {
      return `/groups/join?token=${encodedToken}`;
    }
    return '/';
  }

  /**
   * Validate that a token matches PostgreSQL UUID format
   * Format: xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx
   * M: UUID version (1-5)
   * N: UUID variant (8, 9, a, or b)
   */
  private isValidUUID(token: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(token);
  }
}
