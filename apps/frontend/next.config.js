/** @type {import('next').NextConfig} */
const withNextIntl = require('next-intl/plugin')('./src/i18n.ts');

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@localshare/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'ubknsruneajnldvbshvr.supabase.co', // Supabase prod
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'xcyluldeovpjjflqrcvh.supabase.co', // Supabase staging
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

module.exports = withNextIntl(nextConfig);
