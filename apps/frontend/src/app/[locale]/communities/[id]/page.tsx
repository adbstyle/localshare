'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { communityQueries } from '@/lib/api/communities';
import { useRouter } from '@/navigation';
import { useToast } from '@/hooks/use-toast';
import { CommunityHeader } from '@/components/communities/community-header';
import { CommunityActions } from '@/components/communities/community-actions';
import { SubgroupList } from '@/components/communities/subgroup-list';
import { MemberList } from '@/components/communities/member-list';

/** Detail page of a community or of a group (a community with a parent). */
export default function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations();
  const { toast } = useToast();
  const { data: community, isError } = useQuery(communityQueries.detail(id));

  useEffect(() => {
    if (!isError) return;
    toast({ title: t('errors.notFound'), variant: 'destructive' });
    router.push('/communities');
  }, [isError, router, t, toast]);

  if (!community) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <CommunityHeader community={community} />
      <CommunityActions community={community} />
      {!community.parentId && <SubgroupList communityId={community.id} />}
      <MemberList community={community} />
    </div>
  );
}
