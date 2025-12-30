'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Loader2, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface CommunityPreview {
  id: string;
  name: string;
  description: string | null;
  _count: {
    members: number;
  };
}

function JoinCommunityPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [community, setCommunity] = useState<CommunityPreview | null>(null);
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
          // Set the new community invite token
          sessionStorage.setItem('pendingInviteToken', token);
        }
        router.push('/');
      } else if (token) {
        fetchCommunityPreview();
      } else {
        setError('No invite token provided');
        setLoading(false);
      }
    }
  }, [user, authLoading, token, router]);

  const fetchCommunityPreview = async () => {
    try {
      const { data } = await api.get<CommunityPreview>(`/communities/preview/${token}`);
      setCommunity(data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Invalid or expired invite link');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!token) return;

    setJoining(true);
    try {
      await api.post(`/communities/join/${token}`);
      toast({
        title: t('communities.joined'),
      });
      router.push('/communities');
    } catch (error: any) {
      toast({
        title: t('errors.generic'),
        description: error.response?.data?.message || 'Failed to join community',
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

  if (error || !community) {
    return (
      <div className="container max-w-md py-16">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t('errors.notFound')}</h2>
            <p className="text-muted-foreground text-center mb-6">
              {error || 'This invite link is invalid or has expired'}
            </p>
            <Button onClick={() => router.push('/communities')}>
              {t('communities.title')}
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
          <CardTitle className="text-2xl">{t('communities.join')}</CardTitle>
          <CardDescription>
            You've been invited to join a community
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg border bg-muted/50">
            <h3 className="font-semibold text-lg mb-2">{community.name}</h3>
            {community.description && (
              <p className="text-sm text-muted-foreground mb-3">
                {community.description}
              </p>
            )}
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-2" />
              {t('communities.memberCount', { count: community._count.members })}
            </div>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleJoin}
              disabled={joining}
              className="w-full"
              size="lg"
            >
              {joining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('communities.join')}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/communities')}
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

export default function JoinCommunityPage() {
  return (
    <Suspense fallback={<LoadingSpinner className="container max-w-md" />}>
      <JoinCommunityPageContent />
    </Suspense>
  );
}
