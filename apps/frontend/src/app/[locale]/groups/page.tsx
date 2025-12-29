'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Group } from '@localshare/shared';
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
import { CreateGroupDialog } from '@/components/groups/create-group-dialog';
import { JoinGroupDialog } from '@/components/groups/join-group-dialog';

export default function GroupsPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/');
      } else {
        fetchGroups();
      }
    }
  }, [user, authLoading, router]);

  const fetchGroups = async () => {
    try {
      const { data } = await api.get<Group[]>('/groups');
      setGroups(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleGroupCreated = () => {
    setCreateDialogOpen(false);
    fetchGroups();
  };

  const handleJoinSuccess = async (groupId: string) => {
    // Set highlight state first (optimistic)
    setHighlightId(groupId);

    try {
      // Fetch updated groups list
      await fetchGroups();

      // Scroll to new group after a brief delay (allow render)
      setTimeout(() => {
        const element = document.getElementById(`group-${groupId}`);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
          element.focus();
        }
      }, 100);

      // Clear highlight after animation completes
      setTimeout(() => {
        setHighlightId(null);
      }, 2000);
    } catch (error) {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8 transition-all duration-200">
        <div className="flex-shrink-0">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {t('groups.title')} ({groups.length})
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <JoinGroupDialog
            onJoinSuccess={handleJoinSuccess}
            className="w-full sm:w-auto"
            variant="outline"
          />
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                {t('groups.create')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('groups.create')}</DialogTitle>
                <DialogDescription>
                  {t('groups.descriptionPlaceholder')}
                </DialogDescription>
              </DialogHeader>
              <CreateGroupDialog onSuccess={handleGroupCreated} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t('groups.empty')}</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              {t('groups.emptyAction')}
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('groups.create')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card
              key={group.id}
              id={`group-${group.id}`}
              className={`hover:shadow-lg transition-shadow cursor-pointer ${
                highlightId === group.id
                  ? 'ring-2 ring-primary ring-offset-2 animate-pulse'
                  : ''
              }`}
              onClick={() => router.push(`/groups/${group.id}`)}
              tabIndex={0}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="line-clamp-1">{group.name}</span>
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {group.description || t('groups.descriptionPlaceholder')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    {t('groups.memberCount', { count: group._count.members })}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <FileText className="h-4 w-4 mr-2" />
                    {t('groups.listingCount', { count: group._count.sharedListings })}
                  </div>
                  <div className="text-xs text-muted-foreground mt-4">
                    <div>
                      {t('groups.community')}: {group.community.name}
                    </div>
                    <div>
                      {t('groups.owner')}: {group.owner.firstName} {group.owner.lastName}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
