'use client';

import { useEffect, useState } from 'react';
import { api, handleApiError } from '@/lib/api';
import { User } from '@localshare/shared';

interface AuthState {
  user: User | null;
  loading: boolean;
}

let globalAuthState: AuthState = {
  user: null,
  loading: true,
};

const listeners = new Set<(state: AuthState) => void>();

function setGlobalAuthState(newState: Partial<AuthState>) {
  globalAuthState = { ...globalAuthState, ...newState };
  listeners.forEach((listener) => listener(globalAuthState));
}

export function useAuth() {
  const [state, setState] = useState(globalAuthState);

  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  useEffect(() => {
    // Only fetch if we haven't fetched yet (initial loading state)
    if (globalAuthState.loading && !globalAuthState.user) {
      fetchUser();
    }
  }, []);

  const fetchUser = async () => {
    try {
      const { data } = await api.get<User>('/auth/me');
      setGlobalAuthState({ user: data, loading: false });
    } catch (error) {
      console.log('Auth check failed:', error);
      setGlobalAuthState({ user: null, loading: false });
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('accessToken');
      setGlobalAuthState({ user: null, loading: false });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const setUser = (user: User | null) => {
    setGlobalAuthState({ user, loading: false });
  };

  return {
    user: state.user,
    loading: state.loading,
    fetchUser,
    logout,
    setUser,
  };
}
