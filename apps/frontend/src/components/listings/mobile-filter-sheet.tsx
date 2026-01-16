'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { FilterListingsDto, ListingType, ListingCategory } from '@localshare/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';

interface MobileFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFilters: FilterListingsDto;
  onApply: (filters: Partial<FilterListingsDto>) => void;
}

export function MobileFilterSheet({
  open,
  onOpenChange,
  currentFilters,
  onApply,
}: MobileFilterSheetProps) {
  const t = useTranslations();
  const { user } = useAuth();

  const types = Object.values(ListingType);
  const categories = Object.values(ListingCategory);

  // Temporary filter state (local, not applied until "Suchen" click)
  const [tempFilters, setTempFilters] = useState<Partial<FilterListingsDto>>({});

  // Sync temp filters when sheet opens
  useEffect(() => {
    if (open) {
      setTempFilters({
        search: currentFilters.search,
        types: currentFilters.types,
        categories: currentFilters.categories,
        myListings: currentFilters.myListings,
      });
    }
  }, [open, currentFilters]);

  const handleTypeToggle = (type: ListingType) => {
    const currentTypes = tempFilters.types || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];
    setTempFilters((prev) => ({
      ...prev,
      types: newTypes.length > 0 ? newTypes : undefined,
    }));
  };

  const handleCategoryToggle = (category: ListingCategory) => {
    const currentCategories = tempFilters.categories || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter((c) => c !== category)
      : [...currentCategories, category];
    setTempFilters((prev) => ({
      ...prev,
      categories: newCategories.length > 0 ? newCategories : undefined,
    }));
  };

  const handleReset = () => {
    setTempFilters({
      search: undefined,
      types: undefined,
      categories: undefined,
      myListings: undefined,
    });
  };

  const handleApply = () => {
    onApply(tempFilters);
    onOpenChange(false);
  };

  const hasActiveFilters =
    tempFilters.types?.length ||
    tempFilters.categories?.length ||
    tempFilters.search ||
    tempFilters.myListings;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="fixed inset-x-0 bottom-0 top-0 h-[100dvh] max-h-[100dvh] w-full max-w-full translate-x-0 translate-y-0 rounded-t-2xl p-0 flex flex-col data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:rounded-t-2xl"
        onPointerDownOutside={() => onOpenChange(false)}
        onEscapeKeyDown={() => onOpenChange(false)}
      >
        {/* Sticky Header */}
        <DialogHeader className="sticky top-0 z-10 flex flex-row items-center justify-between border-b bg-background px-4 py-4">
          <div className="flex items-center gap-4">
            <DialogTitle className="text-lg font-semibold">
              {t('common.filter')}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t('listings.filterDescription')}
            </DialogDescription>
            {hasActiveFilters && (
              <Button variant="link" size="sm" onClick={handleReset} className="h-auto p-0 text-sm">
                {t('common.reset')}
              </Button>
            )}
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <X className="h-5 w-5" />
              <span className="sr-only">{t('common.close')}</span>
            </Button>
          </DialogClose>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-6">
            {/* Search */}
            <div>
              <Label>{t('common.search')}</Label>
              <Input
                placeholder={t('listings.searchPlaceholder')}
                value={tempFilters.search || ''}
                onChange={(e) =>
                  setTempFilters((prev) => ({
                    ...prev,
                    search: e.target.value || undefined,
                  }))
                }
              />
            </div>

            {/* My Listings */}
            {user && (
              <div className="flex items-center space-x-2 min-h-10">
                <Checkbox
                  id="mobile-myListings"
                  checked={tempFilters.myListings || false}
                  onCheckedChange={(checked) =>
                    setTempFilters((prev) => ({
                      ...prev,
                      myListings: checked ? true : undefined,
                    }))
                  }
                />
                <Label htmlFor="mobile-myListings" className="cursor-pointer">
                  {t('listings.myListings')}
                </Label>
              </div>
            )}

            {/* Type Filter */}
            <div>
              <Label className="mb-2 block">{t('listings.filterByType')}</Label>
              <div className="space-y-1">
                {types.map((type) => (
                  <div key={type} className="flex items-center space-x-2 min-h-10">
                    <Checkbox
                      id={`mobile-type-${type}`}
                      checked={tempFilters.types?.includes(type) || false}
                      onCheckedChange={() => handleTypeToggle(type)}
                    />
                    <Label htmlFor={`mobile-type-${type}`} className="cursor-pointer">
                      {t(`listings.types.${type}`)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <Label className="mb-2 block">{t('listings.filterByCategory')}</Label>
              <div className="space-y-1">
                {categories.map((category) => (
                  <div key={category} className="flex items-center space-x-2 min-h-10">
                    <Checkbox
                      id={`mobile-cat-${category}`}
                      checked={tempFilters.categories?.includes(category) || false}
                      onCheckedChange={() => handleCategoryToggle(category)}
                    />
                    <Label htmlFor={`mobile-cat-${category}`} className="cursor-pointer text-sm">
                      {t(`listings.categories.${category}`)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 border-t bg-background px-4 py-4 mt-auto">
          <Button onClick={handleApply} className="w-full" size="lg">
            {t('common.search')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
