import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export function generateStaticParams() {
  return [{ locale: 'de' }, { locale: 'fr' }];
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Enable static rendering for next-intl
  setRequestLocale(locale);

  let messages;
  try {
    messages = (await import(`../../../messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }

  return (
    <html lang={locale}>
      <body className="h-screen flex flex-col overflow-hidden">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Header />
          <main className="flex-1 overflow-y-auto flex flex-col">
            {children}
            <Footer />
          </main>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
