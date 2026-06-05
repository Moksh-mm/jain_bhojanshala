import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin, isAuthError } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { serializeLog } from '@/lib/serialize'

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request)
  if (isAuthError(auth)) return auth

  const { searchParams } = new URL(request.url)
  const page     = Math.max(0, parseInt(searchParams.get('page') ?? '0'))
  const limit    = Math.min(50, parseInt(searchParams.get('limit') ?? '25'))
  const search   = searchParams.get('search') ?? ''

  const where = search
    ? {
        OR: [
          { action:      { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
          { user:        { name: { contains: search, mode: 'insensitive' as const } } },
        ],
      }
    : {}

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:    page * limit,
      take:    limit,
      include: {
        user:        { select: { id: true, name: true, role: true } },
        bhojanshala: { select: { id: true, nameEnglish: true } },
      },
    }),
    prisma.activityLog.count({ where }),
  ])

  return NextResponse.json({
    data:  logs.map(serializeLog),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  })
}
