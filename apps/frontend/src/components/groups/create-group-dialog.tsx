'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { CreateGroupDto } from '@localshare/shared';
import { createGroupSchema } from '@localshare/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useErrorToast } from '@/hooks/use-error-toast';
import { api } from '@/lib/api/client';
import { Loader2 } from 'lucide-react';

interface CreateGroupDialogProps {
  onSuccess: () => void;
  communityId: string;
}

export function CreateGroupDialog({ onSuccess, communityId }: CreateGroupDialogProps) {
  const t = useTranslations();
  const { toast } = useToast();
  const showError = useErrorToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateGroupDto>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { communityId },
  });

  const onSubmit = async (data: CreateGroupDto) => {
    setLoading(true);
    try {
      await api.post('/groups', data);
      toast({
        variant: 'success',
        title: t('groups.created'),
      });
      onSuccess();
    } catch (error: any) {
      showError(error, 'errors.failedToCreateGroup');
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
          {t('common.create')}
        </Button>
      </div>
    </form>
  );
}
