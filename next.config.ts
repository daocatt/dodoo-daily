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
  experimental: {
    serverActions: {
      allowedOrigins: [
        'http://localhost:3000', 'http://127.0.0.1:3000', 'localhost:3000', '127.0.0.1:3000',
        'http://localhost:3001', 'http://127.0.0.1:3001', 'localhost:3001', '127.0.0.1:3001'
      ],
    }
  }
};

export default withPWA(nextConfig);
