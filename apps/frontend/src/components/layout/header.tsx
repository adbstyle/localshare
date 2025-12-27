'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { BetaBadge } from '@/components/beta-badge';
import { useAuth } from '@/hooks/use-auth';
import { UserMenu } from '@/components/layout/user-menu';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const t = useTranslations();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container flex items-center justify-between py-4">
        {/* Logo & Beta Badge */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{t('common.appName')}</h1>
          </Link>
          <BetaBadge />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <Link href="/" className="text-sm font-medium hover:underline">
                {t('nav.listings')}
              </Link>
              <Link href="/communities" className="text-sm font-medium hover:underline">
                {t('nav.communities')}
              </Link>
              <Link href="/groups" className="text-sm font-medium hover:underline">
                {t('nav.groups')}
              </Link>
              <UserMenu user={user} logout={logout} />
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              {t('auth.welcomeText')}
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container py-4 flex flex-col gap-4">
            {user ? (
              <>
                <Link
                  href="/"
                  className="text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.listings')}
                </Link>
                <Link
                  href="/communities"
                  className="text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.communities')}
                </Link>
                <Link
                  href="/groups"
                  className="text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.groups')}
                </Link>
                <Link
                  href="/profile"
                  className="text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.profile')}
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-sm font-medium text-left text-destructive"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : null}
          </nav>
        </div>
      )}
    </header>
  );
}
