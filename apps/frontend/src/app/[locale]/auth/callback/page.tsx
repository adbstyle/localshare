'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      localStorage.setItem('accessToken', token);
      fetchUser().then(() => {
        // Check if there's a pending invite token
        const pendingInviteToken = sessionStorage.getItem('pendingInviteToken');
        if (pendingInviteToken) {
          sessionStorage.removeItem('pendingInviteToken');
          router.push(`/communities/join?token=${pendingInviteToken}`);
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
