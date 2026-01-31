'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Backend InviteStateService generates redirectTo via OAuth flow with UUID validation
const ALLOWED_REDIRECT_PREFIXES = ['/communities/join', '/groups/join'];

// Defense-in-depth: validate even backend-provided redirects to prevent open redirect (CWE-601)
function isValidRedirectUrl(url: string): boolean {
  if (!url.startsWith('/')) return false;
  if (url.startsWith('//')) return false;
  return ALLOWED_REDIRECT_PREFIXES.some(
    (prefix) => url === prefix || url.startsWith(prefix + '?')
  );
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const { fetchUser } = useAuth();

  useEffect(() => {
    // No token in URL needed - HTTPOnly cookies are set by backend
    // Just fetch user to verify auth and get user data
    fetchUser().then(() => {
      // Check URL params for redirect (from backend invite flow)
      const redirectTo = searchParams.get('redirectTo');

      if (redirectTo && isValidRedirectUrl(redirectTo)) {
        router.replace(redirectTo);
        return;
      }

      // Fallback: Check sessionStorage for pending invites
      const communityToken = sessionStorage.getItem('pendingInviteToken');
      const groupToken = sessionStorage.getItem('pendingGroupInviteToken');

      if (communityToken) {
        sessionStorage.removeItem('pendingInviteToken');
        router.replace(`/communities/join?token=${communityToken}`);
      } else if (groupToken) {
        sessionStorage.removeItem('pendingGroupInviteToken');
        router.replace(`/groups/join?token=${groupToken}`);
      } else {
        router.replace('/');
      }
    }).catch(() => {
      // Auth failed, redirect to home
      router.replace('/');
    });
  }, [searchParams, router, fetchUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">{t('common.authenticating')}</p>
      </div>
    </div>
  );
}

function AuthCallbackFallback() {
  const t = useTranslations();
  return <LoadingSpinner fullScreen message={t('common.loading')} ariaLabel={t('common.loading')} />;
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<AuthCallbackFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
