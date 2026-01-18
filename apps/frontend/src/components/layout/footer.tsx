'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="border-t mt-auto bg-muted/50">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            {t('footer.tagline')} 🫰
            <span className="text-xs">({t('common.beta')})</span>
          </p>
          <nav className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
              {t('legal.privacy')}
            </Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground">
              {t('legal.terms')}
            </Link>
            <Link href="/imprint" className="text-muted-foreground hover:text-foreground">
              {t('legal.imprint')}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
