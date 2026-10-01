import axios from 'axios';

export function getApiStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

/**
 * Translation key for a failed request. Backend messages are English and meant
 * for developers, so they are never shown; unknown failures use the fallback.
 */
export function getErrorKey(error: unknown, fallbackKey: string): string {
  if (axios.isAxiosError(error) && !error.response) return 'errors.network';

  const status = getApiStatus(error);
  if (status === 403) return 'errors.forbidden';
  if (status === 404) return 'errors.notFound';
  return fallbackKey;
}
