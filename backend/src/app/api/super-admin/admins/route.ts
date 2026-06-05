import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireSuperAdmin, isAuthError } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { serializeUser } from '@/lib/serialize'
import type { CreateAdminBody } from '@/types'

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request)
  if (isAuthError(auth)) return auth

  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    orderBy: { createdAt: 'desc' },
    include: {
      bhojanshala: { select: { id: true, nameEnglish: true, cityEnglish: true } },
    },
  })

  return NextResponse.json({ data: admins.map(serializeUser) })
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request)
  if (isAuthError(auth)) return auth

  let body: CreateAdminBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { name, email, phone, password, bhojanshalaId } = body

  if (!name?.trim())   return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!email?.trim())  return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email: email.trim() } })
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
  }

  // If assigning to a bhojanshala, unassign any current admin for that bhojanshala
  if (bhojanshalaId) {
    await prisma.user.updateMany({
      where: { bhojanshalaId, role: 'ADMIN' },
      data:  { bhojanshalaId: null },
    })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const admin = await prisma.user.create({
    data: {
      name:          name.trim(),
      email:         email.trim(),
      phone:         phone?.trim() ?? null,
      passwordHash,
      role:          'ADMIN',
      isActive:      true,
      bhojanshalaId: bhojanshalaId ?? null,
    },
    include: { bhojanshala: { select: { id: true, nameEnglish: true, cityEnglish: true } } },
  })

  await log({
    userId: auth.user.id,
    bhojanshalaId: bhojanshalaId ?? null,
    action: 'Created Admin',
    description: `Created admin account for ${admin.name} (${admin.email})`,
  })

  return NextResponse.json({ data: serializeUser(admin) }, { status: 201 })
}
