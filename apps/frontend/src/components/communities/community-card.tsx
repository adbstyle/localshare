'use client';

import { Community } from '@localshare/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface CommunityCardProps {
  community: Community;
  isHighlighted: boolean;
  onClick: () => void;
}

export function CommunityCard({ community, isHighlighted, onClick }: CommunityCardProps) {
  const t = useTranslations();

  return (
    <Card
      id={`community-${community.id}`}
      tabIndex={0}
      className={cn(
        'hover:shadow-lg transition-all cursor-pointer',
        isHighlighted && 'animate-highlight'
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
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
  );
}
