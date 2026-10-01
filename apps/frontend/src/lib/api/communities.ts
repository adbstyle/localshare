import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Community,
  CommunityMember,
  CommunityPreview,
  CreateCommunityDto,
  UpdateCommunityDto,
} from '@localshare/shared';
import { api } from './client';
import { listingKeys } from './listings';

// Communities and groups are one resource: a group is a community with a parent.

export const communityKeys = {
  all: ['communities'] as const,
  list: () => [...communityKeys.all, 'list'] as const,
  detail: (id: string) => [...communityKeys.all, 'detail', id] as const,
  members: (id: string) => [...communityKeys.detail(id), 'members'] as const,
  preview: (token: string) => [...communityKeys.all, 'preview', token] as const,
};

export const communityQueries = {
  /** All communities and groups of the user, flat (groups carry parentId). */
  list: () =>
    queryOptions({
      queryKey: communityKeys.list(),
      queryFn: async ({ signal }) => (await api.get<Community[]>('/communities', { signal })).data,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: communityKeys.detail(id),
      queryFn: async ({ signal }) => (await api.get<Community>(`/communities/${id}`, { signal })).data,
    }),
  members: (id: string) =>
    queryOptions({
      queryKey: communityKeys.members(id),
      queryFn: async ({ signal }) =>
        (await api.get<CommunityMember[]>(`/communities/${id}/members`, { signal })).data,
    }),
  preview: (token: string) =>
    queryOptions({
      queryKey: communityKeys.preview(token),
      queryFn: async ({ signal }) =>
        (await api.get<CommunityPreview>(`/communities/preview/${token}`, { signal })).data,
      retry: false,
    }),
};

/**
 * Membership changes also change which listings are visible. `refetch: false`
 * only marks the data stale: after leaving or deleting, the page's own detail
 * query would otherwise refetch into a 404 before the navigation away.
 */
function useInvalidateMemberships({ refetch = true } = {}) {
  const queryClient = useQueryClient();
  const refetchType = refetch ? 'active' : 'none';
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: communityKeys.all, refetchType }),
      queryClient.invalidateQueries({ queryKey: listingKeys.all, refetchType }),
    ]);
}

export function useCreateCommunity() {
  const invalidate = useInvalidateMemberships();
  return useMutation({
    mutationFn: async (dto: CreateCommunityDto) => (await api.post<Community>('/communities', dto)).data,
    onSuccess: invalidate,
  });
}

export function useUpdateCommunity(id: string) {
  const invalidate = useInvalidateMemberships();
  return useMutation({
    mutationFn: (dto: UpdateCommunityDto) => api.patch(`/communities/${id}`, dto),
    onSuccess: invalidate,
  });
}

export function useJoinCommunity() {
  const invalidate = useInvalidateMemberships();
  return useMutation({
    mutationFn: async (token: string) =>
      (await api.post<{ community: { id: string; name: string } }>(`/communities/join/${token}`)).data,
    onSuccess: invalidate,
  });
}

/** Leave, delete, remove member and refresh invite of one community or group. */
export function useCommunityActions(id: string) {
  const invalidate = useInvalidateMemberships();
  const invalidateLeavingPage = useInvalidateMemberships({ refetch: false });
  return {
    leave: useMutation({ mutationFn: () => api.delete(`/communities/${id}/leave`), onSuccess: invalidateLeavingPage }),
    remove: useMutation({ mutationFn: () => api.delete(`/communities/${id}`), onSuccess: invalidateLeavingPage }),
    removeMember: useMutation({
      mutationFn: (memberId: string) => api.delete(`/communities/${id}/members/${memberId}`),
      onSuccess: invalidate,
    }),
    refreshInvite: useMutation({
      mutationFn: () => api.post(`/communities/${id}/refresh-invite`),
      onSuccess: invalidate,
    }),
  };
}
