export interface ParseResult {
  token: string | null;
  isValid: boolean;
  errorKey?: string;
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
      errorKey: 'communities.errors.invalidUrl'
    };
  } catch {
    // Not a URL - treat as raw token
    if (isValidTokenFormat(trimmed)) {
      return { token: trimmed, isValid: true };
    }
    return {
      token: null,
      isValid: false,
      errorKey: 'communities.errors.invalidToken'
    };
  }
}

function isValidTokenFormat(token: string): boolean {
  // Accept alphanumeric, hyphens, underscores, minimum 8 characters
  return /^[a-zA-Z0-9-_]{8,}$/.test(token);
}
