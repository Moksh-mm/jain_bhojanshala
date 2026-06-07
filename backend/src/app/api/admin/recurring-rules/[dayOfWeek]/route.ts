import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRole, isAuthError } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ dayOfWeek: string }> },
) {
  const auth = await requireAdminRole(request)
  if (isAuthError(auth)) return auth

  if (!auth.user.bhojanshalaId) {
    return NextResponse.json({ error: 'No bhojanshala assigned' }, { status: 404 })
  }

  const { dayOfWeek: dowStr } = await params
  const dayOfWeek = Number(dowStr)

  if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    return NextResponse.json({ error: 'dayOfWeek must be 0–6' }, { status: 400 })
  }

  await prisma.recurringRule.deleteMany({
    where: {
      bhojanshalaId: auth.user.bhojanshalaId,
      dayOfWeek,
    },
  })

  await log({
    userId:        auth.user.id,
    bhojanshalaId: auth.user.bhojanshalaId,
    action:        'Removed Recurring Rule',
    description:   `Cleared rule for ${DAY_NAMES[dayOfWeek]}`,
  })

  return NextResponse.json({ success: true })
}
