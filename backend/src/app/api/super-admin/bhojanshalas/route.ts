import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin, isAuthError } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { serializeBhojanshala } from '@/lib/serialize'
import type { CreateBhojanshalaBody } from '@/types'

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request)
  if (isAuthError(auth)) return auth

  const bhojanshalas = await prisma.bhojanshala.findMany({
    orderBy: [{ cityEnglish: 'asc' }, { nameEnglish: 'asc' }],
    include: { admins: true },
  })

  return NextResponse.json({ data: bhojanshalas.map(serializeBhojanshala) })
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request)
  if (isAuthError(auth)) return auth

  let body: CreateBhojanshalaBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { nameEnglish, nameGujarati, cityEnglish } = body

  if (!nameEnglish?.trim()) return NextResponse.json({ error: 'English name is required' }, { status: 400 })
  if (!nameGujarati?.trim()) return NextResponse.json({ error: 'Gujarati name is required' }, { status: 400 })
  if (!cityEnglish?.trim()) return NextResponse.json({ error: 'City is required' }, { status: 400 })

  const bhoj = await prisma.bhojanshala.create({
    data: {
      nameEnglish:          nameEnglish.trim(),
      nameGujarati:         nameGujarati.trim(),
      areaEnglish:          body.areaEnglish?.trim()   ?? null,
      areaGujarati:         body.areaGujarati?.trim()  ?? null,
      cityEnglish:          cityEnglish.trim(),
      cityGujarati:         body.cityGujarati?.trim()  ?? null,
      addressEnglish:       body.addressEnglish?.trim() ?? null,
      addressGujarati:      body.addressGujarati?.trim() ?? null,
      latitude:             body.latitude  ?? null,
      longitude:            body.longitude ?? null,
      phone:                body.phone?.trim() ?? null,
      description:          body.description?.trim() ?? null,
      tiffinAvailable:      body.tiffinAvailable      ?? false,
      tiffinType:           body.tiffinType            ?? null,
      tiffinNotes:          body.tiffinNotes?.trim()   ?? null,
      dharamshalaAvailable: body.dharamshalaAvailable  ?? false,
      parking:              body.parking               ?? false,
      washroom:             body.washroom              ?? false,
      drinkingWater:        body.drinkingWater         ?? false,
      templeNearby:         body.templeNearby          ?? false,
      familyFriendly:       body.familyFriendly        ?? true,
      wheelchairAccessible: body.wheelchairAccessible  ?? false,
      isActive:             true,
    },
    include: { admins: true },
  })

  await log({
    userId:       auth.user.id,
    bhojanshalaId: bhoj.id,
    action:       'Created Bhojanshala',
    description:  `Created ${bhoj.nameEnglish} in ${bhoj.cityEnglish}`,
  })

  return NextResponse.json({ data: serializeBhojanshala(bhoj) }, { status: 201 })
}
