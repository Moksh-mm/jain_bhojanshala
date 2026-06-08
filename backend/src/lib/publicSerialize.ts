import type { Bhojanshala } from '@prisma/client'
import { prisma } from './prisma'

// ─── Public-facing types (lean — no sensitive admin fields) ───────

export interface PublicMeal {
  enabled:   boolean
  startTime: string | null
  endTime:   string | null
  price:     number | null
}

export interface PublicDayAvailability {
  date:         string
  isClosed:     boolean
  specialNotice: string | null
  navkarshi:    PublicMeal
  ayambil:      PublicMeal
  lunch:        PublicMeal
  chovihar:     PublicMeal
}

// ─── Shared meal constants ────────────────────────────────────────

const OFF: PublicMeal = { enabled: false, startTime: null, endTime: null, price: null }
const ON:  PublicMeal = { enabled: true,  startTime: null, endTime: null, price: null }

// ─── Helpers ──────────────────────────────────────────────────────

function mapsUrl(lat: number | null | undefined, lng: number | null | undefined): string | null {
  if (lat == null || lng == null) return null
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

// ─── Fallback: use bhojanshala-level meal fields (old system) ─────

export function fallbackMeals(b: Bhojanshala, dateStr: string): PublicDayAvailability {
  return {
    date:         dateStr,
    isClosed:     false,
    specialNotice: null,
    navkarshi: b.navkarshiAvailable
      ? { enabled: true, startTime: b.navkarshiStartTime, endTime: b.navkarshiEndTime, price: b.navkarshiPrice }
      : OFF,
    ayambil: (b as any).ayambilShalaEnabled
      ? { enabled: true, startTime: (b as any).ayambilStartTime ?? null, endTime: (b as any).ayambilEndTime ?? null, price: (b as any).ayambilPrice ?? null }
      : OFF,
    lunch: b.lunchAvailable
      ? { enabled: true, startTime: b.lunchStartTime, endTime: b.lunchEndTime, price: b.lunchPrice }
      : OFF,
    chovihar: b.choviharAvailable
      ? { enabled: true, startTime: b.choviharStartTime, endTime: b.choviharEndTime, price: b.choviharPrice }
      : OFF,
  }
}

// ─── Compute today's meals from a single calendar entry or rule ───
// Used for batch list queries (no individual DB calls per bhojanshala)

export function computeTodayMeals(
  b:        Bhojanshala,
  entry:    Record<string, any> | undefined,
  rule:     Record<string, any> | undefined,
  todayStr: string,
): PublicDayAvailability {
  if (entry) {
    return {
      date:         todayStr,
      isClosed:     entry.isClosed,
      specialNotice: entry.specialNotice ?? null,
      navkarshi: { enabled: entry.navkarshiEnabled, startTime: entry.navkarshiStart, endTime: entry.navkarshiEnd, price: entry.navkarshiPrice },
      ayambil:   { enabled: entry.ayambilEnabled  ?? false, startTime: entry.ayambilStart ?? null, endTime: entry.ayambilEnd ?? null, price: entry.ayambilPrice ?? null },
      lunch:     { enabled: entry.lunchEnabled,     startTime: entry.lunchStart,     endTime: entry.lunchEnd,     price: entry.lunchPrice },
      chovihar:  { enabled: entry.choviharEnabled,  startTime: entry.choviharStart,  endTime: entry.choviharEnd,  price: entry.choviharPrice },
    }
  }
  if (rule) {
    return {
      date:         todayStr,
      isClosed:     rule.isClosed,
      specialNotice: null,
      navkarshi: rule.navkarshiEnabled ? ON : OFF,
      ayambil:   (rule.ayambilEnabled ?? true)  ? ON : OFF,
      lunch:     rule.lunchEnabled     ? ON : OFF,
      chovihar:  rule.choviharEnabled  ? ON : OFF,
    }
  }
  return fallbackMeals(b, todayStr)
}

// ─── Lean public serialiser (list view — no sensitive fields) ─────

export function serializePublicBhojanshala(b: Bhojanshala) {
  return {
    id:             b.id,
    nameGujarati:   b.nameGujarati,
    nameEnglish:    b.nameEnglish,
    areaGujarati:   b.areaGujarati    ?? null,
    areaEnglish:    b.areaEnglish     ?? null,
    cityGujarati:   b.cityGujarati    ?? null,
    cityEnglish:    b.cityEnglish,
    coverImage:     b.coverImage      ?? null,
    phone:          b.phone           ?? null,
    whatsappNumber: b.whatsappNumber  ?? null,
    directionsUrl:  mapsUrl(b.latitude, b.longitude),
    rating:         b.rating,
    reviewCount:    b.reviewCount,
    tiffin: {
      available: b.tiffinAvailable,
      type:      b.tiffinType ?? null,
    },
    facilities: {
      parking:              b.parking,
      washroom:             b.washroom,
      drinkingWater:        b.drinkingWater,
      boilWater:            b.boilWater,
      templeNearby:         b.templeNearby,
      familyFriendly:       b.familyFriendly,
      wheelchairAccessible: b.wheelchairAccessible,
      ekashnu:              b.ekashnu,
      biaasanu:             b.biaasanu,
      ambil:                b.ambil,
      tirth:                b.tirth,
      upashray:             b.upashray,
      dharamshalaAvailable: b.dharamshalaAvailable,
    },
    noticeGujarati:           b.noticeGujarati ?? null,
    dharamshalaAvailable:     b.dharamshalaAvailable,
    derasarAvailable:         b.derasarAvailable,
    ayambilShalaEnabled:      (b as any).ayambilShalaEnabled ?? false,
  }
}

// ─── Detail serialiser (adds address, images, dharamshala, derasar) ──

export function serializePublicBhojanshalaDetail(b: Bhojanshala) {
  return {
    ...serializePublicBhojanshala(b),
    addressGujarati: b.addressGujarati ?? null,
    addressEnglish:  b.addressEnglish  ?? null,
    entranceImage:   b.entranceImage   ?? null,
    diningHallImage: b.diningHallImage ?? null,
    images:          b.images,
    dharamshala: {
      available:    b.dharamshalaAvailable,
      description:  b.dharamshalaDescription ?? null,
      photos:       b.dharamshalaPhotos,
      directionsUrl: mapsUrl(b.dharamshalaLatitude, b.dharamshalaLongitude) ?? mapsUrl(b.latitude, b.longitude),
    },
    derasar: {
      available:    b.derasarAvailable,
      description:  b.derasarDescription ?? null,
      photos:       b.derasarPhotos,
      directionsUrl: mapsUrl(b.derasarLatitude, b.derasarLongitude) ?? mapsUrl(b.latitude, b.longitude),
    },
  }
}

// ─── 7-day availability from AvailabilityCalendar + RecurringRules ─

export async function buildPublicAvailability(
  b:    Bhojanshala,
  days: number,
): Promise<PublicDayAvailability[]> {
  const todayUTC = new Date()
  todayUTC.setUTCHours(0, 0, 0, 0)
  const until = new Date(todayUTC)
  until.setUTCDate(until.getUTCDate() + days)

  try {
    const [entries, rules] = await Promise.all([
      prisma.availabilityCalendar.findMany({
        where: { bhojanshalaId: b.id, date: { gte: todayUTC, lt: until } },
      }),
      prisma.recurringRule.findMany({
        where: { bhojanshalaId: b.id },
      }),
    ])

    const entryMap = new Map(entries.map(e => [toDateStr(e.date), e]))
    const ruleMap  = new Map(rules.map(r => [r.dayOfWeek, r]))

    return Array.from({ length: days }, (_, i) => {
      const d = new Date(todayUTC)
      d.setUTCDate(d.getUTCDate() + i)
      const dateStr = toDateStr(d)
      const dow     = d.getUTCDay()

      const entry = entryMap.get(dateStr)
      if (entry) {
        return {
          date:         dateStr,
          isClosed:     entry.isClosed,
          specialNotice: entry.specialNotice ?? null,
          navkarshi: { enabled: entry.navkarshiEnabled, startTime: entry.navkarshiStart, endTime: entry.navkarshiEnd, price: entry.navkarshiPrice },
          ayambil:   { enabled: (entry as any).ayambilEnabled ?? false, startTime: (entry as any).ayambilStart ?? null, endTime: (entry as any).ayambilEnd ?? null, price: (entry as any).ayambilPrice ?? null },
          lunch:     { enabled: entry.lunchEnabled,     startTime: entry.lunchStart,     endTime: entry.lunchEnd,     price: entry.lunchPrice },
          chovihar:  { enabled: entry.choviharEnabled,  startTime: entry.choviharStart,  endTime: entry.choviharEnd,  price: entry.choviharPrice },
        }
      }

      const rule = ruleMap.get(dow)
      if (rule) {
        return {
          date:         dateStr,
          isClosed:     rule.isClosed,
          specialNotice: null,
          navkarshi: rule.navkarshiEnabled ? ON : OFF,
          ayambil:   ((rule as any).ayambilEnabled ?? true) ? ON : OFF,
          lunch:     rule.lunchEnabled     ? ON : OFF,
          chovihar:  rule.choviharEnabled  ? ON : OFF,
        }
      }

      return fallbackMeals(b, dateStr)
    })
  } catch {
    // Tables not yet migrated — fall back to bhojanshala-level meal fields
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(todayUTC)
      d.setUTCDate(d.getUTCDate() + i)
      return fallbackMeals(b, toDateStr(d))
    })
  }
}
