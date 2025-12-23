import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

export default createMiddleware({
  locales,
  defaultLocale: 'de',
  localePrefix: 'always',
});

export const config = {
  matcher: ['/', '/(de|fr)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
