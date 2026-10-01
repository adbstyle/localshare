export interface ParseResult {
  token: string | null;
  isValid: boolean;
  /** Relative to the caller's namespace ('communities' or 'groups'). */
  errorKey?: 'errors.invalidUrl' | 'errors.invalidToken';
}

export function parseInviteInput(input: string): ParseResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return { token: null, isValid: false };
  }

  // Try to parse as URL
  try {
    const url = new URL(trimmed);
    const token = url.searchParams.get('token');

    if (token && isValidTokenFormat(token)) {
      return { token, isValid: true };
    }
    return {
      token: null,
      isValid: false,
      errorKey: 'errors.invalidUrl'
    };
  } catch {
    // Not a URL - treat as raw token
    if (isValidTokenFormat(trimmed)) {
      return { token: trimmed, isValid: true };
    }
    return {
      token: null,
      isValid: false,
      errorKey: 'errors.invalidToken'
    };
  }
}

function isValidTokenFormat(token: string): boolean {
  // Accept alphanumeric, hyphens, underscores, minimum 8 characters
  return /^[a-zA-Z0-9-_]{8,}$/.test(token);
}
