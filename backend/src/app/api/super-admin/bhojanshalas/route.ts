import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
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
    include: { admins: { select: { id: true, name: true } }, closedPeriods: true },
  })

  return NextResponse.json({ data: bhojanshalas.map(serializeBhojanshala) })
}

const BHOJANSHALA_FIELDS = [
  'nameEnglish', 'nameGujarati', 'areaEnglish', 'areaGujarati',
  'cityEnglish', 'cityGujarati', 'addressEnglish', 'addressGujarati',
  'state', 'pinCode', 'landmark', 'latitude', 'longitude',
  'phone', 'contactPersonName', 'alternateMobile', 'whatsappNumber', 'email', 'website',
  'description', 'coverImage', 'entranceImage', 'diningHallImage',
  'slug', 'metaTitle', 'metaDescription', 'openGraphImage',
  'tiffinAvailable', 'tiffinType', 'tiffinNotes',
  'dharamshalaAvailable', 'parking', 'washroom', 'drinkingWater', 'boilWater',
  'templeNearby', 'familyFriendly', 'wheelchairAccessible',
  'ekashnu', 'biaasanu', 'ambil', 'tirth', 'upashray', 'lift', 'airConditioned',
  'noticeEnglish', 'noticeGujarati', 'isActive',
] as const

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

  // Validate inline admin if provided
  if (body.adminName || body.adminUsername || body.adminPassword) {
    if (!body.adminName?.trim())     return NextResponse.json({ error: 'Admin name is required' }, { status: 400 })
    if (!body.adminUsername?.trim()) return NextResponse.json({ error: 'Admin username is required' }, { status: 400 })
    if (!body.adminPassword || body.adminPassword.length < 6)
      return NextResponse.json({ error: 'Admin password must be at least 6 characters' }, { status: 400 })

    const exists = await prisma.user.findUnique({ where: { email: body.adminUsername.trim() } })
    if (exists) return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
  }

  // Auto-generate slug if not provided
  const slug = body.slug?.trim() ||
    nameEnglish.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const result = await prisma.$transaction(async (tx) => {
    const bhoj = await tx.bhojanshala.create({
      data: {
        nameEnglish:          nameEnglish.trim(),
        nameGujarati:         nameGujarati.trim(),
        areaEnglish:          body.areaEnglish?.trim()        ?? null,
        areaGujarati:         body.areaGujarati?.trim()       ?? null,
        cityEnglish:          cityEnglish.trim(),
        cityGujarati:         body.cityGujarati?.trim()       ?? null,
        addressEnglish:       body.addressEnglish?.trim()     ?? null,
        addressGujarati:      body.addressGujarati?.trim()    ?? null,
        state:                body.state?.trim()              ?? null,
        pinCode:              body.pinCode?.trim()            ?? null,
        landmark:             body.landmark?.trim()           ?? null,
        latitude:             body.latitude                   ?? null,
        longitude:            body.longitude                  ?? null,
        phone:                body.phone?.trim()              ?? null,
        contactPersonName:    body.contactPersonName?.trim()  ?? null,
        alternateMobile:      body.alternateMobile?.trim()    ?? null,
        whatsappNumber:       body.whatsappNumber?.trim()     ?? null,
        email:                body.email?.trim()              ?? null,
        website:              body.website?.trim()            ?? null,
        description:          body.description?.trim()        ?? null,
        coverImage:           body.coverImage?.trim()         ?? null,
        entranceImage:        body.entranceImage?.trim()      ?? null,
        diningHallImage:      body.diningHallImage?.trim()    ?? null,
        slug,
        metaTitle:            body.metaTitle?.trim()          ?? null,
        metaDescription:      body.metaDescription?.trim()    ?? null,
        openGraphImage:       body.openGraphImage?.trim()     ?? null,
        tiffinAvailable:      body.tiffinAvailable            ?? false,
        tiffinType:           body.tiffinType                 ?? null,
        tiffinNotes:          body.tiffinNotes?.trim()        ?? null,
        dharamshalaAvailable: body.dharamshalaAvailable       ?? false,
        parking:              body.parking                    ?? false,
        washroom:             body.washroom                   ?? false,
        drinkingWater:        body.drinkingWater              ?? false,
        boilWater:            body.boilWater                  ?? false,
        templeNearby:         body.templeNearby               ?? false,
        familyFriendly:       body.familyFriendly             ?? true,
        wheelchairAccessible: body.wheelchairAccessible        ?? false,
        ekashnu:              body.ekashnu                    ?? false,
        biaasanu:             body.biaasanu                   ?? false,
        ambil:                body.ambil                      ?? false,
        tirth:                body.tirth                      ?? false,
        upashray:             body.upashray                   ?? false,
        lift:                 body.lift                       ?? false,
        airConditioned:       body.airConditioned             ?? false,
        noticeEnglish:        body.noticeEnglish?.trim()      ?? null,
        noticeGujarati:       body.noticeGujarati?.trim()     ?? null,
        isActive:             body.isActive                   ?? true,
      },
      include: { admins: { select: { id: true, name: true } }, closedPeriods: true },
    })

    let admin = null
    if (body.adminName && body.adminUsername && body.adminPassword) {
      const hash = await bcrypt.hash(body.adminPassword, 12)
      admin = await tx.user.create({
        data: {
          name:         body.adminName.trim(),
          email:        body.adminUsername.trim(),
          phone:        body.adminPhone?.trim()  ?? null,
          passwordHash: hash,
          role:         'ADMIN',
          isActive:     true,
          bhojanshalaId: bhoj.id,
        },
      })
    }

    return { bhoj, admin }
  })

  await log({
    userId:        auth.user.id,
    bhojanshalaId: result.bhoj.id,
    action:        'Created Bhojanshala',
    description:   `Created ${result.bhoj.nameEnglish} in ${result.bhoj.cityEnglish}${result.admin ? ` with admin ${result.admin.name}` : ''}`,
  })

  // Re-fetch to include new admin in admins list
  const fresh = await prisma.bhojanshala.findUnique({
    where:   { id: result.bhoj.id },
    include: { admins: { select: { id: true, name: true } }, closedPeriods: true },
  })

  return NextResponse.json({ data: serializeBhojanshala(fresh!) }, { status: 201 })
}
