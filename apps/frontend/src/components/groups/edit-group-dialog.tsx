'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Group, UpdateGroupDto } from '@localshare/shared';
import { updateGroupSchema } from '@localshare/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface EditGroupDialogProps {
  group: Group;
  onSuccess: () => void;
}

export function EditGroupDialog({ group, onSuccess }: EditGroupDialogProps) {
  const t = useTranslations();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateGroupDto>({
    resolver: zodResolver(updateGroupSchema),
    defaultValues: {
      name: group.name,
      description: group.description || '',
    },
  });

  const onSubmit = async (data: UpdateGroupDto) => {
    setLoading(true);
    try {
      await api.patch(`/groups/${group.id}`, data);
      toast({
        variant: 'success',
        title: t('groups.updated'),
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: t('errors.generic'),
        description: error.response?.data?.message || 'Failed to update group',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">
          {t('groups.name')} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder={t('groups.namePlaceholder')}
          {...register('name')}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t('groups.description')}</Label>
        <Textarea
          id="description"
          placeholder={t('groups.descriptionPlaceholder')}
          rows={3}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}
