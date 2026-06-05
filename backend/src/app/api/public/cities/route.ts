import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const rows = await prisma.bhojanshala.findMany({
    where:  { isActive: true },
    select: { cityEnglish: true, cityGujarati: true },
  })

  const seen = new Set<string>()
  const cities: { en: string; gu: string | null }[] = []
  for (const r of rows) {
    if (!seen.has(r.cityEnglish)) {
      seen.add(r.cityEnglish)
      cities.push({ en: r.cityEnglish, gu: r.cityGujarati })
    }
  }
  cities.sort((a, b) => a.en.localeCompare(b.en))

  return NextResponse.json({ data: cities })
}
