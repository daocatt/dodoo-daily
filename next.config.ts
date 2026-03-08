import type { NextConfig } from "next";
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    'dodoo.local'
  ],
  // Add an empty turbopack config to silence the error with custom webpack
  turbopack: {}
} as NextConfig;

export default withPWA(nextConfig);
