import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRole, isAuthError } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminRole(request)
  if (isAuthError(auth)) return auth

  if (!auth.user.bhojanshalaId) {
    return NextResponse.json({ error: 'No bhojanshala assigned' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') // "2026-06"

  let start: Date
  let end: Date

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split('-').map(Number)
    start = new Date(Date.UTC(y, m - 1, 1))
    end   = new Date(Date.UTC(y, m, 1)) // exclusive
  } else {
    // default: current month
    const now = new Date()
    start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))
    end   = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1))
  }

  try {
    const [entries, rules] = await Promise.all([
      prisma.availabilityCalendar.findMany({
        where: {
          bhojanshalaId: auth.user.bhojanshalaId,
          date: { gte: start, lt: end },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.recurringRule.findMany({
        where: { bhojanshalaId: auth.user.bhojanshalaId },
        orderBy: { dayOfWeek: 'asc' },
      }),
    ])
    return NextResponse.json({
      entries: entries.map(e => ({ ...e, date: toDateStr(e.date) })),
      recurringRules: rules,
    })
  } catch (err: unknown) {
    console.error('[availability GET]', err)
    const msg = err instanceof Error ? err.message : 'Database error'
    const notMigrated = msg.includes('does not exist') || msg.includes('relation') || msg.includes('P2021')
    if (notMigrated) {
      return NextResponse.json({ entries: [], recurringRules: [], migrationRequired: true })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

const VALID_REASONS = ['WEEKLY_HOLIDAY', 'FESTIVAL', 'MAINTENANCE', 'TEMPORARY', 'OTHER']

export async function POST(request: NextRequest) {
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

  const dateStr = body.date as string
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ error: 'date is required (YYYY-MM-DD)' }, { status: 400 })
  }

  const dateUTC = new Date(dateStr + 'T00:00:00.000Z')
  if (isNaN(dateUTC.getTime())) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }

  const isClosed         = Boolean(body.isClosed)
  const closedReason     = VALID_REASONS.includes(body.closedReason as string)
                           ? (body.closedReason as any) : null
  const closedNote       = typeof body.closedNote      === 'string' ? body.closedNote.trim() || null : null
  const specialNotice    = typeof body.specialNotice   === 'string' ? body.specialNotice.trim() || null : null
  const navkarshiEnabled = body.navkarshiEnabled !== false
  const navkarshiStart   = typeof body.navkarshiStart  === 'string' ? body.navkarshiStart || null : null
  const navkarshiEnd     = typeof body.navkarshiEnd    === 'string' ? body.navkarshiEnd   || null : null
  const navkarshiPrice   = typeof body.navkarshiPrice  === 'number' ? body.navkarshiPrice  : null
  const lunchEnabled     = body.lunchEnabled    !== false
  const lunchStart       = typeof body.lunchStart      === 'string' ? body.lunchStart      || null : null
  const lunchEnd         = typeof body.lunchEnd        === 'string' ? body.lunchEnd        || null : null
  const lunchPrice       = typeof body.lunchPrice      === 'number' ? body.lunchPrice       : null
  const choviharEnabled  = body.choviharEnabled !== false
  const choviharStart    = typeof body.choviharStart   === 'string' ? body.choviharStart   || null : null
  const choviharEnd      = typeof body.choviharEnd     === 'string' ? body.choviharEnd     || null : null
  const choviharPrice    = typeof body.choviharPrice   === 'number' ? body.choviharPrice    : null
  const ayambilEnabled   = body.ayambilEnabled  !== false
  const ayambilStart     = typeof body.ayambilStart    === 'string' ? body.ayambilStart    || null : null
  const ayambilEnd       = typeof body.ayambilEnd      === 'string' ? body.ayambilEnd      || null : null
  const ayambilPrice     = typeof body.ayambilPrice    === 'number' ? body.ayambilPrice     : null

  let entry: Awaited<ReturnType<typeof prisma.availabilityCalendar.upsert>>
  try {
    entry = await prisma.availabilityCalendar.upsert({
    where: {
      bhojanshalaId_date: {
        bhojanshalaId: auth.user.bhojanshalaId,
        date: dateUTC,
      },
    },
    create: {
      bhojanshalaId: auth.user.bhojanshalaId,
      date: dateUTC,
      isClosed, closedReason, closedNote, specialNotice,
      navkarshiEnabled, navkarshiStart, navkarshiEnd, navkarshiPrice,
      ayambilEnabled,  ayambilStart,  ayambilEnd,  ayambilPrice,
      lunchEnabled, lunchStart, lunchEnd, lunchPrice,
      choviharEnabled, choviharStart, choviharEnd, choviharPrice,
    },
    update: {
      isClosed, closedReason, closedNote, specialNotice,
      navkarshiEnabled, navkarshiStart, navkarshiEnd, navkarshiPrice,
      ayambilEnabled,  ayambilStart,  ayambilEnd,  ayambilPrice,
      lunchEnabled, lunchStart, lunchEnd, lunchPrice,
      choviharEnabled, choviharStart, choviharEnd, choviharPrice,
    },
  })
  } catch (err: unknown) {
    console.error('[availability POST]', err)
    const msg = err instanceof Error ? err.message : 'Database error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  await log({
    userId:        auth.user.id,
    bhojanshalaId: auth.user.bhojanshalaId,
    action:        'Updated Availability',
    description:   `${dateStr}: ${isClosed ? 'Closed' : 'Updated meal availability'}`,
  })

  return NextResponse.json({ data: { ...entry, date: toDateStr(entry.date) } })
}
