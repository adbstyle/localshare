import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://localshare.wylergut.ch'),
  title: 'LocalShare - Nachbarschaft teilen',
  description: 'Teilen Sie mit Ihrer Nachbarschaft',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LocalShare',
  },
  openGraph: {
    siteName: 'LocalShare',
    locale: 'de_CH',
    title: 'LocalShare - Einfach privat teilen',
    description: 'Leihen, tauschen, teilen mit deinen Nachbarn',
    type: 'website',
    url: 'https://localshare.wylergut.ch',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LocalShare Logo',
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
