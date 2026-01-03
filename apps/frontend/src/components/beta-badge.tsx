'use client';

import { useTranslations } from 'next-intl';

export function BetaBadge() {
  const t = useTranslations();

  return (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
      {t('common.beta')}
    </span>
  );
}
