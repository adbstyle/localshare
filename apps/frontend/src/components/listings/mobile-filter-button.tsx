'use client';

import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';

interface MobileFilterButtonProps {
  activeFilterCount: number;
  onClick: () => void;
}

export function MobileFilterButton({ activeFilterCount, onClick }: MobileFilterButtonProps) {
  const t = useTranslations();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      className="relative"
      aria-label={t('listings.openFilters')}
    >
      <Filter className="h-5 w-5" />
      {activeFilterCount > 0 && (
        <Badge
          variant="default"
          className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
        >
          {activeFilterCount}
        </Badge>
      )}
    </Button>
  );
}
