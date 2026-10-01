import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class InviteStateService {
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

    // Communities and groups share one join page since #191; old group
    // invites still carry inviteType 'group'.
    return ['community', 'group'].includes(inviteType) ? `/communities/join?token=${encodedToken}` : '/';
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
