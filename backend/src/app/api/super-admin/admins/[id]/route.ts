import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireSuperAdmin, isAuthError } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { serializeUser } from '@/lib/serialize'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Ctx) {
  const auth = await requireSuperAdmin(request)
  if (isAuthError(auth)) return auth

  const { id } = await params

  const admin = await prisma.user.findUnique({
    where: { id, role: 'ADMIN' },
    include: { bhojanshala: { select: { id: true, nameEnglish: true, cityEnglish: true } } },
  })

  if (!admin) return NextResponse.json({ error: 'Admin not found' }, { status: 404 })

  return NextResponse.json({ data: serializeUser(admin) })
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  const auth = await requireSuperAdmin(request)
  if (isAuthError(auth)) return auth

  const { id } = await params

  const existing = await prisma.user.findUnique({ where: { id, role: 'ADMIN' } })
  if (!existing) return NextResponse.json({ error: 'Admin not found' }, { status: 404 })

  let body: {
    name?: string
    phone?: string
    isActive?: boolean
    bhojanshalaId?: string | null
    password?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {}

  if (body.name !== undefined)       updateData.name     = body.name.trim()
  if (body.phone !== undefined)      updateData.phone    = body.phone?.trim() ?? null
  if (body.isActive !== undefined)   updateData.isActive = body.isActive

  // Reassign bhojanshala
  if (body.bhojanshalaId !== undefined) {
    if (body.bhojanshalaId) {
      // Remove anyone else currently assigned to that bhojanshala
      await prisma.user.updateMany({
        where: { bhojanshalaId: body.bhojanshalaId, role: 'ADMIN', id: { not: id } },
        data:  { bhojanshalaId: null },
      })
    }
    updateData.bhojanshalaId = body.bhojanshalaId
  }

  // Reset password
  if (body.password) {
    if (body.password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }
    updateData.passwordHash = await bcrypt.hash(body.password, 12)
  }

  const updated = await prisma.user.update({
    where: { id },
    data:  updateData,
    include: { bhojanshala: { select: { id: true, nameEnglish: true, cityEnglish: true } } },
  })

  await log({
    userId: auth.user.id,
    bhojanshalaId: updated.bhojanshalaId,
    action: 'Updated Admin',
    description: `Updated account for ${updated.name}`,
  })

  return NextResponse.json({ data: serializeUser(updated) })
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const auth = await requireSuperAdmin(request)
  if (isAuthError(auth)) return auth

  const { id } = await params

  const existing = await prisma.user.findUnique({ where: { id, role: 'ADMIN' } })
  if (!existing) return NextResponse.json({ error: 'Admin not found' }, { status: 404 })

  await prisma.user.delete({ where: { id } })

  await log({
    userId:      auth.user.id,
    action:      'Deleted Admin',
    description: `Deleted account for ${existing.name} (${existing.email})`,
  })

  return NextResponse.json({ message: 'Admin deleted successfully' })
}
