'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { BetaBadge } from '@/components/beta-badge';
import { useAuth } from '@/hooks/use-auth';
import { UserMenu } from '@/components/layout/user-menu';
import { Menu, X, MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { useState, useMemo, useCallback, Suspense } from 'react';
import { MobileFilterButton } from '@/components/listings/mobile-filter-button';
import { MobileFilterSheet } from '@/components/listings/mobile-filter-sheet';
import { FilterListingsDto } from '@localshare/shared';
import { parseFiltersFromURL, buildURLFromFilters } from '@/lib/utils/url-filters';

const ITEMS_PER_PAGE = 30;

function HeaderContent() {
  const t = useTranslations();
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const feedbackEmail = process.env.NEXT_PUBLIC_FEEDBACK_EMAIL || 'localshare.repossess838@passmail.com';

  // Calculate active filter count from URL (for badge)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchParams.get('search')) count++;
    if (searchParams.get('myListings') === 'true') count++;
    const types = searchParams.getAll('types');
    const categories = searchParams.getAll('categories');
    count += types.length + categories.length;
    return count;
  }, [searchParams]);

  // Get current filters from URL for the sheet
  const currentFilters = useMemo(
    () => parseFiltersFromURL(searchParams, ITEMS_PER_PAGE),
    [searchParams]
  );

  // Handle filter apply - navigate to /listings with new filter params
  const handleFilterApply = useCallback(
    (filters: Partial<FilterListingsDto>) => {
      const urlString = buildURLFromFilters(filters, searchParams, 1);
      router.push(`/?${urlString}`);
      setMobileFilterOpen(false);
    },
    [searchParams, router]
  );

  const handleFeedback = () => {
    window.location.href = `mailto:${feedbackEmail}?subject=LocalShare Feedback`;
  };

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container flex items-center gap-6 py-4">
        {/* Logo, Name & Beta Badge */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2" aria-label="LocalShare">
            <Image
              src="/logo.svg"
              alt="LocalShare Logo"
              width={32}
              height={32}
              priority
              className="h-8 w-8"
            />
            <span className="font-semibold text-lg">LocalShare</span>
          </Link>
          <BetaBadge />
        </div>

        {/* Desktop Navigation Links - Left aligned */}
        {user && (
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium hover:underline">
              {t('nav.listings')}
            </Link>
            <Link href="/communities" className="text-sm font-medium hover:underline">
              {t('nav.communities')}
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

        {/* Mobile Action Buttons & Menu: [Filter] [Create] [Menu] */}
        {user && (
          <div className="flex md:hidden items-center gap-2">
            <MobileFilterButton
              activeFilterCount={activeFilterCount}
              onClick={() => setMobileFilterOpen(true)}
            />
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

        {/* Mobile Filter Sheet */}
        {mobileFilterOpen && (
          <MobileFilterSheet
            open={mobileFilterOpen}
            onOpenChange={setMobileFilterOpen}
            currentFilters={currentFilters}
            onApply={handleFilterApply}
          />
        )}

      </div>

      {/* Mobile Navigation Modal */}
      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent
          className="fixed inset-x-0 bottom-0 top-0 h-[100dvh] max-h-[100dvh] w-full max-w-full translate-x-0 translate-y-0 rounded-t-2xl p-0 flex flex-col data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:rounded-t-2xl"
          onPointerDownOutside={() => setMobileMenuOpen(false)}
          onEscapeKeyDown={() => setMobileMenuOpen(false)}
        >
          {/* Sticky Header */}
          <DialogHeader className="sticky top-0 z-10 flex flex-row items-center justify-between border-b bg-background px-4 py-3">
            <DialogTitle className="text-lg font-semibold">
              {t('nav.menu')}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t('nav.menuDescription')}
            </DialogDescription>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <X className="h-5 w-5" />
                <span className="sr-only">{t('common.close')}</span>
              </Button>
            </DialogClose>
          </DialogHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {user && (
              <nav className="flex flex-col gap-1">
                {/* Action Section */}
                <button
                  onClick={() => {
                    handleFeedback();
                    setMobileMenuOpen(false);
                  }}
                  className="text-sm font-medium flex items-center gap-2 min-h-10"
                >
                  <MessageSquare className="h-4 w-4" />
                  {t('common.feedback')}
                </button>
                <Link
                  href="/listings/create"
                  className="text-sm font-medium text-primary flex items-center gap-2 min-h-10"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Plus className="h-4 w-4" />
                  {t('listings.create')}
                </Link>
                <div className="border-t my-2" />
                {/* Navigation Section */}
                <Link
                  href="/"
                  className="text-sm font-medium flex items-center min-h-10"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.listings')}
                </Link>
                <Link
                  href="/communities"
                  className="text-sm font-medium flex items-center min-h-10"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.communities')}
                </Link>
                <Link
                  href="/profile"
                  className="text-sm font-medium flex items-center min-h-10"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.profile')}
                </Link>
                <div className="border-t my-2" />
                {/* Account Section */}
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-sm font-medium text-left text-destructive flex items-center min-h-10"
                >
                  {t('nav.logout')}
                </button>
              </nav>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}

// Skeleton for header during SSR/loading
function HeaderSkeleton() {
  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container flex items-center gap-6 py-4">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          <div className="h-5 w-12 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex-grow" />
        <div className="flex md:hidden items-center gap-2">
          <div className="h-10 w-10 bg-muted animate-pulse rounded" />
          <div className="h-10 w-10 bg-muted animate-pulse rounded" />
          <div className="h-10 w-10 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </header>
  );
}

export function Header() {
  return (
    <Suspense fallback={<HeaderSkeleton />}>
      <HeaderContent />
    </Suspense>
  );
}
