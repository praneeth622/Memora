/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Enable standalone output for Docker
  output: 'standalone',
  // Disable telemetry for production
  ...(process.env.NODE_ENV === 'production' && {
    telemetry: false,
  }),
}

module.exports = nextConfig