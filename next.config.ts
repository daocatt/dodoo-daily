import type { NextConfig } from "next";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // custom service worker source
  buildExcludes: [/middleware-manifest\.json$/],
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
