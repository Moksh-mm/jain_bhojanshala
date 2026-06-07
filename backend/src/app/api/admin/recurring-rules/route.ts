import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRole, isAuthError } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const auth = await requireAdminRole(request)
  if (isAuthError(auth)) return auth

  if (!auth.user.bhojanshalaId) {
    return NextResponse.json({ error: 'No bhojanshala assigned' }, { status: 404 })
  }

  try {
    const rules = await prisma.recurringRule.findMany({
      where:   { bhojanshalaId: auth.user.bhojanshalaId },
      orderBy: { dayOfWeek: 'asc' },
    })
    return NextResponse.json({ rules })
  } catch (err: unknown) {
    console.error('[recurring-rules GET]', err)
    return NextResponse.json({ rules: [], migrationRequired: true })
  }
}

const VALID_REASONS = ['WEEKLY_HOLIDAY', 'FESTIVAL', 'MAINTENANCE', 'TEMPORARY', 'OTHER']
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export async function PUT(request: NextRequest) {
  const auth = await requireAdminRole(request)
  if (isAuthError(auth)) return auth

  if (!auth.user.bhojanshalaId) {
    return NextResponse.json({ error: 'No bhojanshala assigned' }, { status: 404 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const dayOfWeek = Number(body.dayOfWeek)
  if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    return NextResponse.json({ error: 'dayOfWeek must be 0–6' }, { status: 400 })
  }

  const isClosed         = Boolean(body.isClosed)
  const closedReason     = VALID_REASONS.includes(body.closedReason as string)
                           ? (body.closedReason as any) : null
  const navkarshiEnabled = body.navkarshiEnabled !== false
  const lunchEnabled     = body.lunchEnabled     !== false
  const choviharEnabled  = body.choviharEnabled  !== false

  let rule: Awaited<ReturnType<typeof prisma.recurringRule.upsert>>
  try {
    rule = await prisma.recurringRule.upsert({
    where: {
      bhojanshalaId_dayOfWeek: {
        bhojanshalaId: auth.user.bhojanshalaId,
        dayOfWeek,
      },
    },
    create: {
      bhojanshalaId: auth.user.bhojanshalaId,
      dayOfWeek, isClosed, closedReason,
      navkarshiEnabled, lunchEnabled, choviharEnabled,
    },
    update: {
      isClosed, closedReason,
      navkarshiEnabled, lunchEnabled, choviharEnabled,
    },
  })
  } catch (err: unknown) {
    console.error('[recurring-rules PUT]', err)
    const msg = err instanceof Error ? err.message : 'Database error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  await log({
    userId:        auth.user.id,
    bhojanshalaId: auth.user.bhojanshalaId,
    action:        'Updated Recurring Rule',
    description:   `${DAY_NAMES[dayOfWeek]}: ${isClosed ? 'Closed' : 'Partial availability'}`,
  })

  return NextResponse.json({ rule })
}
