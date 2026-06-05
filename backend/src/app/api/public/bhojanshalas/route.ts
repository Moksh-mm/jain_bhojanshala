import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { serializeBhojanshala } from '@/lib/serialize'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const city    = searchParams.get('city')
  const active  = searchParams.get('active') !== 'false'
  const search  = searchParams.get('search') ?? ''
  const tiffin  = searchParams.get('tiffin') === 'true'
  const dharam  = searchParams.get('dharamshala') === 'true'

  const where: Record<string, unknown> = { isActive: active }

  if (city) {
    where.cityEnglish = { equals: city, mode: 'insensitive' }
  }

  if (tiffin)  where.tiffinAvailable      = true
  if (dharam)  where.dharamshalaAvailable = true

  if (search) {
    where.OR = [
      { nameEnglish:  { contains: search, mode: 'insensitive' } },
      { nameGujarati: { contains: search, mode: 'insensitive' } },
      { cityEnglish:  { contains: search, mode: 'insensitive' } },
      { areaEnglish:  { contains: search, mode: 'insensitive' } },
    ]
  }

  const bhojanshalas = await prisma.bhojanshala.findMany({
    where,
    orderBy: [{ cityEnglish: 'asc' }, { nameEnglish: 'asc' }],
    include: { admins: { select: { id: true } } },
  })

  return NextResponse.json({ data: bhojanshalas.map(serializeBhojanshala) })
}
