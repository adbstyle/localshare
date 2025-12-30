'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { BetaBadge } from '@/components/beta-badge';
import { useAuth } from '@/hooks/use-auth';
import { UserMenu } from '@/components/layout/user-menu';
import { Menu, X, MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function Header() {
  const t = useTranslations();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const feedbackEmail = process.env.NEXT_PUBLIC_FEEDBACK_EMAIL || 'feedback@localshare.ch';

  const handleFeedback = () => {
    window.location.href = `mailto:${feedbackEmail}?subject=LocalShare Feedback`;
  };

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container flex items-center gap-6 py-4">
        {/* Logo & Beta Badge */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{t('common.appName')}</h1>
          </Link>
          <BetaBadge />
        </div>

        {/* Desktop Navigation Links - Left aligned */}
        {user && (
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/communities" className="text-sm font-medium hover:underline">
              {t('nav.communities')}
            </Link>
            <Link href="/groups" className="text-sm font-medium hover:underline">
              {t('nav.groups')}
            </Link>
          </nav>
        )}

        {/* Spacer */}
        <div className="flex-grow" />

        {/* Desktop Action Buttons - Right aligned */}
        {user && (
          <div className="hidden md:flex items-center gap-6">
            <Button variant="ghost" size="sm" onClick={handleFeedback}>
              <MessageSquare className="h-4 w-4 mr-2" />
              {t('common.feedback')}
            </Button>
            <Button variant="default" size="sm" asChild>
              <Link href="/listings/create">
                <Plus className="h-4 w-4 mr-2" />
                {t('listings.create')}
              </Link>
            </Button>
            <UserMenu user={user} logout={logout} />
          </div>
        )}

        {/* Not logged in message */}
        {!user && (
          <div className="hidden md:flex text-sm text-muted-foreground">
            {t('auth.welcomeText')}
          </div>
        )}

        {/* Mobile Action Buttons & Menu */}
        {user && (
          <div className="flex md:hidden items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleFeedback} aria-label={t('common.feedback')}>
              <MessageSquare className="h-5 w-5" />
            </Button>
            <Button variant="default" size="icon" asChild aria-label={t('listings.create')}>
              <Link href="/listings/create">
                <Plus className="h-5 w-5" />
              </Link>
            </Button>
            <button
              className="p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        )}

        {/* Mobile Menu Button (when not logged in) */}
        {!user && (
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        )}
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container py-4 flex flex-col gap-4">
            {user ? (
              <>
                {/* Action Section */}
                <button
                  onClick={() => {
                    handleFeedback();
                    setMobileMenuOpen(false);
                  }}
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  {t('common.feedback')}
                </button>
                <Link
                  href="/listings/create"
                  className="text-sm font-medium text-primary flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Plus className="h-4 w-4" />
                  {t('listings.create')}
                </Link>
                <div className="border-t my-1" />
                {/* Navigation Section */}
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
                <div className="border-t my-1" />
                {/* Account Section */}
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
