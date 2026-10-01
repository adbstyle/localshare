'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { AlertCircle, Building2, Loader2, Users } from 'lucide-react';
import { CommunityPreview } from '@localshare/shared';
import { communityQueries, useJoinCommunity } from '@/lib/api/communities';
import { getApiStatus } from '@/lib/api/errors';
import { useRouter } from '@/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useErrorToast } from '@/hooks/use-error-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Single Active Invite Token: only the latest invite survives the login round trip
const INVITE_KEYS = ['pendingInviteToken', 'pendingGroupInviteToken', 'pendingInviteName'];

/** Logged out: remember the (valid) invite and go to the login page. */
function useParkInviteForLogin(token: string | null, preview: CommunityPreview | undefined, enabled: boolean) {
  const router = useRouter();
  useEffect(() => {
    if (!enabled || !token || !preview) return;
    INVITE_KEYS.forEach((key) => sessionStorage.removeItem(key));
    sessionStorage.setItem('pendingInviteName', preview.name);
    // The group key makes the login page say "group"; both lead back here
    sessionStorage.setItem(preview.parent ? 'pendingGroupInviteToken' : 'pendingInviteToken', token);
    router.push('/');
  }, [enabled, token, preview, router]);
}

function InvalidInvite({ message }: { message: string }) {
  const t = useTranslations('errors');
  const router = useRouter();
  return (
    <div className="container max-w-md py-16">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t('invalidInviteLinkTitle')}</h2>
          <p className="text-muted-foreground text-center mb-6">{message}</p>
          <Button onClick={() => router.push('/')}>{t('backToHome')}</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function JoinPageContent() {
  const t = useTranslations();
  const token = useSearchParams().get('token');
  const { user, loading: authLoading } = useAuth();
  const preview = useQuery({ ...communityQueries.preview(token ?? ''), enabled: !!token });
  useParkInviteForLogin(token, preview.data, !authLoading && !user);

  if (!token) return <InvalidInvite message={t('errors.noInviteToken')} />;
  if (preview.isError) return <InvalidInvite message={t('errors.invalidInviteLinkDescription')} />;
  if (authLoading || !user || !preview.data) {
    return (
      <div className="container max-w-md py-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return <JoinCard token={token} preview={preview.data} />;
}

function JoinCard({ token, preview }: { token: string; preview: CommunityPreview }) {
  const t = useTranslations();
  const tk = useTranslations(preview.parent ? 'groups' : 'communities');
  const router = useRouter();
  const { toast } = useToast();
  const showError = useErrorToast();
  const join = useJoinCommunity();

  const handleJoin = () =>
    join.mutate(token, {
      onSuccess: () => {
        toast({ variant: 'success', title: tk('joined') });
        router.push(`/communities/${preview.id}`);
      },
      onError: (error) => {
        if (getApiStatus(error) !== 409) {
          showError(error, preview.parent ? 'errors.failedToJoinGroup' : 'errors.failedToJoinCommunity');
          return;
        }
        toast({ variant: 'success', title: tk('alreadyMemberSuccess', { name: preview.name }) });
        router.push(`/communities/${preview.id}`);
      },
    });

  return (
    <div className="container max-w-md py-16">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{tk('join')}</CardTitle>
          <CardDescription>{t(preview.parent ? 'invite.groupInvite' : 'invite.communityInvite')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg border bg-muted/50 space-y-2">
            <h3 className="font-semibold text-lg">{preview.name}</h3>
            {preview.description && <p className="text-sm text-muted-foreground">{preview.description}</p>}
            {preview.parent && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Building2 className="h-4 w-4 mr-2" />
                {t('groups.community')}: {preview.parent.name}
              </div>
            )}
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-2" />
              {tk('memberCount', { count: preview._count.members })}
            </div>
          </div>

          {preview.parent && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
              <p className="text-blue-900 dark:text-blue-100">
                {t.rich('invite.groupJoinNote', {
                  communityName: preview.parent.name,
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Button onClick={handleJoin} disabled={join.isPending} className="w-full" size="lg">
              {join.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tk('join')}
            </Button>
            <Button variant="outline" onClick={() => router.push('/communities')} className="w-full">
              {t('common.cancel')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<LoadingSpinner className="container max-w-md" />}>
      <JoinPageContent />
    </Suspense>
  );
}
