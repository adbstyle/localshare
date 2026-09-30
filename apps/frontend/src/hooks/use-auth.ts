'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authKeys, logoutRequest, meQuery } from '@/lib/api/auth';

// Invite tokens parked in sessionStorage during the login flow
const PENDING_INVITE_KEYS = ['pendingInviteToken', 'pendingGroupInviteToken', 'pendingInviteName'];

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user = null, isPending } = useQuery(meQuery);

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

  return { user, loading: isPending, logout };
}
