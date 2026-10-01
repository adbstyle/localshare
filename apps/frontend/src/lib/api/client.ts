import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const baseURL = `${API_URL}/api/v1`;

export const api = axios.create({
  baseURL,
  withCredentials: true, // Required to send HTTPOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Bare instance for the refresh call so it never runs through the 401 interceptor.
export const refreshClient = axios.create({ baseURL, withCredentials: true });

let onSessionExpired: () => void = () => {};

/** Called once the refresh token is gone too (the provider clears the cached user). */
export function setSessionExpiredHandler(handler: () => void): void {
  onSessionExpired = handler;
}

let refreshing: Promise<void> | null = null;

// The backend rotates the refresh token on every refresh, so a second parallel
// refresh would fail. All 401s arriving together share this one request.
function refreshSession(): Promise<void> {
  refreshing ??= refreshClient
    .post('/auth/refresh')
    .then(() => undefined)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    if (error.response?.status !== 401 || !config || config._retry) {
      throw error;
    }

    config._retry = true;
    try {
      await refreshSession(); // sets new HTTPOnly cookies
    } catch {
      onSessionExpired();
      throw error;
    }
    return api(config);
  },
);
