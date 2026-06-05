import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signAccessToken, signRefreshToken } from '@/lib/jwt'
import { serializeUser } from '@/lib/serialize'

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email: email.trim() } })

  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  if (!user.isActive) {
    return NextResponse.json({ error: 'Account is disabled. Contact Super Admin.' }, { status: 403 })
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatch) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const tokenPayload = { sub: user.id, role: user.role }
  const accessToken  = signAccessToken(tokenPayload)
  const refreshToken = signRefreshToken(tokenPayload)

  return NextResponse.json({
    accessToken,
    refreshToken,
    user: serializeUser(user),
  })
}
