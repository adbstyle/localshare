'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('pages.error');

  useEffect(() => {
    console.error('Error boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <AlertCircle className="h-24 w-24 mx-auto text-destructive mb-6" />
        <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
        <p className="text-muted-foreground mb-8">
          {t('description')}
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => reset()}>
            {t('retry')}
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            {t('backHome')}
          </Button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-muted rounded-lg text-left">
            <p className="text-sm font-mono text-destructive">
              {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
