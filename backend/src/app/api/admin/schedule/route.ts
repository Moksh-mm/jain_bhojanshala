import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRole, isAuthError } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { buildTimeline } from '@/lib/serialize'

// GET /api/admin/schedule?days=7
export async function GET(request: NextRequest) {
  const auth = await requireAdminRole(request)
  if (isAuthError(auth)) return auth

  if (!auth.user.bhojanshalaId) {
    return NextResponse.json({ error: 'No bhojanshala assigned' }, { status: 404 })
  }

  const days = parseInt(new URL(request.url).searchParams.get('days') ?? '7')

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const until = new Date(today)
  until.setDate(until.getDate() + days)

  const schedules = await prisma.weeklySchedule.findMany({
    where: {
      bhojanshalaId: auth.user.bhojanshalaId,
      date: { gte: today, lt: until },
    },
    orderBy: { date: 'asc' },
    include: {
      meals: { include: { foodItems: true } },
    },
  })

  return NextResponse.json({ data: buildTimeline(schedules, days) })
}

// PUT /api/admin/schedule  — upsert a single day
export async function PUT(request: NextRequest) {
  const auth = await requireAdminRole(request)
  if (isAuthError(auth)) return auth

  if (!auth.user.bhojanshalaId) {
    return NextResponse.json({ error: 'No bhojanshala assigned' }, { status: 404 })
  }

  let body: {
    date: string           // ISO date: "2025-08-10"
    isClosed?: boolean
    noticeEnglish?: string
    noticeGujarati?: string
    meals?: Array<{
      mealType: string
      isActive: boolean
      startTime?: string   // "07:30"
      endTime?: string
      priceAdult?: number
      priceChild?: number
      foodItems?: string[] // ["rotli","dal","bhaat"]
    }>
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.date) return NextResponse.json({ error: 'date is required' }, { status: 400 })

  const date = new Date(body.date)
  date.setUTCHours(0, 0, 0, 0)

  // Upsert the schedule row
  const schedule = await prisma.weeklySchedule.upsert({
    where: { bhojanshalaId_date: { bhojanshalaId: auth.user.bhojanshalaId, date } },
    create: {
      bhojanshalaId:  auth.user.bhojanshalaId,
      date,
      isClosed:       body.isClosed       ?? false,
      noticeEnglish:  body.noticeEnglish  ?? null,
      noticeGujarati: body.noticeGujarati ?? null,
    },
    update: {
      isClosed:       body.isClosed,
      noticeEnglish:  body.noticeEnglish  ?? null,
      noticeGujarati: body.noticeGujarati ?? null,
    },
  })

  // Update meals
  if (body.meals) {
    for (const m of body.meals) {
      const meal = await prisma.meal.upsert({
        where: { scheduleId_mealType: { scheduleId: schedule.id, mealType: m.mealType as any } },
        create: {
          scheduleId:  schedule.id,
          mealType:    m.mealType as any,
          isActive:    m.isActive ?? true,
          startTime:   m.startTime  ?? null,
          endTime:     m.endTime    ?? null,
          priceAdult:  m.priceAdult  ?? null,
          priceChild:  m.priceChild  ?? null,
        },
        update: {
          isActive:   m.isActive ?? true,
          startTime:  m.startTime  ?? null,
          endTime:    m.endTime    ?? null,
          priceAdult: m.priceAdult  ?? null,
          priceChild: m.priceChild  ?? null,
        },
      })

      // Replace food items
      if (m.foodItems !== undefined) {
        await prisma.foodItem.deleteMany({ where: { mealId: meal.id } })
        if (m.foodItems.length > 0) {
          await prisma.foodItem.createMany({
            data: m.foodItems.map(name => ({ mealId: meal.id, name })),
          })
        }
      }
    }
  }

  await log({
    userId:        auth.user.id,
    bhojanshalaId: auth.user.bhojanshalaId,
    action:        'Updated Schedule',
    description:   `Updated schedule for ${body.date}`,
  })

  return NextResponse.json({ message: 'Schedule updated' })
}
