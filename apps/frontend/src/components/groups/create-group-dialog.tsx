'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { CreateGroupDto, Community } from '@localshare/shared';
import { createGroupSchema } from '@localshare/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface CreateGroupDialogProps {
  onSuccess: () => void;
}

export function CreateGroupDialog({ onSuccess }: CreateGroupDialogProps) {
  const t = useTranslations();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateGroupDto>({
    resolver: zodResolver(createGroupSchema),
  });

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      const { data } = await api.get<Community[]>('/communities');
      setCommunities(data);
    } catch (error) {
      console.error('Failed to fetch communities:', error);
    } finally {
      setLoadingCommunities(false);
    }
  };

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
      toast({
        title: t('errors.generic'),
        description: error.response?.data?.message || 'Failed to create group',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingCommunities) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (communities.length === 0) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        <p className="mb-2">{t('communities.empty')}</p>
        <p className="text-sm">{t('communities.emptyAction')}</p>
      </div>
    );
  }

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

      <div className="space-y-2">
        <Label htmlFor="communityId">
          {t('groups.community')} <span className="text-destructive">*</span>
        </Label>
        <Controller
          name="communityId"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('groups.selectCommunity')} />
              </SelectTrigger>
              <SelectContent>
                {communities.map((community) => (
                  <SelectItem key={community.id} value={community.id}>
                    {community.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.communityId && (
          <p className="text-sm text-destructive">{errors.communityId.message}</p>
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
