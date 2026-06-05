import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const origin  = request.headers.get('origin') ?? ''
  const allowed = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173').split(',').map(s => s.trim())

  const res = NextResponse.next()

  if (allowed.includes(origin) || allowed.includes('*')) {
    res.headers.set('Access-Control-Allow-Origin',      origin)
    res.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: res.headers })
  }

  return res
}

export const config = { matcher: '/api/:path*' }
