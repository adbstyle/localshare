import { queryOptions } from '@tanstack/react-query';
import { Community } from '@localshare/shared';
import { api } from './client';

export const communityKeys = {
  all: ['communities'] as const,
  list: () => [...communityKeys.all, 'list'] as const,
};

export const communityQueries = {
  list: () =>
    queryOptions({
      queryKey: communityKeys.list(),
      queryFn: async ({ signal }) => (await api.get<Community[]>('/communities', { signal })).data,
    }),
};
