'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { CreateCommunityDto } from '@localshare/shared';
import { createCommunitySchema } from '@localshare/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface CreateCommunityDialogProps {
  onSuccess: () => void;
}

export function CreateCommunityDialog({ onSuccess }: CreateCommunityDialogProps) {
  const t = useTranslations();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCommunityDto>({
    resolver: zodResolver(createCommunitySchema),
  });

  const onSubmit = async (data: CreateCommunityDto) => {
    setLoading(true);
    try {
      await api.post('/communities', data);
      toast({
        title: t('communities.created'),
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: t('errors.generic'),
        description: error.response?.data?.message || 'Failed to create community',
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
          {t('common.create')}
        </Button>
      </div>
    </form>
  );
}
