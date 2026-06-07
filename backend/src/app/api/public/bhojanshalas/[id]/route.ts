import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { serializePublicBhojanshalaDetail, buildPublicAvailability } from '@/lib/publicSerialize'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Ctx) {
  const { id } = await params

  const bhoj = await prisma.bhojanshala.findUnique({
    where: { id, isActive: true },
  })

  if (!bhoj) return NextResponse.json({ error: 'Bhojanshala not found' }, { status: 404 })

  const days = parseInt(new URL(request.url).searchParams.get('days') ?? '7')

  const availability = await buildPublicAvailability(bhoj as any, days)

  return NextResponse.json({
    data:         serializePublicBhojanshalaDetail(bhoj as any),
    availability,
  })
}
