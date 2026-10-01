/** @type {import('next').NextConfig} */
const withNextIntl = require('next-intl/plugin')('./src/i18n.ts');

const nextConfig = {
  reactStrictMode: true,
  // Groups became communities with a parent (#191) and kept their ids, so old
  // group links and invites (/groups/join?token=...) land on the same pages.
  // Temporary on purpose: browsers do not cache it, a rollback stays possible.
  async redirects() {
    return [
      { source: '/:locale(de|fr)/groups/:path*', destination: '/:locale/communities/:path*', permanent: false },
    ];
  },
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
