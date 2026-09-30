'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { communityQueries } from '@/lib/api/communities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Users, MoreVertical, LinkIcon } from 'lucide-react';
import { CommunityFormDialog } from '@/components/communities/community-form-dialog';
import { JoinDialog } from '@/components/communities/join-dialog';
import { CommunityCard } from '@/components/communities/community-card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function CommunitiesPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const communitiesQuery = useQuery({ ...communityQueries.list(), enabled: !!user });
  // The flat membership list also holds groups; they appear on their community's page
  const communities = (communitiesQuery.data ?? []).filter((c) => !c.parentId);
  const loading = communitiesQuery.isPending;
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  const handleJoinSuccess = async (communityId: string) => {
    // Set highlight state first (optimistic)
    setHighlightId(communityId);

    try {
      // Fetch updated communities list
      const { data: updatedCommunities = [] } = await communitiesQuery.refetch({ throwOnError: true });

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

      <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8 transition-all duration-200">
        <div className="flex-shrink-0">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {t('communities.title')} ({communities.length})
          </h1>
        </div>

        {/* Desktop: Direct buttons */}
        <div className="hidden md:flex gap-2">
          <JoinDialog kind="communities" onJoined={handleJoinSuccess} />
          <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('communities.create')}
          </Button>
        </div>

        {/* Mobile: Dropdown menu */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-5 w-5" />
                <span className="sr-only">{t('common.actions')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setJoinDialogOpen(true)}
                className="cursor-pointer py-3"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                {t('communities.joinViaLink')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setCreateDialogOpen(true)}
                className="cursor-pointer py-3"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('communities.create')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Controlled dialog for mobile (without trigger) */}
          <JoinDialog kind="communities" open={joinDialogOpen} onOpenChange={setJoinDialogOpen} onJoined={handleJoinSuccess} />
        </div>
      </div>

      <CommunityFormDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

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
