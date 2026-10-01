'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authKeys, logoutRequest, meQuery } from '@/lib/api/auth';
import { useHydrated } from '@/hooks/use-hydrated';

// Invite tokens parked in sessionStorage during the login flow
const PENDING_INVITE_KEYS = ['pendingInviteToken', 'pendingGroupInviteToken', 'pendingInviteName'];

export function useAuth() {
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery(meQuery);
  // The server always renders "loading". A boundary that hydrates late (the
  // header's Suspense) may find the user already cached; it must still render
  // the server state first or React throws a hydration mismatch.
  const hydrated = useHydrated();

  const logout = useCallback(async () => {
    try {
      await logoutRequest(); // the backend clears the HTTPOnly cookies
      PENDING_INVITE_KEYS.forEach((key) => sessionStorage.removeItem(key));
      queryClient.setQueryData(authKeys.me, null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [queryClient]);

  return { user: hydrated ? (data ?? null) : null, loading: !hydrated || isPending, logout };
}
