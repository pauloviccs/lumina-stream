```
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force transpilation for packages that might ship modern syntax
  transpilePackages: ['lucide-react', 'framer-motion', 'vaul', 'sonner', 'clsx', 'tailwind-merge', 'hls.js'],

  // Disable strictly modern features for better TV compatibility
  reactStrictMode: false,

  images: {
    // Disable optimization if causing issues on older engines (optional, but safe for TVs)
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'test-streams.mux.dev',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      }
    ],
  },
};

export default nextConfig;
