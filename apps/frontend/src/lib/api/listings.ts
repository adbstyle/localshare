import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { FilterListingsDto, Listing, PaginatedResponse } from '@localshare/shared';
import { appendFilterParams } from '@/lib/utils/url-filters';
import { api } from './client';

export const listingKeys = {
  all: ['listings'] as const,
  lists: () => [...listingKeys.all, 'list'] as const,
  list: (filters: FilterListingsDto) => [...listingKeys.lists(), filters] as const,
  count: (filters: Partial<FilterListingsDto>) => [...listingKeys.all, 'count', filters] as const,
  detail: (id: string) => [...listingKeys.all, 'detail', id] as const,
};

async function fetchFeed(
  filters: Partial<FilterListingsDto>,
  signal: AbortSignal,
): Promise<PaginatedResponse<Listing>> {
  const params = appendFilterParams(new URLSearchParams(), filters);
  if (filters.limit) params.set('limit', filters.limit.toString());
  if (filters.offset !== undefined) params.set('offset', filters.offset.toString());

  const { data } = await api.get<PaginatedResponse<Listing>>(`/listings/paginated?${params}`, { signal });
  return data;
}

export const listingQueries = {
  list: (filters: FilterListingsDto) =>
    queryOptions({
      queryKey: listingKeys.list(filters),
      queryFn: ({ signal }) => fetchFeed(filters, signal),
    }),
  /** Number of matches only, e.g. for the "show N results" button. */
  count: (filters: Partial<FilterListingsDto>) =>
    queryOptions({
      queryKey: listingKeys.count(filters),
      queryFn: ({ signal }) => fetchFeed({ ...filters, limit: 1, offset: 0 }, signal).then((page) => page.total),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: listingKeys.detail(id),
      queryFn: async ({ signal }) => (await api.get<Listing>(`/listings/${id}`, { signal })).data,
    }),
};

export function useToggleBookmark(listingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () =>
      (await api.post<{ isBookmarked: boolean }>(`/listings/${listingId}/bookmark`)).data,
    onSuccess: ({ isBookmarked }) => {
      queryClient.setQueryData<Listing>(listingKeys.detail(listingId), (old) => old && { ...old, isBookmarked });
      // Lists filtered by "bookmarked" must drop or gain the listing
      queryClient.invalidateQueries({ queryKey: listingKeys.lists() });
    },
  });
}

export function useDeleteListing(listingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.delete(`/listings/${listingId}`),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: listingKeys.detail(listingId) });
      queryClient.invalidateQueries({ queryKey: listingKeys.all });
    },
  });
}
