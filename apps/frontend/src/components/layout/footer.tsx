'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Heart } from 'lucide-react';

interface FooterProps {
  locale: string;
}

export function Footer({ locale }: FooterProps) {
  const t = useTranslations();

  return (
    <footer className="border-t mt-auto bg-muted/50">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            {t('footer.madeWith')} <Heart className="h-4 w-4 text-red-500 fill-red-500" /> {t('footer.in')} {t('footer.switzerland')}
          </p>
          <nav className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href={`/${locale}/privacy`} className="text-muted-foreground hover:text-foreground">
              {t('legal.privacy')}
            </Link>
            <Link href={`/${locale}/terms`} className="text-muted-foreground hover:text-foreground">
              {t('legal.terms')}
            </Link>
            <Link href={`/${locale}/imprint`} className="text-muted-foreground hover:text-foreground">
              {t('legal.imprint')}
            </Link>
          </nav>
        </div>
        <div className="mt-4 text-center text-xs text-muted-foreground">
          Made with Next.js 14, NestJS, Prisma, and shadcn/ui
        </div>
      </div>
    </footer>
  );
}
