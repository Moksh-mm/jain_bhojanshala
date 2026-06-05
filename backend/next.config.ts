import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    const allowedOrigins = process.env.ALLOWED_ORIGINS || 'http://localhost:5173'
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin',      value: allowedOrigins },
          { key: 'Access-Control-Allow-Methods',     value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS' },
          { key: 'Access-Control-Allow-Headers',     value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ]
  },
}

export default nextConfig
