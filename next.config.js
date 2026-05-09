/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
  },

  // ✅ Needed for Prisma/Mongo
  serverExternalPackages: ['mongoose'],

  // ✅ Only JSON metadata goes through server actions — keep this small
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // ✅ NO turbopack config - Webpack is default in Next.js 15
}

module.exports = nextConfig