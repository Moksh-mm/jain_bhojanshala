import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin, isAuthError } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { serializeBhojanshala } from '@/lib/serialize'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Ctx) {
  const auth = await requireSuperAdmin(request)
  if (isAuthError(auth)) return auth

  const { id } = await params
  const bhoj = await prisma.bhojanshala.findUnique({
    where:   { id },
    include: { admins: true },
  })

  if (!bhoj) return NextResponse.json({ error: 'Bhojanshala not found' }, { status: 404 })
  return NextResponse.json({ data: serializeBhojanshala(bhoj) })
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  const auth = await requireSuperAdmin(request)
  if (isAuthError(auth)) return auth

  const { id } = await params

  const existing = await prisma.bhojanshala.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Bhojanshala not found' }, { status: 404 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Only pick allowed fields for update
  const allowed = [
    'nameEnglish', 'nameGujarati', 'areaEnglish', 'areaGujarati',
    'cityEnglish', 'cityGujarati', 'addressEnglish', 'addressGujarati',
    'latitude', 'longitude', 'phone', 'description',
    'tiffinAvailable', 'tiffinType', 'tiffinNotes',
    'dharamshalaAvailable', 'parking', 'washroom', 'drinkingWater',
    'templeNearby', 'familyFriendly', 'wheelchairAccessible',
    'noticeEnglish', 'noticeGujarati', 'isActive',
  ]
  const data: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) data[key] = body[key]
  }

  const updated = await prisma.bhojanshala.update({
    where:   { id },
    data,
    include: { admins: true },
  })

  await log({
    userId:        auth.user.id,
    bhojanshalaId: id,
    action:        'Updated Bhojanshala',
    description:   `Updated ${updated.nameEnglish}`,
  })

  return NextResponse.json({ data: serializeBhojanshala(updated) })
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const auth = await requireSuperAdmin(request)
  if (isAuthError(auth)) return auth

  const { id } = await params

  const existing = await prisma.bhojanshala.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Bhojanshala not found' }, { status: 404 })

  await prisma.bhojanshala.delete({ where: { id } })

  await log({
    userId:  auth.user.id,
    action:  'Deleted Bhojanshala',
    description: `Deleted ${existing.nameEnglish} (${id})`,
  })

  return NextResponse.json({ message: 'Bhojanshala deleted successfully' })
}
