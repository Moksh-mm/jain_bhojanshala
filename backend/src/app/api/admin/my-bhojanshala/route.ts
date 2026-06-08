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
    include: { admins: { select: { id: true, name: true } }, closedPeriods: true },
  })

  if (!bhoj) return NextResponse.json({ error: 'Bhojanshala not found' }, { status: 404 })

  return NextResponse.json({ data: serializeBhojanshala(bhoj) })
}

const ADMIN_ALLOWED = [
  // Basic
  'phone', 'description', 'addressEnglish', 'addressGujarati',
  'contactPersonName', 'alternateMobile', 'whatsappNumber', 'email', 'website',
  // Location
  'latitude', 'longitude',
  // Photos
  'coverImage', 'entranceImage', 'diningHallImage', 'images',
  // Meals
  'tiffinAvailable', 'tiffinType', 'tiffinNotes',
  'navkarshiAvailable', 'navkarshiStartTime', 'navkarshiEndTime', 'navkarshiPrice',
  'lunchAvailable', 'lunchStartTime', 'lunchEndTime', 'lunchPrice',
  'choviharAvailable', 'choviharStartTime', 'choviharEndTime', 'choviharPrice',
  'ayambilShalaEnabled', 'ayambilStartTime', 'ayambilEndTime', 'ayambilPrice',
  'ayambilLocationSameAsBhoj', 'ayambilLatitude', 'ayambilLongitude',
  // Facilities
  'dharamshalaAvailable', 'parking', 'washroom', 'drinkingWater', 'boilWater',
  'templeNearby', 'familyFriendly', 'wheelchairAccessible',
  'ekashnu', 'biaasanu', 'ambil', 'tirth', 'upashray', 'lift', 'airConditioned',
  // Dharamshala details
  'dharamshalaDescription', 'dharamshalaLatitude', 'dharamshalaLongitude', 'dharamshalaPhotos',
  // Derasar
  'derasarAvailable', 'derasarDescription', 'derasarLatitude', 'derasarLongitude', 'derasarPhotos',
  // Notice + visibility
  'noticeEnglish', 'noticeGujarati', 'isActive',
]

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

  const FLOAT_FIELDS = new Set(['latitude', 'longitude', 'dharamshalaLatitude', 'dharamshalaLongitude', 'derasarLatitude', 'derasarLongitude', 'ayambilLatitude', 'ayambilLongitude'])

  const data: Record<string, unknown> = {}
  for (const key of ADMIN_ALLOWED) {
    if (!(key in body)) continue
    if (FLOAT_FIELDS.has(key)) {
      const v = body[key]
      data[key] = (v === '' || v === null || v === undefined) ? null : parseFloat(String(v))
    } else {
      data[key] = body[key]
    }
  }

  let updated
  try {
    updated = await prisma.bhojanshala.update({
      where:   { id: auth.user.bhojanshalaId },
      data,
      include: { admins: { select: { id: true, name: true } }, closedPeriods: true },
    })
  } catch (err: unknown) {
    console.error('[my-bhojanshala PUT]', err)
    const msg = err instanceof Error ? err.message : 'Database error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  await log({
    userId:        auth.user.id,
    bhojanshalaId: auth.user.bhojanshalaId,
    action:        'Updated Bhojanshala Info',
    description:   `Updated ${updated.nameEnglish} details`,
  })

  return NextResponse.json({ data: serializeBhojanshala(updated) })
}
