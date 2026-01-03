'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      localStorage.setItem('accessToken', token);
      fetchUser().then(() => {
        // Check URL params first (from backend redirect - primary method)
        const redirectTo = searchParams.get('redirectTo');

        if (redirectTo) {
          // Backend provided redirect URL - use it directly
          router.push(redirectTo);
          return;
        }

        // Fallback: Check sessionStorage for pending invites
        const communityToken = sessionStorage.getItem('pendingInviteToken');
        const groupToken = sessionStorage.getItem('pendingGroupInviteToken');

        if (communityToken) {
          sessionStorage.removeItem('pendingInviteToken');
          router.push(`/communities/join?token=${communityToken}`);
        } else if (groupToken) {
          sessionStorage.removeItem('pendingGroupInviteToken');
          router.push(`/groups/join?token=${groupToken}`);
        } else {
          router.push('/');
        }
      });
    } else {
      // No token, redirect to home
      router.push('/');
    }
  }, [searchParams, router, fetchUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Authenticating...</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen message="Loading..." />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
