/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Cloudinary (thumbnails)
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },

      // ✅ Cloudflare R2 public domain
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },

//        If You Use Custom Domain for R2
// Example:



// https://cdn.yoursite.com/videos/abc.mp4
// Then use:



// {
//   protocol: 'https',
//   hostname: 'cdn.yoursite.com',
// }
// instead of *.r2.dev.

      // Optional
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

  // ✅ Next 16 Turbopack default
  turbopack: {},
}

module.exports = nextConfig