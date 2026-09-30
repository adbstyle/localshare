'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setSessionExpiredHandler } from '@/lib/api/client';
import { authKeys } from '@/lib/api/auth';
import { getApiStatus } from '@/lib/api/errors';

function createQueryClient(): QueryClient {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        // Every write goes through a mutation that updates or invalidates the
        // affected queries, so briefly cached data is safe to show.
        staleTime: 30_000,
        // Retry network/server hiccups once; a 4xx will not change on retry.
        retry: (failureCount, error) => {
          const status = getApiStatus(error);
          return failureCount < 1 && !(status && status >= 400 && status < 500);
        },
      },
    },
  });
  setSessionExpiredHandler(() => client.setQueryData(authKeys.me, null));
  return client;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(createQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
