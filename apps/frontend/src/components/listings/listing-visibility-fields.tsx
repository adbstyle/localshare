'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { communityQueries } from '@/lib/api/communities';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface Option {
  id: string;
  label: string;
  hint?: string;
}

interface VisibilityFieldsProps {
  communityIds: string[];
  onChange: (ids: string[]) => void;
}

function toggle(ids: string[], id: string, checked: boolean): string[] {
  return checked ? [...ids, id] : ids.filter((existing) => existing !== id);
}

function OptionList({ title, prefix, options, selected, onToggle }: {
  title: string;
  prefix: string;
  options: Option[];
  selected: string[];
  onToggle: (id: string, checked: boolean) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{title}</Label>
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.id} className="flex items-center space-x-2">
            <Checkbox
              id={`${prefix}-${option.id}`}
              checked={selected.includes(option.id)}
              onCheckedChange={(checked) => onToggle(option.id, checked === true)}
            />
            <Label htmlFor={`${prefix}-${option.id}`} className="text-sm font-normal cursor-pointer">
              {option.label}
              {option.hint && <span className="text-muted-foreground text-xs ml-2">({option.hint})</span>}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Share targets: only the user's own communities and groups are offered. */
export function ListingVisibilityFields({ communityIds, onChange }: VisibilityFieldsProps) {
  const t = useTranslations();
  const memberships = useQuery(communityQueries.list());

  if (memberships.isPending) {
    return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />;
  }

  // One flat list: communities at the top level, groups carry their parent
  const all = memberships.data ?? [];
  const communityOptions = all.filter((c) => !c.parentId).map((c) => ({ id: c.id, label: c.name }));
  const groupOptions = all
    .filter((c) => c.parent)
    .map((g) => ({ id: g.id, label: g.name, hint: g.parent?.name }));

  if (communityOptions.length === 0 && groupOptions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('communities.empty')} {t('communities.emptyAction')}
      </p>
    );
  }

  return (
    <>
      <OptionList title={t('nav.communities')} prefix="community" options={communityOptions} selected={communityIds}
        onToggle={(id, checked) => onChange(toggle(communityIds, id, checked))} />
      <OptionList title={t('nav.groups')} prefix="group" options={groupOptions} selected={communityIds}
        onToggle={(id, checked) => onChange(toggle(communityIds, id, checked))} />
    </>
  );
}
