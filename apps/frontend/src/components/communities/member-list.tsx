'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { Community, CommunityMember } from '@localshare/shared';
import { communityQueries, useCommunityActions } from '@/lib/api/communities';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useErrorToast } from '@/hooks/use-error-toast';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const INITIAL_MEMBERS_SHOWN = 10;

export function MemberList({ community }: { community: Community }) {
  const t = useTranslations();
  const tk = useTranslations(community.parentId ? 'groups' : 'communities');
  const locale = useLocale();
  const { toast } = useToast();
  const showError = useErrorToast();
  const members = useQuery(communityQueries.members(community.id)).data ?? [];
  const { removeMember } = useCommunityActions(community.id);
  const [open, setOpen] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [toRemove, setToRemove] = useState<CommunityMember | null>(null);
  const shown = showAll ? members : members.slice(0, INITIAL_MEMBERS_SHOWN);

  const handleRemove = () =>
    toRemove &&
    removeMember.mutate(toRemove.id, {
      onSuccess: () => toast({ variant: 'success', title: tk('memberRemoved') }),
      onError: (error) => showError(error, 'errors.unexpectedError'),
      onSettled: () => setToRemove(null),
    });

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2">
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {tk('members')} ({members.length})
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 py-4">
          {shown.map((member) => (
            <MemberRow key={member.id} member={member} joined={formatDate(member.joinedAt, locale)}
              ownerLabel={tk('owner')} removeLabel={tk('removeMember')}
              onRemove={community.viewer.canManageMembers && member.role !== 'owner' ? () => setToRemove(member) : undefined} />
          ))}
        </div>
        {members.length > INITIAL_MEMBERS_SHOWN && (
          <Button variant="ghost" size="sm" onClick={() => setShowAll(!showAll)} className="w-full">
            {showAll ? t('common.showLess') : t('common.showAll', { count: members.length })}
          </Button>
        )}
      </CollapsibleContent>

      <ConfirmDialog
        open={!!toRemove}
        onOpenChange={(next) => !next && setToRemove(null)}
        title={tk('removeMemberConfirm')}
        description={tk('removeMemberWarning', { name: `${toRemove?.firstName} ${toRemove?.lastName}` })}
        confirmLabel={tk('removeMember')}
        onConfirm={handleRemove}
        pending={removeMember.isPending}
      />
    </Collapsible>
  );
}

function MemberRow({ member, joined, ownerLabel, removeLabel, onRemove }: {
  member: CommunityMember;
  joined: string;
  ownerLabel: string;
  removeLabel: string;
  onRemove?: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border group">
      <div>
        <p className="font-medium">
          {member.firstName} {member.lastName}
          {member.role === 'owner' && (
            <span className="ml-2 text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">{ownerLabel}</span>
          )}
        </p>
        <p className="text-sm text-muted-foreground">{member.email}</p>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground">{joined}</p>
        {onRemove && (
          <Button variant="ghost" size="icon" onClick={onRemove}
            className="h-8 w-8 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
            aria-label={`${removeLabel} ${member.firstName} ${member.lastName}`}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
