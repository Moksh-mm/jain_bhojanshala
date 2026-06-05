import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './prisma'
import { verifyAccessToken } from './jwt'
import type { User } from '@prisma/client'

export type AuthSuccess = { user: User }

/** Returns {user} on success, or a NextResponse error on failure. */
export async function requireAuth(
  request: NextRequest,
): Promise<AuthSuccess | NextResponse> {
  const header = request.headers.get('authorization')
  const token  = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized — no token provided' }, { status: 401 })
  }

  let payload
  try {
    payload = verifyAccessToken(token)
  } catch {
    return NextResponse.json({ error: 'Unauthorized — invalid or expired token' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized — user not found' }, { status: 401 })
  }
  if (!user.isActive) {
    return NextResponse.json({ error: 'Forbidden — account is disabled' }, { status: 403 })
  }

  return { user }
}

/** Requires SUPER_ADMIN role. */
export async function requireSuperAdmin(
  request: NextRequest,
): Promise<AuthSuccess | NextResponse> {
  const result = await requireAuth(request)
  if (result instanceof NextResponse) return result

  if (result.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden — Super Admin only' }, { status: 403 })
  }

  return result
}

/** Requires ADMIN or SUPER_ADMIN role. */
export async function requireAdminRole(
  request: NextRequest,
): Promise<AuthSuccess | NextResponse> {
  const result = await requireAuth(request)
  if (result instanceof NextResponse) return result

  if (result.user.role !== 'ADMIN' && result.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden — Admin only' }, { status: 403 })
  }

  return result
}

/**
 * Requires ADMIN role AND verifies the admin owns the requested bhojanshala.
 * Super admins bypass this check.
 */
export async function requireBhojanshalaAdmin(
  request: NextRequest,
  bhojanshalaId: string,
): Promise<AuthSuccess | NextResponse> {
  const result = await requireAuth(request)
  if (result instanceof NextResponse) return result

  // Super admin can access any bhojanshala
  if (result.user.role === 'SUPER_ADMIN') return result

  if (result.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (result.user.bhojanshalaId !== bhojanshalaId) {
    return NextResponse.json(
      { error: 'Forbidden — you do not manage this bhojanshala' },
      { status: 403 },
    )
  }

  return result
}

/** Type guard: tells TypeScript whether auth returned an error. */
export function isAuthError(r: AuthSuccess | NextResponse): r is NextResponse {
  return r instanceof NextResponse
}
