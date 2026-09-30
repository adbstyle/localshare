'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { AlertCircle, CheckCircle, LinkIcon, Loader2, Users } from 'lucide-react';
import { communityQueries, useJoinCommunity } from '@/lib/api/communities';
import { getApiStatus } from '@/lib/api/errors';
import { parseInviteInput } from '@/lib/utils/parse-invite';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useToast } from '@/hooks/use-toast';
import { useErrorToast } from '@/hooks/use-error-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface JoinDialogProps {
  /** Wording: joining a community (list page) or a group (community page). */
  kind: 'communities' | 'groups';
  onJoined?: (communityId: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** Paste an invite link or token, check the preview, then join. */
export function JoinDialog({ kind, onJoined, open: openProp, onOpenChange }: JoinDialogProps) {
  const t = useTranslations();
  const tk = useTranslations(kind);
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const [input, setInput] = useState('');
  const [confirmedToken, setConfirmedToken] = useState<string | null>(null);

  const parsed = parseInviteInput(useDebouncedValue(input, 300));
  const preview = useQuery({ ...communityQueries.preview(confirmedToken ?? ''), enabled: !!confirmedToken });

  const editInput = (value: string) => {
    setInput(value);
    setConfirmedToken(null);
  };
  const setOpen = (next: boolean) => {
    (onOpenChange ?? setInternalOpen)(next);
    if (!next) editInput('');
  };
  const done = (joinedId?: string) => {
    setOpen(false);
    if (joinedId) onJoined?.(joinedId);
  };

  const inputError = parsed.errorKey ? tk(parsed.errorKey) : preview.isError ? tk('errors.tokenNotFound') : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {openProp === undefined && <JoinTrigger label={tk('joinViaLink')} />}
      <DialogContent className="sm:max-w-md" closeLabel={t('common.close')}>
        <DialogHeader>
          <DialogTitle>{tk('joinDialogTitle')}</DialogTitle>
          {!preview.data && <DialogDescription>{tk('pastePrompt')}</DialogDescription>}
        </DialogHeader>

        {preview.data && confirmedToken ? (
          <JoinPreview kind={kind} token={confirmedToken} preview={preview.data}
            onBack={() => setConfirmedToken(null)} onDone={done} />
        ) : (
          <InviteInput kind={kind} value={input} error={inputError} loading={preview.isFetching}
            canContinue={!!parsed.token} onChange={editInput}
            onCancel={() => setOpen(false)} onNext={() => setConfirmedToken(parsed.token)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function JoinTrigger({ label }: { label: string }) {
  return (
    <DialogTrigger asChild>
      <Button variant="outline">
        <LinkIcon className="h-4 w-4 mr-2" />
        {label}
      </Button>
    </DialogTrigger>
  );
}

interface InviteInputProps {
  kind: 'communities' | 'groups';
  value: string;
  error: string | null;
  loading: boolean;
  canContinue: boolean;
  onChange: (value: string) => void;
  onCancel: () => void;
  onNext: () => void;
}

function InviteInput({ kind, value, error, loading, canContinue, onChange, onCancel, onNext }: InviteInputProps) {
  const t = useTranslations();
  const tk = useTranslations(kind);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="invite-input">{tk('pastePrompt')}</Label>
        <Input id="invite-input" placeholder={tk('inputPlaceholder')} value={value} autoFocus
          onChange={(e) => onChange(e.target.value)} className={error ? 'border-destructive' : ''} />
        <p className="text-xs text-muted-foreground">{tk('inputHelper')}</p>
        {error && (
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button onClick={onNext} disabled={!canContinue || loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {tk('next')}
        </Button>
      </div>
    </div>
  );
}

interface JoinPreviewProps {
  kind: 'communities' | 'groups';
  token: string;
  preview: { id: string; name: string; description: string | null; _count: { members: number } };
  onBack: () => void;
  onDone: (joinedId?: string) => void;
}

function JoinPreview({ kind, token, preview, onBack, onDone }: JoinPreviewProps) {
  const t = useTranslations();
  const tk = useTranslations(kind);
  const { toast } = useToast();
  const showError = useErrorToast();
  const join = useJoinCommunity();

  const handleJoin = () =>
    join.mutate(token, {
      onSuccess: () => {
        toast({ variant: 'success', title: tk('joined') });
        onDone(preview.id);
      },
      onError: (error) => {
        if (getApiStatus(error) !== 409) return showError(error, `${kind}.errors.tokenNotFound`);
        toast({ title: tk('alreadyMember'), description: tk('alreadyMemberMessage') });
        onDone();
      },
    });

  return (
    <div className="space-y-4">
      <Card className="border-2">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{preview.name}</h3>
              {preview.description && <p className="text-sm text-muted-foreground mt-1">{preview.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
            <Users className="h-4 w-4" />
            <span>{tk('memberCount', { count: preview._count.members })}</span>
          </div>
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} disabled={join.isPending} className="flex-1">
          {t('common.back')}
        </Button>
        <Button onClick={handleJoin} disabled={join.isPending} className="flex-1">
          {join.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
          {tk('join')}
        </Button>
      </div>
    </div>
  );
}
