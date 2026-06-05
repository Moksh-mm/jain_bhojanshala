import type { Bhojanshala, User, WeeklySchedule, Meal, FoodItem } from '@prisma/client'

// ---- Serialized shapes returned by the API ----

export interface ApiBhojanshala {
  id:                   string
  nameEnglish:          string
  nameGujarati:         string
  areaEnglish:          string | null
  areaGujarati:         string | null
  cityEnglish:          string
  cityGujarati:         string | null
  addressEnglish:       string | null
  addressGujarati:      string | null
  phone:                string | null
  description:          string | null
  coverImage:           string | null
  images:               string[]
  rating:               number
  reviewCount:          number
  facilities: {
    parking:              boolean
    washroom:             boolean
    drinkingWater:        boolean
    dharamshalaAvailable: boolean
    templeNearby:         boolean
    familyFriendly:       boolean
    wheelchairAccessible: boolean
  }
  tiffin: {
    available: boolean
    type:      string | null
    notes:     string | null
  }
  noticeEnglish:  string | null
  noticeGujarati: string | null
  isActive:       boolean
  admin:          { id: string; name: string } | null
  createdAt:      string
  updatedAt:      string
}

export interface ApiMeal {
  available:  boolean
  startTime:  string | null
  endTime:    string | null
  price:      number
  items:      string[]   // food item name keys e.g. ['rotli', 'dal']
}

export interface ApiDaySchedule {
  date:          string           // 'YYYY-MM-DD'
  dayOfWeek:     number           // 0 = Sunday … 6 = Saturday
  dayNameShort:  string           // 'Sun', 'Mon', …
  dayNameLong:   string           // 'Sunday', 'Monday', …
  isToday:       boolean
  isClosed:      boolean
  specialNotice: string | null
  meals: {
    breakfast: ApiMeal | null
    lunch:     ApiMeal | null
    dinner:    ApiMeal | null
  }
}

export interface ApiUser {
  id:           string
  name:         string
  email:        string
  phone:        string | null
  role:         string
  isActive:     boolean
  bhojanshalaId: string | null
  bhojanshala?: { id: string; nameEnglish: string; cityEnglish: string } | null
  createdAt:    string
  updatedAt:    string
}

export interface ApiActivityLog {
  id:          string
  action:      string
  description: string | null
  createdAt:   string
  user: {
    id:   string
    name: string
    role: string
  }
  bhojanshala: {
    id:          string
    nameEnglish: string
  } | null
}

// ---- Request body types ----

export interface CreateBhojanshalaBody {
  nameGujarati:         string
  nameEnglish:          string
  areaGujarati?:        string
  areaEnglish?:         string
  cityEnglish:          string
  cityGujarati?:        string
  addressGujarati?:     string
  addressEnglish?:      string
  latitude?:            number
  longitude?:           number
  phone?:               string
  description?:         string
  tiffinAvailable?:     boolean
  tiffinType?:          'OWN' | 'PROVIDED'
  tiffinNotes?:         string
  dharamshalaAvailable?: boolean
  parking?:             boolean
  washroom?:            boolean
  drinkingWater?:       boolean
  templeNearby?:        boolean
  familyFriendly?:      boolean
  wheelchairAccessible?: boolean
}

export interface CreateAdminBody {
  name:          string
  email:         string
  phone?:        string
  password:      string
  bhojanshalaId?: string
}

export interface UpdateScheduleBody {
  date:          string   // 'YYYY-MM-DD'
  isClosed?:     boolean
  specialNotice?: string | null
}

export interface UpsertMealBody {
  date:      string
  mealType:  'BREAKFAST' | 'LUNCH' | 'DINNER'
  available?: boolean
  startTime?: string
  endTime?:   string
  price?:     number
  items?:     string[]
}
