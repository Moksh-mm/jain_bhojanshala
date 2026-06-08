import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  serializePublicBhojanshala,
  computeTodayMeals,
  fallbackMeals,
} from '@/lib/publicSerialize'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const city    = searchParams.get('city')
  const active  = searchParams.get('active') !== 'false'
  const search  = searchParams.get('search') ?? ''
  const tiffin  = searchParams.get('tiffin') === 'true'
  const dharam  = searchParams.get('dharamshala') === 'true'

  // Show bhojanshala if it's active OR if it offers Ayambil Shala
  const where: Record<string, unknown> = {
    OR: [{ isActive: true }, { ayambilShalaEnabled: true }],
  }

  if (city)    where.cityEnglish        = { equals: city, mode: 'insensitive' }
  if (tiffin)  where.tiffinAvailable    = true
  if (dharam)  where.dharamshalaAvailable = true

  if (search) {
    // Can't have two OR keys — wrap visibility OR in AND so search OR can coexist
    where.AND = [
      { OR: where.OR as unknown[] },
      { OR: [
        { nameEnglish:  { contains: search, mode: 'insensitive' } },
        { nameGujarati: { contains: search, mode: 'insensitive' } },
        { cityEnglish:  { contains: search, mode: 'insensitive' } },
        { areaEnglish:  { contains: search, mode: 'insensitive' } },
      ]},
    ]
    delete where.OR
  }

  const bhojanshalas = await prisma.bhojanshala.findMany({
    where,
    orderBy: [{ cityEnglish: 'asc' }, { nameEnglish: 'asc' }],
  })

  const includeToday = searchParams.get('today') === 'true'
  if (!includeToday) {
    return NextResponse.json({ data: bhojanshalas.map(serializePublicBhojanshala) })
  }

  // Compute today's meals for each bhojanshala using AvailabilityCalendar
  const todayUTC = new Date()
  todayUTC.setUTCHours(0, 0, 0, 0)
  const todayStr = todayUTC.toISOString().split('T')[0]
  const todayDow = todayUTC.getUTCDay()
  const ids      = bhojanshalas.map(b => b.id)

  let entryMap = new Map<string, Record<string, any>>()
  let ruleMap  = new Map<string, Record<string, any>>()

  try {
    const [entries, rules] = await Promise.all([
      prisma.availabilityCalendar.findMany({
        where: { bhojanshalaId: { in: ids }, date: todayUTC },
      }),
      prisma.recurringRule.findMany({
        where: { bhojanshalaId: { in: ids }, dayOfWeek: todayDow },
      }),
    ])
    entryMap = new Map(entries.map(e => [e.bhojanshalaId, e]))
    ruleMap  = new Map(rules.map(r => [r.bhojanshalaId, r]))
  } catch {
    // Tables not yet migrated — fall back to bhojanshala-level fields below
  }

  return NextResponse.json({
    data: bhojanshalas.map(b => ({
      ...serializePublicBhojanshala(b),
      todayMeals: entryMap.size === 0 && ruleMap.size === 0
        ? fallbackMeals(b as any, todayStr)
        : computeTodayMeals(b as any, entryMap.get(b.id), ruleMap.get(b.id), todayStr),
    })),
  })
}
