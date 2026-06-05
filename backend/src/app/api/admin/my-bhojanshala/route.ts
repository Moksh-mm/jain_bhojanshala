import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRole, isAuthError } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { serializeBhojanshala } from '@/lib/serialize'

export async function GET(request: NextRequest) {
  const auth = await requireAdminRole(request)
  if (isAuthError(auth)) return auth

  if (!auth.user.bhojanshalaId) {
    return NextResponse.json({ error: 'No bhojanshala assigned to your account' }, { status: 404 })
  }

  const bhoj = await prisma.bhojanshala.findUnique({
    where:   { id: auth.user.bhojanshalaId },
    include: { admins: true },
  })

  if (!bhoj) return NextResponse.json({ error: 'Bhojanshala not found' }, { status: 404 })

  return NextResponse.json({ data: serializeBhojanshala(bhoj) })
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminRole(request)
  if (isAuthError(auth)) return auth

  if (!auth.user.bhojanshalaId) {
    return NextResponse.json({ error: 'No bhojanshala assigned to your account' }, { status: 404 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Admins can only update a subset of fields (not isActive, not admin assignment)
  const allowed = [
    'phone', 'description', 'addressEnglish', 'addressGujarati',
    'tiffinAvailable', 'tiffinType', 'tiffinNotes',
    'dharamshalaAvailable', 'parking', 'washroom', 'drinkingWater',
    'templeNearby', 'familyFriendly', 'wheelchairAccessible',
    'noticeEnglish', 'noticeGujarati',
  ]
  const data: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) data[key] = body[key]
  }

  const updated = await prisma.bhojanshala.update({
    where:   { id: auth.user.bhojanshalaId },
    data,
    include: { admins: true },
  })

  await log({
    userId:        auth.user.id,
    bhojanshalaId: auth.user.bhojanshalaId,
    action:        'Updated Bhojanshala Info',
    description:   `Updated ${updated.nameEnglish} details`,
  })

  return NextResponse.json({ data: serializeBhojanshala(updated) })
}
