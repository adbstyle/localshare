'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Community, CreateCommunityDto, createCommunitySchema, updateCommunitySchema } from '@localshare/shared';
import { useCreateCommunity, useUpdateCommunity } from '@/lib/api/communities';
import { useToast } from '@/hooks/use-toast';
import { useErrorToast } from '@/hooks/use-error-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CommunityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit this community/group; otherwise create one. */
  community?: Community;
  /** Create a group inside this community. */
  parentId?: string;
}

/** Create or edit a community or group; wording follows the kind. */
export function CommunityFormDialog({ open, onOpenChange, community, parentId }: CommunityFormDialogProps) {
  const t = useTranslations();
  const isGroup = community ? !!community.parentId : !!parentId;
  const tk = useTranslations(isGroup ? 'groups' : 'communities');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t('common.close')}>
        <DialogHeader>
          <DialogTitle>{community ? tk('edit') : tk('create')}</DialogTitle>
          <DialogDescription>{community ? tk('editDescription') : tk('createDescription')}</DialogDescription>
        </DialogHeader>
        {open && (
          <CommunityForm community={community} parentId={parentId} isGroup={isGroup} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CommunityForm({ community, parentId, isGroup, onDone }: {
  community?: Community;
  parentId?: string;
  isGroup: boolean;
  onDone: () => void;
}) {
  const t = useTranslations();
  const tk = useTranslations(isGroup ? 'groups' : 'communities');
  const { toast } = useToast();
  const showError = useErrorToast();
  const create = useCreateCommunity();
  const update = useUpdateCommunity(community?.id ?? '');
  const pending = create.isPending || update.isPending;

  const { register, handleSubmit, formState: { errors } } = useForm<CreateCommunityDto>({
    resolver: zodResolver(community ? updateCommunitySchema : createCommunitySchema),
    defaultValues: community
      ? { name: community.name, description: community.description || '' }
      : { parentId },
  });

  const onSubmit = async (data: CreateCommunityDto) => {
    try {
      if (community) await update.mutateAsync({ name: data.name, description: data.description });
      else await create.mutateAsync({ ...data, parentId });
      toast({ variant: 'success', title: tk(community ? 'updated' : 'created') });
      onDone();
    } catch (error) {
      const kind = isGroup ? 'Group' : 'Community';
      showError(error, community ? `errors.failedToUpdate${kind}` : `errors.failedToCreate${kind}`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">
          {tk('name')} <span className="text-destructive">*</span>
        </Label>
        <Input id="name" placeholder={tk('namePlaceholder')} {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">{tk('description')}</Label>
        <Textarea id="description" placeholder={tk('descriptionPlaceholder')} rows={3} {...register('description')} />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {community ? t('common.save') : t('common.create')}
        </Button>
      </div>
    </form>
  );
}
