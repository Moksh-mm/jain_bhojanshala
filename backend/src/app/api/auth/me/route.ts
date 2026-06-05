import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isAuthError } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { serializeUser } from '@/lib/serialize'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isAuthError(auth)) return auth

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    include: {
      bhojanshala: {
        select: { id: true, nameEnglish: true, cityEnglish: true },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ user: serializeUser(user) })
}
