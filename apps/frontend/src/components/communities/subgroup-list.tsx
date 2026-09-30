'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { communityQueries } from '@/lib/api/communities';
import { useRouter } from '@/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

/** The user's groups inside a community (from the flat membership list). */
export function SubgroupList({ communityId }: { communityId: string }) {
  const t = useTranslations('groups');
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const groups = (useQuery(communityQueries.list()).data ?? []).filter((c) => c.parentId === communityId);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-6">
      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2">
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('myGroups')} ({groups.length})
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">{t('empty')}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 py-4">
            {groups.map((group) => {
              const memberCount = t('memberCount', { count: group._count?.members || 0 });
              const openGroup = () => router.push(`/communities/${group.id}`);
              return (
                <Card
                  key={group.id}
                  className="cursor-pointer hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  onClick={openGroup}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter' && e.key !== ' ') return;
                    e.preventDefault();
                    openGroup();
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${group.name} - ${memberCount}`}
                >
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-1">{group.name}</h3>
                    <p className="text-sm text-muted-foreground">{memberCount}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
