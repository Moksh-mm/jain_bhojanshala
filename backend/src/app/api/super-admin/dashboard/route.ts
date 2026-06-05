import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin, isAuthError } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request)
  if (isAuthError(auth)) return auth

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    totalBhojanshalas,
    activeBhojanshalas,
    disabledBhojanshalas,
    totalAdmins,
    activeAdmins,
    todayClosed,
    updatedToday,
    citiesResult,
    recentLogs,
  ] = await Promise.all([
    prisma.bhojanshala.count(),
    prisma.bhojanshala.count({ where: { isActive: true } }),
    prisma.bhojanshala.count({ where: { isActive: false } }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.user.count({ where: { role: 'ADMIN', isActive: true } }),
    prisma.weeklySchedule.count({
      where: { date: today, isClosed: true },
    }),
    prisma.bhojanshala.count({
      where: { updatedAt: { gte: today } },
    }),
    prisma.bhojanshala.findMany({
      where: { isActive: true },
      select: { cityEnglish: true },
    }),
    prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user:        { select: { id: true, name: true, role: true } },
        bhojanshala: { select: { id: true, nameEnglish: true } },
      },
    }),
  ])

  const uniqueCities = new Set(citiesResult.map(r => r.cityEnglish)).size

  return NextResponse.json({
    stats: {
      totalBhojanshalas,
      activeBhojanshalas,
      disabledBhojanshalas,
      totalAdmins,
      activeAdmins,
      closedToday:  todayClosed,
      updatedToday,
      uniqueCities,
    },
    recentActivity: recentLogs.map(log => ({
      id:          log.id,
      action:      log.action,
      description: log.description,
      createdAt:   log.createdAt.toISOString(),
      user:        log.user,
      bhojanshala: log.bhojanshala,
    })),
  })
}
