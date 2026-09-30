'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Edit, Link2, LogOut, MoreVertical, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Community } from '@localshare/shared';
import { useCommunityActions } from '@/lib/api/communities';
import { useRouter } from '@/navigation';
import { useToast } from '@/hooks/use-toast';
import { useErrorToast } from '@/hooks/use-error-toast';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CommunityFormDialog } from './community-form-dialog';
import { JoinDialog } from './join-dialog';

type OpenDialog = 'edit' | 'createGroup' | 'joinGroup' | 'leave' | 'delete' | null;

/** Action bar of a community or group; each action is shown only if `viewer` allows it. */
export function CommunityActions({ community }: { community: Community }) {
  const t = useTranslations();
  const tk = useTranslations(community.parentId ? 'groups' : 'communities');
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const showError = useErrorToast();
  const actions = useCommunityActions(community.id);
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const { viewer } = community;
  const isCommunity = !community.parentId;

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/${locale}/communities/join?token=${community.inviteToken}`);
    toast({ variant: 'success', title: tk('linkCopied') });
  };

  // After leaving or deleting, go up one level
  const goUp = () => router.push(community.parent ? `/communities/${community.parent.id}` : '/communities');
  const run = (mutation: { mutate: (v: void, o: object) => void }, successKey: string, after?: () => void) =>
    mutation.mutate(undefined, {
      onSuccess: () => {
        toast({ variant: 'success', title: tk(successKey) });
        after?.();
      },
      onError: (error: unknown) => showError(error, 'errors.unexpectedError'),
      onSettled: () => setDialog(null),
    });

  return (
    <div className="flex flex-wrap items-center gap-2 mb-8 pb-6 border-b">
      <Button variant="outline" onClick={copyInviteLink}>
        <Link2 className="h-4 w-4 mr-2" />
        {tk('invite')}
      </Button>
      {viewer.canEdit && (
        <Button variant="outline" onClick={() => setDialog('edit')}>
          <Edit className="h-4 w-4 mr-2" />
          {t('common.edit')}
        </Button>
      )}
      {isCommunity && (
        <Button variant="outline" onClick={() => setDialog('createGroup')}>
          <Plus className="h-4 w-4 mr-2" />
          {t('groups.create')}
        </Button>
      )}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">{t('common.actions')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isCommunity && (
            <DropdownMenuItem onClick={() => setDialog('joinGroup')}>
              <Link2 className="h-4 w-4 mr-2" />
              {t('groups.joinViaLink')}
            </DropdownMenuItem>
          )}
          {viewer.canEdit && (
            <DropdownMenuItem onClick={() => run(actions.refreshInvite, 'linkRefreshed')} disabled={actions.refreshInvite.isPending}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {tk('refreshInviteLink')}
            </DropdownMenuItem>
          )}
          {viewer.canLeave && (
            <DropdownMenuItem onClick={() => setDialog('leave')} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              {tk('leave')}
            </DropdownMenuItem>
          )}
          {viewer.canDelete && (
            <DropdownMenuItem onClick={() => setDialog('delete')} className="text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              {t('common.delete')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CommunityFormDialog open={dialog === 'edit'} onOpenChange={(o) => setDialog(o ? 'edit' : null)} community={community} />
      <CommunityFormDialog open={dialog === 'createGroup'} onOpenChange={(o) => setDialog(o ? 'createGroup' : null)} parentId={community.id} />
      <JoinDialog kind="groups" open={dialog === 'joinGroup'} onOpenChange={(o) => setDialog(o ? 'joinGroup' : null)} />
      <ConfirmDialog
        open={dialog === 'leave'}
        onOpenChange={(o) => setDialog(o ? 'leave' : null)}
        title={tk('leaveConfirm')}
        description={tk('leaveWarning')}
        confirmLabel={tk('leave')}
        onConfirm={() => run(actions.leave, 'left', goUp)}
        pending={actions.leave.isPending}
      />
      <DeleteDialog community={community} open={dialog === 'delete'} onOpenChange={(o) => setDialog(o ? 'delete' : null)}
        pending={actions.remove.isPending} onConfirm={() => run(actions.remove, 'deleted', goUp)} />
    </div>
  );
}

/** Deleting requires typing the name. */
function DeleteDialog({ community, open, onOpenChange, pending, onConfirm }: {
  community: Community;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  onConfirm: () => void;
}) {
  const t = useTranslations();
  const tk = useTranslations(community.parentId ? 'groups' : 'communities');
  const [typed, setTyped] = useState('');

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setTyped('');
        onOpenChange(next);
      }}
      title={tk('deleteConfirm')}
      description={tk('deleteWarning', { name: community.name })}
      confirmLabel={t('common.delete')}
      onConfirm={onConfirm}
      pending={pending}
      confirmDisabled={typed !== community.name}
    >
      <div className="py-4">
        <Label htmlFor="confirm-delete">{t('common.typeToConfirm', { name: community.name })}</Label>
        <Input id="confirm-delete" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={community.name} />
      </div>
    </ConfirmDialog>
  );
}
