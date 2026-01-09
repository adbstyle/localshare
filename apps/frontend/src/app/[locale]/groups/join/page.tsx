'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Loader2, AlertCircle, Building2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface GroupPreview {
  id: string;
  name: string;
  description: string | null;
  community: {
    id: string;
    name: string;
  };
  _count: {
    members: number;
  };
}

function JoinGroupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [group, setGroup] = useState<GroupPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Store the invite token before redirecting to login
        if (token) {
          // Clear ALL invite tokens first (SAIT pattern - Single Active Invite Token)
          sessionStorage.removeItem('pendingInviteToken');
          sessionStorage.removeItem('pendingGroupInviteToken');
          // Set the new group invite token
          sessionStorage.setItem('pendingGroupInviteToken', token);
        }
        router.push('/');
      } else if (token) {
        fetchGroupPreview();
      } else {
        setError(t('errors.noInviteToken'));
        setLoading(false);
      }
    }
  }, [user, authLoading, token, router]);

  const fetchGroupPreview = async () => {
    try {
      const { data } = await api.get<GroupPreview>(`/groups/preview/${token}`);
      setGroup(data);
    } catch (error: any) {
      setError(error.response?.data?.message || t('errors.invalidInviteLink'));
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!token) return;

    setJoining(true);
    try {
      await api.post(`/groups/join?token=${token}`);
      toast({
        variant: 'success',
        title: t('groups.joined'),
      });
      router.push(`/groups/${group!.id}`);
    } catch (error: any) {
      toast({
        title: t('errors.generic'),
        description: error.response?.data?.message || t('errors.failedToJoinGroup'),
        variant: 'destructive',
      });
    } finally {
      setJoining(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container max-w-md py-16">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="container max-w-md py-16">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t('errors.notFound')}</h2>
            <p className="text-muted-foreground text-center mb-6">
              {error || t('errors.invalidInviteLink')}
            </p>
            <Button onClick={() => router.push('/listings')}>
              {t('nav.listings')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-md py-16">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t('groups.join')}</CardTitle>
          <CardDescription>
            {t('invite.groupInvite')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg border bg-muted/50">
            <h3 className="font-semibold text-lg mb-2">{group.name}</h3>
            {group.description && (
              <p className="text-sm text-muted-foreground mb-3">
                {group.description}
              </p>
            )}
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Building2 className="h-4 w-4 mr-2" />
                {t('groups.community')}: {group.community.name}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-2" />
                {t('groups.memberCount', { count: group._count.members })}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
            <p className="text-blue-900 dark:text-blue-100">
              {t.rich('invite.groupJoinNote', {
                communityName: group.community.name,
                strong: (chunks) => <strong>{chunks}</strong>
              })}
            </p>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleJoin}
              disabled={joining}
              className="w-full"
              size="lg"
            >
              {joining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('groups.join')}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/communities/${group.community.id}`)}
              className="w-full"
            >
              {t('common.cancel')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function JoinGroupPage() {
  return (
    <Suspense fallback={<LoadingSpinner className="container max-w-md" />}>
      <JoinGroupPageContent />
    </Suspense>
  );
}
