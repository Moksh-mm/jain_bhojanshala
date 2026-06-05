import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRole, isAuthError } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { buildTimeline } from '@/lib/serialize'
import type { MealType } from '@prisma/client'

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
    include: { meals: { include: { foodItems: true } } },
  })

  return NextResponse.json({ data: buildTimeline(schedules, days) })
}

// PUT /api/admin/schedule  — upsert a single day's schedule + meals
export async function PUT(request: NextRequest) {
  const auth = await requireAdminRole(request)
  if (isAuthError(auth)) return auth

  if (!auth.user.bhojanshalaId) {
    return NextResponse.json({ error: 'No bhojanshala assigned' }, { status: 404 })
  }

  let body: {
    date:           string        // ISO date string: "2025-08-10"
    isClosed?:      boolean
    specialNotice?: string | null
    meals?: Array<{
      mealType:   MealType
      available?: boolean
      startTime?: string | null   // "07:30"
      endTime?:   string | null
      price?:     number
      foodItems?: string[]        // ["rotli","dal","bhaat"]
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

  const schedule = await prisma.weeklySchedule.upsert({
    where: {
      bhojanshalaId_date: { bhojanshalaId: auth.user.bhojanshalaId, date },
    },
    create: {
      bhojanshalaId:  auth.user.bhojanshalaId,
      date,
      isClosed:       body.isClosed       ?? false,
      specialNotice:  body.specialNotice  ?? null,
    },
    update: {
      isClosed:      body.isClosed      ?? false,
      specialNotice: body.specialNotice ?? null,
    },
  })

  if (body.meals) {
    for (const m of body.meals) {
      const meal = await prisma.meal.upsert({
        where: {
          scheduleId_mealType: { scheduleId: schedule.id, mealType: m.mealType },
        },
        create: {
          scheduleId: schedule.id,
          mealType:   m.mealType,
          available:  m.available  ?? true,
          startTime:  m.startTime  ?? null,
          endTime:    m.endTime    ?? null,
          price:      m.price      ?? 0,
        },
        update: {
          available: m.available  ?? true,
          startTime: m.startTime  ?? null,
          endTime:   m.endTime    ?? null,
          price:     m.price      ?? 0,
        },
      })

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
