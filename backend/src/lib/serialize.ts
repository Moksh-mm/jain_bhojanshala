import type {
  Bhojanshala, User, WeeklySchedule, Meal, FoodItem, ActivityLog,
} from '@prisma/client'
import type { ApiBhojanshala, ApiUser, ApiDaySchedule, ApiMeal, ApiActivityLog } from '@/types'

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_LONG  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type BhojanshalaWithAdmin = Bhojanshala & {
  admins?: User[]
}

export function serializeBhojanshala(b: BhojanshalaWithAdmin): ApiBhojanshala {
  const admin = b.admins?.[0] ?? null
  return {
    id:            b.id,
    nameEnglish:   b.nameEnglish,
    nameGujarati:  b.nameGujarati,
    areaEnglish:   b.areaEnglish,
    areaGujarati:  b.areaGujarati,
    cityEnglish:   b.cityEnglish,
    cityGujarati:  b.cityGujarati,
    addressEnglish:  b.addressEnglish,
    addressGujarati: b.addressGujarati,
    phone:         b.phone,
    description:   b.description,
    coverImage:    b.coverImage,
    images:        b.images,
    rating:        b.rating,
    reviewCount:   b.reviewCount,
    facilities: {
      parking:              b.parking,
      washroom:             b.washroom,
      drinkingWater:        b.drinkingWater,
      dharamshalaAvailable: b.dharamshalaAvailable,
      templeNearby:         b.templeNearby,
      familyFriendly:       b.familyFriendly,
      wheelchairAccessible: b.wheelchairAccessible,
    },
    tiffin: {
      available: b.tiffinAvailable,
      type:      b.tiffinType ?? null,
      notes:     b.tiffinNotes ?? null,
    },
    noticeEnglish:  b.noticeEnglish,
    noticeGujarati: b.noticeGujarati,
    isActive:      b.isActive,
    admin:         admin ? { id: admin.id, name: admin.name } : null,
    createdAt:     b.createdAt.toISOString(),
    updatedAt:     b.updatedAt.toISOString(),
  }
}

export function serializeUser(u: User & { bhojanshala?: { id: string; nameEnglish: string; cityEnglish: string } | null }): ApiUser {
  return {
    id:            u.id,
    name:          u.name,
    email:         u.email,
    phone:         u.phone ?? null,
    role:          u.role,
    isActive:      u.isActive,
    bhojanshalaId: u.bhojanshalaId ?? null,
    bhojanshala:   u.bhojanshala ?? null,
    createdAt:     u.createdAt.toISOString(),
    updatedAt:     u.updatedAt.toISOString(),
  }
}

type ScheduleWithMeals = WeeklySchedule & {
  meals: (Meal & { foodItems: FoodItem[] })[]
}

function serializeMeal(meal: (Meal & { foodItems: FoodItem[] }) | undefined): ApiMeal | null {
  if (!meal) return null
  return {
    available: meal.available,
    startTime: meal.startTime,
    endTime:   meal.endTime,
    price:     meal.price,
    items:     meal.foodItems.map(fi => fi.name),
  }
}

export function buildTimeline(
  schedules: ScheduleWithMeals[],
  daysCount = 7,
): ApiDaySchedule[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  return Array.from({ length: daysCount }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const dow     = d.getDay()

    const schedule = schedules.find(
      s => s.date.toISOString().split('T')[0] === dateStr,
    )

    return {
      date:          dateStr,
      dayOfWeek:     dow,
      dayNameShort:  DAY_SHORT[dow],
      dayNameLong:   DAY_LONG[dow],
      isToday:       dateStr === todayStr,
      isClosed:      schedule?.isClosed ?? false,
      specialNotice: schedule?.specialNotice ?? null,
      meals: {
        breakfast: serializeMeal(schedule?.meals.find(m => m.mealType === 'BREAKFAST')),
        lunch:     serializeMeal(schedule?.meals.find(m => m.mealType === 'LUNCH')),
        dinner:    serializeMeal(schedule?.meals.find(m => m.mealType === 'DINNER')),
      },
    }
  })
}

export function serializeScheduleBasic(
  schedule: ScheduleWithMeals,
): { isClosed: boolean; specialNotice: string | null; meals: { breakfast: ApiMeal | null; lunch: ApiMeal | null; dinner: ApiMeal | null } } {
  return {
    isClosed:      schedule.isClosed,
    specialNotice: schedule.specialNotice ?? null,
    meals: {
      breakfast: serializeMeal(schedule.meals.find(m => m.mealType === 'BREAKFAST')),
      lunch:     serializeMeal(schedule.meals.find(m => m.mealType === 'LUNCH')),
      dinner:    serializeMeal(schedule.meals.find(m => m.mealType === 'DINNER')),
    },
  }
}

export function serializeLog(
  log: ActivityLog & {
    user: Pick<User, 'id' | 'name' | 'role'>
    bhojanshala: Pick<Bhojanshala, 'id' | 'nameEnglish'> | null
  },
): ApiActivityLog {
  return {
    id:          log.id,
    action:      log.action,
    description: log.description,
    createdAt:   log.createdAt.toISOString(),
    user: {
      id:   log.user.id,
      name: log.user.name,
      role: log.user.role,
    },
    bhojanshala: log.bhojanshala
      ? { id: log.bhojanshala.id, nameEnglish: log.bhojanshala.nameEnglish }
      : null,
  }
}
