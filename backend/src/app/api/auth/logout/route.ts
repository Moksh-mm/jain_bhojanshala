import { NextResponse } from 'next/server'

// JWT is stateless — client is responsible for discarding the token.
// If you add a token blocklist (Redis), implement it here.
export async function POST() {
  return NextResponse.json({ message: 'Logged out successfully' })
}
