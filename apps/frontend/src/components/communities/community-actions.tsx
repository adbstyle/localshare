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

interface Props {
  community: Community;
}

/** Toast feedback for a community mutation; `after` runs on success. */
function useMutationFeedback(community: Community) {
  const tk = useTranslations(community.parentId ? 'groups' : 'communities');
  const { toast } = useToast();
  const showError = useErrorToast();

  return (successKey: string, after?: () => void) => ({
    onSuccess: () => {
      toast({ variant: 'success', title: tk(successKey) });
      after?.();
    },
    onError: (error: unknown) => showError(error, 'errors.unexpectedError'),
  });
}

/** Action bar of a community or group; each action is shown only if `viewer` allows it. */
export function CommunityActions({ community }: Props) {
  const t = useTranslations();
  const tk = useTranslations(community.parentId ? 'groups' : 'communities');
  const locale = useLocale();
  const { toast } = useToast();
  const [dialog, setDialog] = useState<OpenDialog>(null);

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/${locale}/communities/join?token=${community.inviteToken}`);
    toast({ variant: 'success', title: tk('linkCopied') });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-8 pb-6 border-b">
      <Button variant="outline" onClick={copyInviteLink}>
        <Link2 className="h-4 w-4 mr-2" />
        {tk('invite')}
      </Button>
      {community.viewer.canEdit && (
        <Button variant="outline" onClick={() => setDialog('edit')}>
          <Edit className="h-4 w-4 mr-2" />
          {t('common.edit')}
        </Button>
      )}
      {!community.parentId && (
        <Button variant="outline" onClick={() => setDialog('createGroup')}>
          <Plus className="h-4 w-4 mr-2" />
          {t('groups.create')}
        </Button>
      )}
      <CommunityMenu community={community} onOpen={setDialog} />
      <CommunityDialogs community={community} dialog={dialog} setDialog={setDialog} />
    </div>
  );
}

function CommunityMenu({ community, onOpen }: Props & { onOpen: (dialog: OpenDialog) => void }) {
  const t = useTranslations();
  const tk = useTranslations(community.parentId ? 'groups' : 'communities');
  const { refreshInvite } = useCommunityActions(community.id);
  const feedback = useMutationFeedback(community);
  const { viewer } = community;
  const destructive = 'text-destructive focus:text-destructive';

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">{t('common.actions')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {!community.parentId && (
          <DropdownMenuItem onClick={() => onOpen('joinGroup')}>
            <Link2 className="h-4 w-4 mr-2" />
            {t('groups.joinViaLink')}
          </DropdownMenuItem>
        )}
        {viewer.canEdit && (
          <DropdownMenuItem onClick={() => refreshInvite.mutate(undefined, feedback('linkRefreshed'))}
            disabled={refreshInvite.isPending}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {tk('refreshInviteLink')}
          </DropdownMenuItem>
        )}
        {viewer.canLeave && (
          <DropdownMenuItem onClick={() => onOpen('leave')} className={destructive}>
            <LogOut className="h-4 w-4 mr-2" />
            {tk('leave')}
          </DropdownMenuItem>
        )}
        {viewer.canDelete && (
          <DropdownMenuItem onClick={() => onOpen('delete')} className={destructive}>
            <Trash2 className="h-4 w-4 mr-2" />
            {t('common.delete')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CommunityDialogs({ community, dialog, setDialog }: Props & {
  dialog: OpenDialog;
  setDialog: (dialog: OpenDialog) => void;
}) {
  const tk = useTranslations(community.parentId ? 'groups' : 'communities');
  const router = useRouter();
  const { leave, remove } = useCommunityActions(community.id);
  const feedback = useMutationFeedback(community);
  const toggle = (name: Exclude<OpenDialog, null>) => (open: boolean) => setDialog(open ? name : null);
  // After leaving or deleting, go up one level
  const goUp = () => router.push(community.parent ? `/communities/${community.parent.id}` : '/communities');
  const settle = { onSettled: () => setDialog(null) };

  return (
    <>
      <CommunityFormDialog open={dialog === 'edit'} onOpenChange={toggle('edit')} community={community} />
      <CommunityFormDialog open={dialog === 'createGroup'} onOpenChange={toggle('createGroup')} parentId={community.id} />
      <JoinDialog kind="groups" open={dialog === 'joinGroup'} onOpenChange={toggle('joinGroup')} />
      <ConfirmDialog
        open={dialog === 'leave'}
        onOpenChange={toggle('leave')}
        title={tk('leaveConfirm')}
        description={tk('leaveWarning')}
        confirmLabel={tk('leave')}
        onConfirm={() => leave.mutate(undefined, { ...feedback('left', goUp), ...settle })}
        pending={leave.isPending}
      />
      <DeleteDialog community={community} open={dialog === 'delete'} onOpenChange={toggle('delete')}
        pending={remove.isPending} onConfirm={() => remove.mutate(undefined, { ...feedback('deleted', goUp), ...settle })} />
    </>
  );
}

/** Deleting requires typing the name. */
function DeleteDialog({ community, open, onOpenChange, pending, onConfirm }: Props & {
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
