'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { Link } from '@/navigation';
import { useToast } from '@/hooks/use-toast';
import { Mail } from 'lucide-react';
import { HowItWorks } from '@/components/how-it-works';

export function LoginPage() {
  const t = useTranslations();
  const { toast } = useToast();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [hasPendingInvite, setHasPendingInvite] = useState(false);
  const [inviteName, setInviteName] = useState<string | null>(null);
  const [inviteType, setInviteType] = useState<'community' | 'group'>('community');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    // Check if there's a pending invite token (community or group)
    const communityToken = sessionStorage.getItem('pendingInviteToken');
    const groupToken = sessionStorage.getItem('pendingGroupInviteToken');
    setHasPendingInvite(!!(communityToken || groupToken));
    setInviteType(groupToken ? 'group' : 'community');

    const name = sessionStorage.getItem('pendingInviteName');
    setInviteName(name);
  }, []);

  const handleLogin = (provider: 'google' | 'microsoft') => {
    if (!acceptedTerms) {
      toast({
        title: t('errors.validation'),
        description: t('auth.mustAcceptTerms'),
        variant: 'destructive',
      });
      return;
    }

    // Check for pending invites in sessionStorage (SAIT pattern - Layer 3)
    // With Layer 1 implemented, only one should exist, but handle both as fail-safe
    const communityToken = sessionStorage.getItem('pendingInviteToken');
    const groupToken = sessionStorage.getItem('pendingGroupInviteToken');

    // Prefer group token over community token (most specific invite type)
    // This is a fail-safe in case both tokens somehow exist
    const inviteToken = groupToken || communityToken;
    const inviteType = groupToken ? 'group' : 'community';

    // Build auth URL with invite context if present
    let authUrl = `${apiUrl}/api/v1/auth/${provider}`;

    if (inviteToken) {
      authUrl += `?inviteToken=${encodeURIComponent(inviteToken)}&inviteType=${inviteType}`;
    }

    window.location.href = authUrl;
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Image Layer */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/images/neighbors-sharing.jpg"
          alt="Nachbarn teilen Rettungswesten in ihrer Gemeinschaft"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Overlay Layer */}
      <div className="absolute inset-0 -z-10 bg-black/20 dark:bg-black/40" />

      {/* Content Layer */}
      <div className="flex flex-col items-center justify-center min-h-screen gap-12 lg:gap-24 p-4 lg:p-12">
        {/* Hero Headline */}
        <div className="text-center">
          <h1 className="text-white text-3xl lg:text-6xl font-bold">
            {t('auth.headline')}
          </h1>
          <p className="text-white/90 text-lg lg:text-2xl mt-4">
            {t('auth.subline')}
          </p>
        </div>

        {/* Glassmorphism Login Card */}
        <Card className="w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-2xl border border-white/20">
          <CardContent className="space-y-4 p-6 lg:p-8 pt-6">
            {hasPendingInvite && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                      {t(inviteType === 'group' ? 'communities.invitePendingGroup' : 'communities.invitePendingCommunity', { name: inviteName || '' })}
                    </p>
                    <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                      {t('communities.invitePendingText')}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <Button
              className="w-full"
              size="lg"
              onClick={() => handleLogin('google')}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t('auth.loginWith')} {t('auth.google')}
            </Button>

            <Button
              className="w-full"
              size="lg"
              variant="outline"
              onClick={() => handleLogin('microsoft')}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 23 23">
                <path fill="#f3f3f3" d="M0 0h23v23H0z" />
                <path fill="#f35325" d="M1 1h10v10H1z" />
                <path fill="#81bc06" d="M12 1h10v10H12z" />
                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                <path fill="#ffba08" d="M12 12h10v10H12z" />
              </svg>
              {t('auth.loginWith')} {t('auth.microsoft')}
            </Button>

            <div className="flex space-x-2 pt-4">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(!!checked)}
                className="mt-1"
              />
              <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                {t('auth.acceptTerms')}{' '}
                <Link href="/terms" className="underline hover:text-primary">
                  {t('auth.termsOfService')}
                </Link>
                {' '}{t('auth.and')}{' '}
                <Link href="/privacy" className="underline hover:text-primary">
                  {t('auth.privacyPolicy')}
                </Link>
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How It Works Section */}
      <HowItWorks />
    </div>
  );
}
