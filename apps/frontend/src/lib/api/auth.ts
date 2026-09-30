import { queryOptions } from '@tanstack/react-query';
import { User } from '@localshare/shared';
import { api } from './client';

export const authKeys = {
  me: ['me'] as const,
};

/** The signed-in user, or null when there is no valid session. */
export const meQuery = queryOptions({
  queryKey: authKeys.me,
  queryFn: async ({ signal }): Promise<User | null> => {
    try {
      const { data } = await api.get<User>('/auth/me', { signal });
      return data;
    } catch {
      return null;
    }
  },
  staleTime: Infinity,
  retry: false,
});

export async function logoutRequest(): Promise<void> {
  await api.post('/auth/logout');
}
