'use client';

import { FilterListingsDto, ListingType, ListingCategory } from '@localshare/shared';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface ListingFiltersProps {
  filters: FilterListingsDto;
  onChange: (filters: Partial<FilterListingsDto>) => void;
}

export function ListingFilters({ filters, onChange }: ListingFiltersProps) {
  const t = useTranslations();
  const { user } = useAuth();

  const types = Object.values(ListingType);
  const categories = Object.values(ListingCategory);

  const handleTypeToggle = (type: ListingType) => {
    const currentTypes = filters.types || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];
    onChange({ types: newTypes.length > 0 ? newTypes : undefined });
  };

  const handleCategoryToggle = (category: ListingCategory) => {
    const currentCategories = filters.categories || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter((c) => c !== category)
      : [...currentCategories, category];
    onChange({ categories: newCategories.length > 0 ? newCategories : undefined });
  };

  const handleClearFilters = () => {
    onChange({
      types: undefined,
      categories: undefined,
      search: undefined,
      myListings: undefined,
    });
  };

  const hasActiveFilters =
    filters.types?.length ||
    filters.categories?.length ||
    filters.search ||
    filters.myListings;

  return (
    <Card className="sticky top-20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{t('common.filter')}</CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div>
          <Label>{t('common.search')}</Label>
          <Input
            placeholder={t('listings.searchPlaceholder')}
            value={filters.search || ''}
            onChange={(e) => onChange({ search: e.target.value || undefined })}
          />
        </div>

        {/* My Listings */}
        {user && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="myListings"
              checked={filters.myListings || false}
              onCheckedChange={(checked) =>
                onChange({ myListings: checked ? true : undefined })
              }
            />
            <Label htmlFor="myListings" className="cursor-pointer">
              {t('listings.myListings')}
            </Label>
          </div>
        )}

        {/* Type Filter */}
        <div>
          <Label className="mb-2 block">{t('listings.filterByType')}</Label>
          <div className="space-y-2">
            {types.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type}`}
                  checked={filters.types?.includes(type) || false}
                  onCheckedChange={() => handleTypeToggle(type)}
                />
                <Label htmlFor={`type-${type}`} className="cursor-pointer">
                  {t(`listings.types.${type}`)}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <Label className="mb-2 block">{t('listings.filterByCategory')}</Label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {categories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`cat-${category}`}
                  checked={filters.categories?.includes(category) || false}
                  onCheckedChange={() => handleCategoryToggle(category)}
                />
                <Label htmlFor={`cat-${category}`} className="cursor-pointer text-sm">
                  {t(`listings.categories.${category}`)}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
