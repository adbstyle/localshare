import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LocalShare - Nachbarschaft teilen',
  description: 'Teilen Sie mit Ihrer Nachbarschaft',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LocalShare',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
