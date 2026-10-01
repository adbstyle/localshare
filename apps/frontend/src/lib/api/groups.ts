import { queryOptions } from '@tanstack/react-query';
import { Group } from '@localshare/shared';
import { api } from './client';

export const groupKeys = {
  all: ['groups'] as const,
  mine: () => [...groupKeys.all, 'mine'] as const,
};

export const groupQueries = {
  /** All groups the current user belongs to. */
  mine: () =>
    queryOptions({
      queryKey: groupKeys.mine(),
      queryFn: async ({ signal }) => (await api.get<Group[]>('/groups', { signal })).data,
    }),
};
