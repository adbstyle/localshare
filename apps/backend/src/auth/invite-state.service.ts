import { Injectable } from '@nestjs/common';

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
   */
  generateRedirectUrl(inviteToken: string, inviteType: string): string {
    if (inviteType === 'community') {
      return `/communities/join?token=${inviteToken}`;
    } else if (inviteType === 'group') {
      return `/groups/join?token=${inviteToken}`;
    }
    return '/';
  }
}
