'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { communityQueries } from '@/lib/api/communities';
import { groupQueries } from '@/lib/api/groups';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface Option {
  id: string;
  label: string;
  hint?: string;
}

interface VisibilityFieldsProps {
  communityIds: string[];
  groupIds: string[];
  onChange: (field: 'communityIds' | 'groupIds', ids: string[]) => void;
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
export function ListingVisibilityFields({ communityIds, groupIds, onChange }: VisibilityFieldsProps) {
  const t = useTranslations();
  const communities = useQuery(communityQueries.list());
  const groups = useQuery(groupQueries.mine());

  if (communities.isPending || groups.isPending) {
    return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />;
  }

  const communityOptions = (communities.data ?? []).map((c) => ({ id: c.id, label: c.name }));
  const groupOptions = (groups.data ?? []).map((g) => ({ id: g.id, label: g.name, hint: g.community.name }));

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
        onToggle={(id, checked) => onChange('communityIds', toggle(communityIds, id, checked))} />
      <OptionList title={t('nav.groups')} prefix="group" options={groupOptions} selected={groupIds}
        onToggle={(id, checked) => onChange('groupIds', toggle(groupIds, id, checked))} />
    </>
  );
}
