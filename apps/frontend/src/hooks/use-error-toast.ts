'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { getErrorKey } from '@/lib/api/errors';

/** Shows a translated error toast for a failed request. */
export function useErrorToast() {
  const t = useTranslations();
  const { toast } = useToast();

  return useCallback(
    (error: unknown, fallbackKey: string) => {
      toast({
        title: t('errors.generic'),
        description: t(getErrorKey(error, fallbackKey)),
        variant: 'destructive',
      });
    },
    [t, toast],
  );
}
