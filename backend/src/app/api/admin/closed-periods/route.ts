import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRole, isAuthError } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { serializeClosedPeriod } from '@/lib/serialize'

export async function GET(request: NextRequest) {
  const auth = await requireAdminRole(request)
  if (isAuthError(auth)) return auth

  if (!auth.user.bhojanshalaId) {
    return NextResponse.json({ error: 'No bhojanshala assigned' }, { status: 404 })
  }

  const periods = await prisma.closedPeriod.findMany({
    where:   { bhojanshalaId: auth.user.bhojanshalaId },
    orderBy: { startDate: 'asc' },
  })

  return NextResponse.json({ data: periods.map(serializeClosedPeriod) })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminRole(request)
  if (isAuthError(auth)) return auth

  if (!auth.user.bhojanshalaId) {
    return NextResponse.json({ error: 'No bhojanshala assigned' }, { status: 404 })
  }

  let body: { reason?: string; note?: string; startDate: string; endDate: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.startDate || !body.endDate) {
    return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 })
  }

  const start = new Date(body.startDate)
  const end   = new Date(body.endDate)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
  }
  if (end < start) {
    return NextResponse.json({ error: 'endDate must be on or after startDate' }, { status: 400 })
  }

  const validReasons = ['WEEKLY_HOLIDAY', 'FESTIVAL', 'MAINTENANCE', 'TEMPORARY', 'OTHER']
  const reason = body.reason && validReasons.includes(body.reason) ? body.reason : 'OTHER'

  const period = await prisma.closedPeriod.create({
    data: {
      bhojanshalaId: auth.user.bhojanshalaId,
      reason:        reason as any,
      note:          body.note?.trim() ?? null,
      startDate:     start,
      endDate:       end,
    },
  })

  await log({
    userId:        auth.user.id,
    bhojanshalaId: auth.user.bhojanshalaId,
    action:        'Added Closed Period',
    description:   `Closed from ${body.startDate} to ${body.endDate} (${reason})`,
  })

  return NextResponse.json({ data: serializeClosedPeriod(period) }, { status: 201 })
}
