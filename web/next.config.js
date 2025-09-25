/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Remove output: 'standalone' for Vercel deployment
  // output: 'standalone',
}

module.exports = nextConfig
