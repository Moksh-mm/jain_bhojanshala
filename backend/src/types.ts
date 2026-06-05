// Serialized API shapes (JSON over the wire)

export interface ApiBhojanshala {
  id:              string
  nameEnglish:     string
  nameGujarati:    string
  areaEnglish:     string | null
  areaGujarati:    string | null
  cityEnglish:     string
  cityGujarati:    string | null
  addressEnglish:  string | null
  addressGujarati: string | null
  phone:           string | null
  description:     string | null
  coverImage:      string | null
  images:          string[]
  rating:          number
  reviewCount:     number
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

export interface ApiUser {
  id:            string
  name:          string
  email:         string
  phone:         string | null
  role:          string
  isActive:      boolean
  bhojanshalaId: string | null
  bhojanshala:   { id: string; nameEnglish: string; cityEnglish: string } | null
  createdAt:     string
  updatedAt:     string
}

export interface ApiMeal {
  available:  boolean
  startTime:  string | null
  endTime:    string | null
  price:      number
  items:      string[]
}

export interface ApiDaySchedule {
  date:          string
  dayOfWeek:     number
  dayNameShort:  string
  dayNameLong:   string
  isToday:       boolean
  isClosed:      boolean
  specialNotice: string | null
  meals: {
    breakfast: ApiMeal | null
    lunch:     ApiMeal | null
    dinner:    ApiMeal | null
  }
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
  bhojanshala: { id: string; nameEnglish: string } | null
}

// Request body types

export interface CreateAdminBody {
  name:          string
  email:         string
  phone?:        string
  password:      string
  bhojanshalaId?: string
}

export interface CreateBhojanshalaBody {
  nameEnglish:          string
  nameGujarati:         string
  areaEnglish?:         string
  areaGujarati?:        string
  cityEnglish:          string
  cityGujarati?:        string
  addressEnglish?:      string
  addressGujarati?:     string
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
