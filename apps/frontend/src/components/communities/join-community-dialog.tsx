'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { parseInviteInput } from '@/lib/utils/parse-invite';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { LinkIcon, Loader2, Users, AlertCircle, CheckCircle } from 'lucide-react';

interface CommunityPreview {
  id: string;
  name: string;
  description: string | null;
  _count: {
    members: number;
  };
}

type DialogStep = 'input' | 'preview';

interface JoinCommunityDialogProps {
  onJoinSuccess?: (communityId: string) => void;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideDefaultTrigger?: boolean;
}

export function JoinCommunityDialog({
  onJoinSuccess,
  className,
  variant = 'default',
  open: openProp,
  onOpenChange: onOpenChangeProp,
  hideDefaultTrigger = false,
}: JoinCommunityDialogProps = {}) {
  const t = useTranslations();
  const { toast } = useToast();

  // Support both controlled and uncontrolled modes
  const isControlled = typeof openProp !== 'undefined';
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? openProp : internalOpen;
  const setOpen = isControlled ? (onOpenChangeProp || (() => {})) : setInternalOpen;
  const [step, setStep] = useState<DialogStep>('input');
  const [input, setInput] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [community, setCommunity] = useState<CommunityPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const debouncedInput = useDebouncedValue(input, 300);

  // Validate input when debounced value changes
  useEffect(() => {
    if (!debouncedInput || step !== 'input') return;

    const parseResult = parseInviteInput(debouncedInput);
    if (parseResult.isValid && parseResult.token) {
      setToken(parseResult.token);
      setError(null);
    } else if (parseResult.errorKey) {
      setToken(null);
      setError(t(parseResult.errorKey));
    } else {
      setToken(null);
      setError(null);
    }
  }, [debouncedInput, step, t]);

  const handleNext = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get<CommunityPreview>(`/communities/preview/${token}`);
      setCommunity(data);
      setStep('preview');
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError(t('communities.errors.alreadyMember'));
      } else {
        setError(t('communities.errors.tokenNotFound'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!token) return;

    setJoining(true);
    try {
      const { data } = await api.post(`/communities/join/${token}`);

      // Extract community ID from response or use the one from preview
      const joinedCommunityId = data?.id || community?.id;

      toast({
        variant: 'success',
        title: t('communities.joined'),
      });

      setOpen(false);

      // Trigger parent refresh with community ID
      if (onJoinSuccess && joinedCommunityId) {
        onJoinSuccess(joinedCommunityId);
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        toast({
          title: t('communities.alreadyMember'),
          description: t('communities.alreadyMemberMessage'),
          variant: 'default',
        });
        setOpen(false);
      } else {
        toast({
          title: t('errors.generic'),
          description: err.response?.data?.message || t('communities.errors.tokenNotFound'),
          variant: 'destructive',
        });
      }
    } finally {
      setJoining(false);
    }
  };

  const handleBack = () => {
    setStep('input');
    setCommunity(null);
    setError(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when closing
      setStep('input');
      setInput('');
      setToken(null);
      setCommunity(null);
      setError(null);
      setLoading(false);
      setJoining(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!hideDefaultTrigger && (
        <DialogTrigger asChild>
          <Button variant={variant} className={className}>
            <LinkIcon className="h-4 w-4 mr-2" />
            {t('communities.joinViaLink')}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('communities.joinDialogTitle')}</DialogTitle>
          {step === 'input' && (
            <DialogDescription>{t('communities.pastePrompt')}</DialogDescription>
          )}
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-input">{t('communities.pastePrompt')}</Label>
              <Input
                id="invite-input"
                placeholder={t('communities.inputPlaceholder')}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className={error ? 'border-destructive' : ''}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                {t('communities.inputHelper')}
              </p>
              {error && (
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleNext} disabled={!token || loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('communities.next')}
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && community && (
          <div className="space-y-4">
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{community.name}</h3>
                      {community.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {community.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                    <Users className="h-4 w-4" />
                    <span>{t('communities.memberCount', { count: community._count.members })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBack} disabled={joining} className="flex-1">
                {t('common.back')}
              </Button>
              <Button onClick={handleJoin} disabled={joining} className="flex-1">
                {joining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!joining && <CheckCircle className="mr-2 h-4 w-4" />}
                {t('communities.join')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
