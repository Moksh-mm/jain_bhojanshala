import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRole, isAuthError } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'

type Ctx = { params: Promise<{ id: string }> }

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const auth = await requireAdminRole(request)
  if (isAuthError(auth)) return auth

  if (!auth.user.bhojanshalaId) {
    return NextResponse.json({ error: 'No bhojanshala assigned' }, { status: 404 })
  }

  const { id } = await params

  const period = await prisma.closedPeriod.findUnique({ where: { id } })
  if (!period) return NextResponse.json({ error: 'Closed period not found' }, { status: 404 })

  // Ensure admin can only delete their own bhojanshala's periods
  if (period.bhojanshalaId !== auth.user.bhojanshalaId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.closedPeriod.delete({ where: { id } })

  await log({
    userId:        auth.user.id,
    bhojanshalaId: auth.user.bhojanshalaId,
    action:        'Removed Closed Period',
    description:   `Removed closed period from ${period.startDate.toISOString().split('T')[0]} to ${period.endDate.toISOString().split('T')[0]}`,
  })

  return NextResponse.json({ message: 'Closed period deleted' })
}
