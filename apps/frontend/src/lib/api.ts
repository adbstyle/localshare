import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true, // Required to send HTTPOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for token refresh
// No request interceptor needed - HTTPOnly cookies are sent automatically
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh will set new HTTPOnly cookies automatically
        await axios.post(
          `${API_URL}/api/v1/auth/refresh`,
          {},
          { withCredentials: true }
        );

        // Retry original request - new cookie is already set
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to home (logout)
        // Only redirect if not already on home page to prevent loops
        if (!window.location.pathname.startsWith('/de') && !window.location.pathname.startsWith('/fr') && window.location.pathname !== '/') {
          window.location.href = '/';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message;
    const data = error.response?.data;
    return new ApiError(status, message, data);
  }
  return new ApiError(500, 'An unexpected error occurred');
}
