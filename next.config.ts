// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname, // ensures Turbopack treats this folder as the project root
  },
};

export default nextConfig;