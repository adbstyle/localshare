'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Community } from '@localshare/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, FileText, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CreateCommunityDialog } from '@/components/communities/create-community-dialog';
import { JoinCommunityDialog } from '@/components/communities/join-community-dialog';
import { CommunityCard } from '@/components/communities/community-card';

export default function CommunitiesPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/');
      } else {
        fetchCommunities();
      }
    }
  }, [user, authLoading, router]);

  const fetchCommunities = async () => {
    try {
      const { data } = await api.get<Community[]>('/communities');
      setCommunities(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch communities:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCommunityCreated = () => {
    setCreateDialogOpen(false);
    fetchCommunities();
  };

  const handleJoinSuccess = async (communityId: string) => {
    // Set highlight state first (optimistic)
    setHighlightId(communityId);

    try {
      // Fetch updated communities list
      const updatedCommunities = await fetchCommunities();

      // Scroll to new community after a brief delay (allow render)
      setTimeout(() => {
        const element = document.getElementById(`community-${communityId}`);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
          element.focus();
        }
      }, 100);

      // Screen reader announcement using fresh data
      const newCommunity = updatedCommunities.find(c => c.id === communityId);
      if (newCommunity) {
        setLiveMessage(t('communities.joinedAnnouncement', { name: newCommunity.name }));
      }

      // Clear highlight after animation completes
      setTimeout(() => {
        setHighlightId(null);
        setLiveMessage('');
      }, 2000);
    } catch (error) {
      // Handle fetch error
      toast({
        title: t('errors.generic'),
        description: t('communities.refreshFailed'),
        variant: 'destructive',
      });
      // Clear highlight on error
      setHighlightId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      {/* ARIA Live Region for Screen Readers */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {liveMessage}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8 transition-all duration-200">
        <div className="flex-shrink-0">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {t('communities.title')} ({communities.length})
          </h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            {communities.length === 0
              ? t('communities.empty')
              : t('communities.count', { count: communities.length })}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <JoinCommunityDialog
            onJoinSuccess={handleJoinSuccess}
            className="w-full sm:w-auto"
            variant="outline"
          />
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                {t('communities.create')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('communities.create')}</DialogTitle>
                <DialogDescription>
                  {t('communities.descriptionPlaceholder')}
                </DialogDescription>
              </DialogHeader>
              <CreateCommunityDialog onSuccess={handleCommunityCreated} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {communities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t('communities.empty')}</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              {t('communities.emptyAction')}
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('communities.create')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {communities.map((community) => (
            <CommunityCard
              key={community.id}
              community={community}
              isHighlighted={highlightId === community.id}
              onClick={() => router.push(`/communities/${community.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
