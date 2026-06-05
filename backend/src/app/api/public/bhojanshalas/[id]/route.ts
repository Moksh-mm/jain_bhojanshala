import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { serializeBhojanshala, buildTimeline } from '@/lib/serialize'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Ctx) {
  const { id } = await params

  const bhoj = await prisma.bhojanshala.findUnique({
    where:   { id, isActive: true },
    include: { admins: { select: { id: true } } },
  })

  if (!bhoj) return NextResponse.json({ error: 'Bhojanshala not found' }, { status: 404 })

  const days = parseInt(new URL(request.url).searchParams.get('days') ?? '7')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const until = new Date(today)
  until.setDate(until.getDate() + days)

  const schedules = await prisma.weeklySchedule.findMany({
    where: { bhojanshalaId: id, date: { gte: today, lt: until } },
    orderBy: { date: 'asc' },
    include: { meals: { include: { foodItems: true } } },
  })

  return NextResponse.json({
    data:     serializeBhojanshala(bhoj),
    timeline: buildTimeline(schedules, days),
  })
}
