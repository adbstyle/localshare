'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link, useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Backend InviteStateService generates redirectTo via OAuth flow with UUID validation
// '/groups/join' only for invites started before #191; next.config redirects it
const ALLOWED_REDIRECT_PREFIXES = ['/communities/join', '/groups/join'];

// Error codes set by the backend SsoLoginExceptionFilter
const LOGIN_ERROR_CODES = ['email_missing', 'email_not_verified', 'account_exists', 'account_deleted'];

// Defense-in-depth: validate even backend-provided redirects to prevent open redirect (CWE-601)
function isValidRedirectUrl(url: string): boolean {
  if (!url.startsWith('/')) return false;
  if (url.startsWith('//')) return false;
  return ALLOWED_REDIRECT_PREFIXES.some(
    (prefix) => url === prefix || url.startsWith(prefix + '?')
  );
}

/** Where to go after login: backend invite redirect, then a pending invite, else home. */
function postLoginTarget(searchParams: URLSearchParams): string {
  const redirectTo = searchParams.get('redirectTo');
  if (redirectTo && isValidRedirectUrl(redirectTo)) return redirectTo;

  // Communities and groups share one join page; the group key only changes wording
  const token = sessionStorage.getItem('pendingInviteToken') ?? sessionStorage.getItem('pendingGroupInviteToken');
  sessionStorage.removeItem('pendingInviteToken');
  sessionStorage.removeItem('pendingGroupInviteToken');
  return token ? `/communities/join?token=${token}` : '/';
}

function LoginError({ code }: { code: string }) {
  const t = useTranslations('auth.loginErrors');
  const messageKey = LOGIN_ERROR_CODES.includes(code) ? code : 'unknown';

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold mb-4">{t('title')}</h1>
        <p className="text-muted-foreground mb-6">{t(messageKey)}</p>
        <Button asChild>
          <Link href="/">{t('backToLogin')}</Link>
        </Button>
      </div>
    </div>
  );
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const { user, loading } = useAuth();
  const loginError = searchParams.get('error');

  useEffect(() => {
    // The backend already set the HTTPOnly cookies; useAuth verifies them.
    if (loginError || loading) return;
    router.replace(user ? postLoginTarget(searchParams) : '/');
  }, [loginError, loading, user, searchParams, router]);

  if (loginError) {
    return <LoginError code={loginError} />;
  }

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
