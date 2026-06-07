// Serialized API shapes (JSON over the wire)

export interface ApiClosedPeriod {
  id:        string
  reason:    string
  note:      string | null
  startDate: string
  endDate:   string
  createdAt: string
}

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
  state:           string | null
  pinCode:         string | null
  landmark:        string | null
  phone:           string | null
  contactPersonName: string | null
  alternateMobile: string | null
  whatsappNumber:  string | null
  email:           string | null
  website:         string | null
  description:     string | null
  coverImage:      string | null
  entranceImage:   string | null
  diningHallImage: string | null
  images:          string[]
  rating:          number
  reviewCount:     number
  slug:            string | null
  metaTitle:       string | null
  metaDescription: string | null
  openGraphImage:  string | null
  facilities: {
    parking:              boolean
    washroom:             boolean
    drinkingWater:        boolean
    boilWater:            boolean
    dharamshalaAvailable: boolean
    templeNearby:         boolean
    familyFriendly:       boolean
    wheelchairAccessible: boolean
    ekashnu:              boolean
    biaasanu:             boolean
    ambil:                boolean
    tirth:                boolean
    upashray:             boolean
    lift:                 boolean
    airConditioned:       boolean
  }
  tiffin: {
    available: boolean
    type:      string | null
    notes:     string | null
  }
  latitude:  number | null
  longitude: number | null
  navkarshi: { available: boolean; startTime: string | null; endTime: string | null; price: number }
  lunch:     { available: boolean; startTime: string | null; endTime: string | null; price: number }
  chovihar:  { available: boolean; startTime: string | null; endTime: string | null; price: number }
  dharamshala: {
    available:   boolean
    description: string | null
    latitude:    number | null
    longitude:   number | null
    photos:      string[]
  }
  derasar: {
    available:   boolean
    description: string | null
    latitude:    number | null
    longitude:   number | null
    photos:      string[]
  }
  noticeEnglish:  string | null
  noticeGujarati: string | null
  isActive:       boolean
  admin:          { id: string; name: string } | null
  closedPeriods:  ApiClosedPeriod[]
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
  state?:               string
  pinCode?:             string
  landmark?:            string
  latitude?:            number
  longitude?:           number
  phone?:               string
  contactPersonName?:   string
  alternateMobile?:     string
  whatsappNumber?:      string
  email?:               string
  website?:             string
  description?:         string
  coverImage?:          string
  entranceImage?:       string
  diningHallImage?:     string
  slug?:                string
  metaTitle?:           string
  metaDescription?:     string
  openGraphImage?:      string
  tiffinAvailable?:     boolean
  tiffinType?:          'OWN' | 'PROVIDED'
  tiffinNotes?:         string
  dharamshalaAvailable?: boolean
  parking?:              boolean
  washroom?:             boolean
  drinkingWater?:        boolean
  boilWater?:            boolean
  templeNearby?:         boolean
  familyFriendly?:       boolean
  wheelchairAccessible?: boolean
  ekashnu?:              boolean
  biaasanu?:             boolean
  ambil?:                boolean
  tirth?:                boolean
  upashray?:             boolean
  lift?:                 boolean
  airConditioned?:       boolean
  isActive?:             boolean
  // Inline admin creation (optional)
  adminName?:            string
  adminUsername?:        string
  adminPassword?:        string
  adminPhone?:           string
  adminEmail?:           string
}
