'use client';

import { useTranslations } from 'next-intl';
import { FileText, Users } from 'lucide-react';
import { Community } from '@localshare/shared';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

/** Breadcrumb (communities > parent > name), title, description and counts. */
export function CommunityHeader({ community }: { community: Community }) {
  const t = useTranslations();
  const tk = useTranslations(community.parentId ? 'groups' : 'communities');

  return (
    <>
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/communities">{t('nav.communities')}</BreadcrumbLink>
          </BreadcrumbItem>
          {community.parent && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/communities/${community.parent.id}`}>{community.parent.name}</BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{community.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{community.name}</h1>
        {community.description && <p className="text-muted-foreground">{community.description}</p>}
        <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            {tk('memberCount', { count: community._count.members })}
          </div>
          <div className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            {tk('listingCount', { count: community._count.sharedListings })}
          </div>
        </div>
      </div>
    </>
  );
}
