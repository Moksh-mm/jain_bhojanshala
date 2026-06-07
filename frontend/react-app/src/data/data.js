/* ============================================================
   Jain Bhojanshala Finder — bilingual layer + API helpers
   ============================================================ */

// ---- master food list ----
export const FOODS = {
  rotli:   { gu: 'રોટલી',  en: 'Rotli',   emoji: '🫓' },
  dal:     { gu: 'દાળ',    en: 'Dal',     emoji: '🥣' },
  khichdi: { gu: 'ખીચડી',  en: 'Khichdi', emoji: '🍲' },
  kadhi:   { gu: 'કઢી',    en: 'Kadhi',   emoji: '🥘' },
  bhaat:   { gu: 'ભાત',    en: 'Rice',    emoji: '🍚' },
  shaak:   { gu: 'શાક',    en: 'Shaak',   emoji: '🥬' },
  chaas:   { gu: 'છાશ',    en: 'Chaas',   emoji: '🥛' },
  mithai:  { gu: 'મીઠાઈ',  en: 'Sweet',   emoji: '🍮' },
  thepla:  { gu: 'થેપલા',  en: 'Thepla',  emoji: '🫓' },
  dhokla:  { gu: 'ઢોકળા',  en: 'Dhokla',  emoji: '🟡' },
  tea:     { gu: 'ચા',     en: 'Tea',     emoji: '🍵' },
};

export const SMART_FOODS = ['rotli', 'dal', 'khichdi', 'kadhi', 'bhaat', 'shaak', 'chaas', 'mithai'];

