import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'res.cloudinary.com',
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
      'images.unsplash.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/dyhgwvz8b/**',
      },
    ],
  },
};

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: false, // process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

export default withPWA(nextConfig);
