import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRole, isAuthError } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> },
) {
  const auth = await requireAdminRole(request)
  if (isAuthError(auth)) return auth

  if (!auth.user.bhojanshalaId) {
    return NextResponse.json({ error: 'No bhojanshala assigned' }, { status: 404 })
  }

  const { date: dateStr } = await params

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ error: 'Invalid date format (YYYY-MM-DD)' }, { status: 400 })
  }

  const dateUTC = new Date(dateStr + 'T00:00:00.000Z')

  await prisma.availabilityCalendar.deleteMany({
    where: {
      bhojanshalaId: auth.user.bhojanshalaId,
      date: dateUTC,
    },
  })

  await log({
    userId:        auth.user.id,
    bhojanshalaId: auth.user.bhojanshalaId,
    action:        'Reset Availability',
    description:   `Removed override for ${dateStr}`,
  })

  return NextResponse.json({ success: true })
}