// ---- weekday labels (0 = Sun .. 6 = Sat) ----
export const WEEKDAYS = {
  short: {
    gu: ['રવિ', 'સોમ', 'મંગળ', 'બુધ', 'ગુરુ', 'શુક્ર', 'શનિ'],
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  },
  long: {
    gu: ['રવિવાર', 'સોમવાર', 'મંગળવાર', 'બુધવાર', 'ગુરુવાર', 'શુક્રવાર', 'શનિવાર'],
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
};

// ---- time helpers ----
export function timeStrToMin(str) {
  if (!str) return null;
  const [h, m] = str.split(':').map(Number);
  return h * 60 + m;
}

export function formatTimeStr(str) {
  if (!str) return '';
  const [h, m] = str.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ap}`;
}

export function formatMealTime(meal) {
  if (!meal?.startTime) return '';
  return `${formatTimeStr(meal.startTime)} - ${formatTimeStr(meal.endTime)}`;
}

function nowMin() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

// ---- status from API todayMeals (PublicDayAvailability) ----
export function computeStatus(todayMeals) {
  if (!todayMeals || todayMeals.isClosed) return 'closed';
  const enabled = [todayMeals.navkarshi, todayMeals.lunch, todayMeals.chovihar]
    .filter(m => m?.enabled).length;
  if (enabled === 0) return 'closed';
  if (enabled < 3)   return 'partial';
  return 'open';
}

// ---- food helpers (API format) ----
export function servesTodayFood(_bhoj, _foodKey) {
  // Food item tracking removed from new availability system
  return false;
}

export function foodCountsForList(list) {
  const out = {};
  for (const f of SMART_FOODS) out[f] = 0;
  for (const b of list) for (const f of SMART_FOODS) if (servesTodayFood(b, f)) out[f]++;
  return out;
}

// ---- bhojanshala field helpers (API → display) ----
export function bhojName(b, lang)    { return lang === 'gu' ? b.nameGujarati    : b.nameEnglish;    }
export function bhojArea(b, lang)    { return lang === 'gu' ? (b.areaGujarati    || b.areaEnglish)    : b.areaEnglish;    }
export function bhojCity(b, lang)    { return lang === 'gu' ? (b.cityGujarati    || b.cityEnglish)    : b.cityEnglish;    }
export function bhojAddress(b, lang) { return lang === 'gu' ? (b.addressGujarati || b.addressEnglish) : b.addressEnglish; }
export function bhojNotice(b, lang)  {
  const n = lang === 'gu' ? b.noticeGujarati : b.noticeEnglish;
  return n || null;
}

// Convert API facilities object → string[] for Facility component
export function bhojFacilities(b) {
  const f = b.facilities || {};
  const out = [];
  if (f.parking)              out.push('parking');
  if (f.drinkingWater)        out.push('water');
  if (f.boilWater)            out.push('boilWater');
  if (f.washroom)             out.push('washroom');
  if (f.dharamshalaAvailable) out.push('dharamshala');
  if (f.templeNearby)         out.push('temple');
  if (f.familyFriendly)       out.push('family');
  if (f.wheelchairAccessible) out.push('wheelchair');
  if (f.ekashnu)              out.push('ekashnu');
  if (f.biaasanu)             out.push('biaasanu');
  if (f.ambil)                out.push('ambil');
  if (f.tirth)                out.push('tirth');
  if (f.upashray)             out.push('upashray');
  return out;
}

// Min price from todayMeals (PublicDayAvailability)
export function minPriceToday(bhoj) {
  const tm = bhoj.todayMeals;
  if (!tm || tm.isClosed) return Infinity;
  const prices = [tm.navkarshi, tm.lunch, tm.chovihar]
    .filter(m => m?.enabled && m.price != null)
    .map(m => m.price);
  return prices.length ? Math.min(...prices) : Infinity;
}

// nextOpenInfo from a 7-day availability array (PublicDayAvailability[])
export function nextOpenInfo(availability, fromIdx, lang) {
  if (!availability?.length) return null;
  for (let i = 1; i < availability.length; i++) {
    const day = availability[(fromIdx + i) % availability.length];
    if (!day || day.isClosed) continue;
    const meals = [day.navkarshi, day.lunch, day.chovihar]
      .filter(m => m?.enabled && m.startTime)
      .sort((a, b) => timeStrToMin(a.startTime) - timeStrToMin(b.startTime));
    if (meals.length) {
      const dow = new Date(day.date + 'T00:00:00Z').getUTCDay();
      return `${WEEKDAYS.long[lang][dow]} · ${formatTimeStr(meals[0].startTime)}`;
    }
  }
  return null;
}

// ---- UI string dictionary ----
export const T = {
  appName:      { gu: 'જૈન ભોજનશાળા શોધો', en: 'Find Jain Bhojanshala' },
  adminLogin:   { gu: 'એડમિન', en: 'Admin' },
  heroTitle:    { gu: 'તમારા નજીકની જૈન ભોજનશાળા શોધો', en: 'Find a Jain Bhojanshala near you' },
  heroSub:      { gu: 'સમય, સુવિધા અને સેવા સાથે નજીકની ભોજનશાળા શોધો.', en: 'Discover nearby bhojanshalas with timings, facilities and services.' },
  searchCity:   { gu: 'શહેર શોધો', en: 'Search city' },
  useLocation:  { gu: 'વર્તમાન સ્થાન વાપરો', en: 'Use current location' },
  search:       { gu: 'શોધો', en: 'Search' },
  quickFilters: { gu: 'ઝડપી ફિલ્ટર', en: 'Quick filters' },
  availTitle:   { gu: 'આજે શું ઉપલબ્ધ છે?', en: 'Available today' },
  availSub:     { gu: 'નવકારشی, બпोре અне ચovihaar ni uplabdhata', en: 'Navkarshi, Lunch and Chovihar availability' },
  resultsNear:  { gu: 'ભોજનશાળાઓ', en: 'Bhojanshalas' },
  sortBy:       { gu: 'ક્રમ', en: 'Sort' },
  clear:        { gu: 'સાફ કરો', en: 'Clear' },
  open:         { gu: 'ખુલ્લું', en: 'Open' },
  partial:      { gu: 'આંશિક ખુલ્લું', en: 'Partially open' },
  soon:         { gu: 'થોડીવારમાં', en: 'Opening soon' },
  closed:       { gu: 'બંધ', en: 'Closed' },
  closedToday:  { gu: 'આજે બંધ', en: 'Closed today' },
  navkarshi:    { gu: 'નવકારશી', en: 'Navkarshi' },
  lunch:        { gu: 'બપોરે', en: 'Lunch' },
  chovihar:     { gu: 'ચોવિહાર', en: 'Chovihar' },
  breakfast:    { gu: 'નવકારશી', en: 'Navkarshi' },
  dinner:       { gu: 'ચોવિહાર', en: 'Chovihar' },
  free:         { gu: 'નિ:શુલ્ક', en: 'Free' },
  notAvail:     { gu: 'ઉપલબ્ધ નથી', en: 'Not available' },
  directions:   { gu: 'દિશા', en: 'Directions' },
  call:         { gu: 'કૉલ', en: 'Call' },
  viewDetails:  { gu: 'વિગતો', en: 'View details' },
  share:        { gu: 'શેર', en: 'Share' },
  todaysMenu:   { gu: 'આજનું મેનૂ', en: "Today's menu" },
  sevenDay:     { gu: '7 દિવસનો સમય', en: '7-day timeline' },
  nextOpen:     { gu: 'આગલું ખુલશે', en: 'Next open' },
  noMeals:      { gu: 'આજે કોઈ ભોજન ઉપલબ્ધ નથી.', en: 'No meals available today.' },
  tiffinTitle:  { gu: 'ટિફિન સેવા', en: 'Tiffin service' },
  tiffinOwn:    { gu: 'પોતાનું ટિફિન લાવો', en: 'Bring your own tiffin' },
  tiffinProv:   { gu: 'કન્ટેનર પૂરા પાડવામાં આવે છે', en: 'Containers provided' },
  tiffinNo:     { gu: 'ટિફિન સેવા ઉપલબ્ધ નથી', en: 'Tiffin service not available' },
  facilities:   { gu: 'સુવિધાઓ', en: 'Facilities' },
  notice:       { gu: 'વિશેષ સૂચના', en: 'Special notice' },
  lastUpdated:  { gu: 'છેલ્લે અપડેટ', en: 'Last updated' },
  updatedBy:    { gu: 'દ્વારા અપડેટ', en: 'Updated by' },
  admin:        { gu: 'ભોજનશાળા એડમિન', en: 'Bhojanshala admin' },
  needHelp:     { gu: 'મદદ જોઈએ છે?', en: 'Need help?' },
  whatsapp:     { gu: 'વ્હોટ્સએપ', en: 'WhatsApp' },
  email:        { gu: 'ઈમેઈલ', en: 'Email' },
  suggest:      { gu: 'નવી ભોજનશાળા સૂચવો', en: 'Suggest a bhojanshala' },
  about:        { gu: 'વિશે', en: 'About' },
  contact:      { gu: 'સંપર્ક', en: 'Contact' },
  privacy:      { gu: 'ગોપનીયતા', en: 'Privacy' },
  madeWith:     { gu: 'જૈન સમુદાય માટે ❤️ થી બનાવેલ', en: 'Made with ❤️ for the Jain community' },
  navHome:      { gu: 'શોધો', en: 'Find' },
  navMap:       { gu: 'નકશો', en: 'Map' },
  navSaved:     { gu: 'સાચવેલ', en: 'Saved' },
  navHelp:      { gu: 'મદદ', en: 'Help' },
  reviews:      { gu: 'સમીક્ષાઓ', en: 'reviews' },
  km:           { gu: 'કિમી', en: 'km' },
  perPerson:    { gu: '/ વ્યક્તિ', en: '/ person' },
  adminPanel:   { gu: 'એડમિન પેનલ', en: 'Admin panel' },
  login:        { gu: 'લૉગિન', en: 'Login' },
  logout:       { gu: 'લૉગ આઉટ', en: 'Logout' },
  username:     { gu: 'વપરાશકર્તા નામ', en: 'Username' },
  password:     { gu: 'પાસવર્ડ', en: 'Password' },
  secureLogin:  { gu: 'સુરક્ષિત એડમિન લૉગિન', en: 'Secure admin login' },
  selectDay:    { gu: 'દિવસ પસંદ કરો', en: 'Select day' },
  closedAllDay: { gu: 'આખો દિવસ બંધ', en: 'Closed entire day' },
  available:    { gu: 'ઉપલબ્ધ', en: 'Available' },
  timeLabel:    { gu: 'સમય', en: 'Time' },
  priceLabel:   { gu: 'ભાવ (₹)', en: 'Price (₹)' },
  menuLabel:    { gu: 'મેનૂ', en: 'Menu' },
  saveChanges:  { gu: 'ફેરફાર સાચવો', en: 'Save changes' },
  saved:        { gu: 'સાચવાઈ ગયું ✓', en: 'Saved ✓' },
  manageTitle:  { gu: 'ભોજનશાળા સંચાલન', en: 'Manage bhojanshala' },
  editTimeline: { gu: '7 દિવસનો સમય સંપાદિત કરો', en: 'Edit 7-day timeline' },
  photos:       { gu: 'ફોટા', en: 'Photos' },
  backHome:     { gu: 'હોમ પર પાછા', en: 'Back to app' },
  loading:      { gu: 'લોડ થઈ રહ્યું છે...', en: 'Loading...' },
  noResults:    { gu: 'કોઈ ભોજનશાળા મળી નથી', en: 'No bhojanshalas found' },
  noData:       { gu: 'ડેટા ઉપલબ્ધ નથી', en: 'No data available' },
};

export const tr = (obj, lang) => (obj ? (obj[lang] != null ? obj[lang] : obj.gu) : '');
export const L  = (key, lang) => tr(T[key], lang);
