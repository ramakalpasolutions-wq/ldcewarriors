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

  // Needed for Prisma/Mongo
  serverExternalPackages: ['mongoose'],

  // Fix upload size limit
  experimental: {
    serverActions: {
      bodySizeLimit: '600mb',
    },
  },
}

module.exports = nextConfig