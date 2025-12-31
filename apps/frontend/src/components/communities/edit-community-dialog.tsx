'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Community, UpdateCommunityDto } from '@localshare/shared';
import { updateCommunitySchema } from '@localshare/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface EditCommunityDialogProps {
  community: Community;
  onSuccess: () => void;
}

export function EditCommunityDialog({ community, onSuccess }: EditCommunityDialogProps) {
  const t = useTranslations();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateCommunityDto>({
    resolver: zodResolver(updateCommunitySchema),
    defaultValues: {
      name: community.name,
      description: community.description || '',
    },
  });

  const onSubmit = async (data: UpdateCommunityDto) => {
    setLoading(true);
    try {
      await api.patch(`/communities/${community.id}`, data);
      toast({
        variant: 'success',
        title: t('communities.updated'),
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: t('errors.generic'),
        description: error.response?.data?.message || 'Failed to update community',
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
          {t('communities.name')} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder={t('communities.namePlaceholder')}
          {...register('name')}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t('communities.description')}</Label>
        <Textarea
          id="description"
          placeholder={t('communities.descriptionPlaceholder')}
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
