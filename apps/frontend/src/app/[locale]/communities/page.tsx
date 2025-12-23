'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
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

export default function CommunitiesPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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
    } catch (error) {
      console.error('Failed to fetch communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommunityCreated = () => {
    setCreateDialogOpen(false);
    fetchCommunities();
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t('communities.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {communities.length === 0
              ? t('communities.empty')
              : `${communities.length} ${t('communities.memberCount', { count: communities.length })}`}
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
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
            <Card
              key={community.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/communities/${community.id}`)}
            >
              <CardHeader>
                <CardTitle className="line-clamp-1">{community.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {community.description || t('communities.descriptionPlaceholder')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    {t('communities.memberCount', { count: community._count.members })}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <FileText className="h-4 w-4 mr-2" />
                    {t('communities.listingCount', { count: community._count.sharedListings })}
                  </div>
                  <div className="text-xs text-muted-foreground mt-4">
                    {t('communities.owner')}: {community.owner.firstName} {community.owner.lastName}
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
