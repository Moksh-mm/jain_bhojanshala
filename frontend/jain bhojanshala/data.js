/* ============================================================
   Jain Bhojanshala Finder — data + bilingual (GU/EN) layer
   Exposes on window: FOODS, BHOJ, WEEKDAYS, T, tr, L,
   computeStatus, foodCountsForDay, bhojServesFoodOnDay
   ============================================================ */
(function () {
  // ---- master food list (smart-filter surfaces the first 8) ----
  const FOODS = {
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
  // tags shown in the Smart Food Filter, in order
  const SMART_FOODS = ['rotli', 'dal', 'khichdi', 'kadhi', 'bhaat', 'shaak', 'chaas', 'mithai'];

  // ---- weekday labels (0 = Sun .. 6 = Sat) ----
  const WEEKDAYS = {
    short: {
      gu: ['રવિ', 'સોમ', 'મંગળ', 'બુધ', 'ગુરુ', 'શુક્ર', 'શનિ'],
      en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    },
    long: {
      gu: ['રવિવાર', 'સોમવાર', 'મંગળવાર', 'બુધવાર', 'ગુરુવાર', 'શુક્રવાર', 'શનિવાર'],
      en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    },
  };

  // ---- seeded RNG so generated weeks are deterministic + varied ----
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const m2t = (m) => {
    let h = Math.floor(m / 60), mm = m % 60;
    const ap = h >= 12 ? 'PM' : 'AM';
    let hh = h % 12; if (hh === 0) hh = 12;
    return `${hh}:${String(mm).padStart(2, '0')} ${ap}`;
  };

  function buildWeek(seed, base) {
    const rng = mulberry32(seed);
    const pick = (arr, n) => {
      const c = [...arr]; const out = [];
      for (let i = 0; i < n && c.length; i++) out.push(c.splice(Math.floor(rng() * c.length), 1)[0]);
      return out;
    };
    const bPool = ['rotli', 'thepla', 'shaak', 'tea', 'chaas', 'dhokla'];
    const lPool = ['dal', 'rotli', 'bhaat', 'shaak', 'kadhi', 'chaas', 'mithai'];
    const dPool = ['khichdi', 'kadhi', 'rotli', 'shaak', 'bhaat', 'dal'];
    const week = {};
    for (let d = 0; d < 7; d++) {
      if (rng() < 0.11) { week[d] = { closed: true }; continue; }
      const mk = (on, sm, em, price, pool, lo, hi) => on
        ? { available: true, sm, em, time: `${m2t(sm)} - ${m2t(em)}`, price, items: pick(pool, lo + Math.floor(rng() * (hi - lo + 1))) }
        : { available: false };
      week[d] = {
        closed: false,
        meals: {
          breakfast: mk(rng() < 0.85, base.bs, base.be, base.bp, bPool, 3, 4),
          lunch:     mk(rng() < 0.96, base.ls, base.le, base.lp, lPool, 4, 5),
          dinner:    mk(rng() < 0.5,  base.ds, base.de, base.dp, dPool, 3, 4),
        },
      };
    }
    return week;
  }

  // ---- bhojanshalas ----
  const defs = [
    {
      id: 'adinath', seed: 7,
      name: { gu: 'શ્રી આદિનાથ ભોજનશાળા', en: 'Shri Adinath Bhojanshala' },
      area: { gu: 'તળેટી રોડ', en: 'Taleti Road' },
      city: { gu: 'પાલીતાણા', en: 'Palitana' },
      dist: 0.6, rating: 4.8, reviews: 312, phone: '+91 98250 11221',
      address: { gu: 'તળેટી રોડ, જૈન ધર્મશાળા પાસે, પાલીતાણા, ગુજરાત 364270', en: 'Taleti Road, near Jain Dharamshala, Palitana, Gujarat 364270' },
      facilities: ['parking', 'water', 'washroom', 'dharamshala', 'temple', 'family'],
      tiffin: { available: true, mode: 'own' }, dharamshala: true,
      notice: { gu: 'પર્યુષણ દરમિયાન વિશેષ સમય — સવારે 6:30 થી', en: 'Special Paryushan timings — from 6:30 AM' },
      updated: { gu: 'આજે 11:30', en: 'Today 11:30 AM' },
      base: { bs: 420, be: 510, bp: 50, ls: 660, le: 810, lp: 80, ds: 1140, de: 1260, dp: 70 },
    },
    {
      id: 'mahavir', seed: 19,
      name: { gu: 'શ્રી મહાવીર ભોજનશાળા', en: 'Shri Mahavir Bhojanshala' },
      area: { gu: 'પાલડી', en: 'Paldi' },
      city: { gu: 'અમદાવાદ', en: 'Ahmedabad' },
      dist: 2.4, rating: 4.6, reviews: 528, phone: '+91 79 2657 8890',
      address: { gu: 'ભટ્ઠા, પાલડી, અમદાવાદ, ગુજરાત 380007', en: 'Bhatha, Paldi, Ahmedabad, Gujarat 380007' },
      facilities: ['parking', 'water', 'washroom', 'wheelchair', 'family'],
      tiffin: { available: true, mode: 'provided' }, dharamshala: false,
      notice: null,
      updated: { gu: 'આજે 10:05', en: 'Today 10:05 AM' },
      base: { bs: 450, be: 540, bp: 40, ls: 690, le: 840, lp: 70, ds: 1170, de: 1290, dp: 65 },
    },
    {
      id: 'shantinath', seed: 31,
      name: { gu: 'શાંતિનાથ ભોજનાલય', en: 'Shantinath Bhojanalay' },
      area: { gu: 'દેરાસર માર્ગ', en: 'Derasar Marg' },
      city: { gu: 'શંખેશ્વર', en: 'Shankheshwar' },
      dist: 1.1, rating: 4.9, reviews: 196, phone: '+91 98795 33442',
      address: { gu: 'દેરાસર માર્ગ, શંખેશ્વર તીર્થ, ગુજરાત 384246', en: 'Derasar Marg, Shankheshwar Tirth, Gujarat 384246' },
      facilities: ['parking', 'water', 'washroom', 'dharamshala', 'temple', 'family', 'wheelchair'],
      tiffin: { available: false, mode: null }, dharamshala: true,
      notice: { gu: 'આજે ફક્ત બપોરનું ભોજન ઉપલબ્ધ', en: 'Only lunch available today' },
      updated: { gu: 'આજે 09:40', en: 'Today 09:40 AM' },
      base: { bs: 420, be: 495, bp: 0, ls: 675, le: 810, lp: 60, ds: 1155, de: 1275, dp: 55 },
    },
    {
      id: 'parshwanath', seed: 47,
      name: { gu: 'શ્રી પાર્શ્વનાથ ભોજનશાળા', en: 'Shri Parshwanath Bhojanshala' },
      area: { gu: 'ગોપીપુરા', en: 'Gopipura' },
      city: { gu: 'સુરત', en: 'Surat' },
      dist: 3.8, rating: 4.5, reviews: 401, phone: '+91 261 242 7781',
      address: { gu: 'ગોપીપુરા મેઈન રોડ, સુરત, ગુજરાત 395001', en: 'Gopipura Main Road, Surat, Gujarat 395001' },
      facilities: ['water', 'washroom', 'family'],
      tiffin: { available: true, mode: 'own' }, dharamshala: false,
      notice: null,
      updated: { gu: 'ગઈકાલે 20:15', en: 'Yesterday 8:15 PM' },
      base: { bs: 435, be: 525, bp: 45, ls: 660, le: 810, lp: 75, ds: 1185, de: 1305, dp: 70 },
    },
    {
      id: 'navkar', seed: 59,
      name: { gu: 'નવકાર ભોજનશાળા', en: 'Navkar Bhojanshala' },
      area: { gu: 'ઘાટકોપર', en: 'Ghatkopar' },
      city: { gu: 'મુંબઈ', en: 'Mumbai' },
      dist: 5.2, rating: 4.7, reviews: 689, phone: '+91 22 2510 9087',
      address: { gu: 'એન.જી. રોડ, ઘાટકોપર (પૂર્વ), મુંબઈ 400077', en: 'N.G. Road, Ghatkopar (E), Mumbai 400077' },
      facilities: ['parking', 'water', 'washroom', 'wheelchair', 'temple', 'family'],
      tiffin: { available: true, mode: 'provided' }, dharamshala: false,
      notice: { gu: 'આજે ભોજન સમાપ્ત — આવતીકાલે મળશે', en: 'Food finished for today — back tomorrow' },
      updated: { gu: 'આજે 13:50', en: 'Today 1:50 PM' },
      base: { bs: 450, be: 540, bp: 55, ls: 705, le: 855, lp: 90, ds: 1200, de: 1320, dp: 80 },
    },
    {
      id: 'siddhgiri', seed: 73,
      name: { gu: 'શ્રી સિદ્ધગિરિ ભોજનશાળા', en: 'Shri Siddhgiri Bhojanshala' },
      area: { gu: 'ગિરિરાજ સોસાયટી', en: 'Giriraj Society' },
      city: { gu: 'પાલીતાણા', en: 'Palitana' },
      dist: 0.9, rating: 4.4, reviews: 154, phone: '+91 90999 21100',
      address: { gu: 'ગિરિરાજ સોસાયટી, પાલીતાણા, ગુજરાત 364270', en: 'Giriraj Society, Palitana, Gujarat 364270' },
      facilities: ['parking', 'water', 'washroom', 'dharamshala', 'family'],
      tiffin: { available: false, mode: null }, dharamshala: true,
      notice: null,
      updated: { gu: 'આજે 08:20', en: 'Today 8:20 AM' },
      base: { bs: 420, be: 510, bp: 40, ls: 660, le: 795, lp: 65, ds: 1170, de: 1290, dp: 60 },
    },
  ];

  const BHOJ = defs.map((d) => ({ ...d, week: buildWeek(d.seed, d.base) }));

  // ---- helpers ----
  function nowMin() { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); }

  // status for a given bhoj on today's weekday: 'open' | 'soon' | 'closed'
  function computeStatus(b, weekday, atMin) {
    atMin = atMin == null ? nowMin() : atMin;
    const day = b.week[weekday];
    if (!day || day.closed) return 'closed';
    const meals = Object.values(day.meals).filter((m) => m.available);
    if (!meals.length) return 'closed';
    for (const m of meals) if (atMin >= m.sm && atMin <= m.em) return 'open';
    for (const m of meals) if (atMin >= m.sm - 60 && atMin < m.sm) return 'soon';
    return 'closed';
  }

  function bhojServesFoodOnDay(b, foodKey, weekday) {
    const day = b.week[weekday];
    if (!day || day.closed) return false;
    return Object.values(day.meals).some((m) => m.available && m.items && m.items.includes(foodKey));
  }

  // counts for smart-filter tags on a given weekday, across all bhoj
  function foodCountsForDay(weekday) {
    const out = {};
    for (const f of SMART_FOODS) out[f] = 0;
    for (const b of BHOJ) for (const f of SMART_FOODS) if (bhojServesFoodOnDay(b, f, weekday)) out[f]++;
    return out;
  }

  // ---- UI string dictionary ----
  const T = {
    appName:      { gu: 'જૈન ભોજનશાળા શોધો', en: 'Find Jain Bhojanshala' },
    adminLogin:   { gu: 'એડમિન', en: 'Admin' },
    heroTitle:    { gu: 'તમારા નજીકની જૈન ભોજનશાળા શોધો', en: 'Find a Jain Bhojanshala near you' },
    heroSub:      { gu: 'સમય, મેનૂ અને ભાવ સાથે નજીકની ભોજનશાળા શોધો.', en: 'Discover nearby bhojanshalas with timings, menu and prices.' },
    searchCity:   { gu: 'શહેર શોધો', en: 'Search city' },
    useLocation:  { gu: 'વર્તમાન સ્થાન વાપરો', en: 'Use current location' },
    search:       { gu: 'શોધો', en: 'Search' },
    quickFilters: { gu: 'ઝડપી ફિલ્ટર', en: 'Quick filters' },
    smartTitle:   { gu: 'આજે શું મળશે?', en: "Today's menu finder" },
    smartSub:     { gu: 'કોઈ વાનગી પર ટેપ કરો — તે પીરસતી ભોજનશાળાઓ દેખાશે', en: 'Tap a dish — see the bhojanshalas serving it' },
    resultsNear:  { gu: 'નજીકની ભોજનશાળાઓ', en: 'Nearby bhojanshalas' },
    sortBy:       { gu: 'ક્રમ', en: 'Sort' },
    clear:        { gu: 'સાફ કરો', en: 'Clear' },
    open:         { gu: 'ખુલ્લું', en: 'Open' },
    soon:         { gu: 'થોડીવારમાં', en: 'Opening soon' },
    closed:       { gu: 'બંધ', en: 'Closed' },
    closedToday:  { gu: 'આજે બંધ', en: 'Closed today' },
    breakfast:    { gu: 'સવારે', en: 'Breakfast' },
    lunch:        { gu: 'બપોરે', en: 'Lunch' },
    dinner:       { gu: 'સાંજે', en: 'Dinner' },
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
    // admin
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
    loginHint:    { gu: 'કોઈપણ વિગતો દાખલ કરો (ડેમો)', en: 'Enter anything to continue (demo)' },
  };

  const tr = (obj, lang) => (obj ? (obj[lang] != null ? obj[lang] : obj.gu) : '');
  const L = (key, lang) => tr(T[key], lang);

  Object.assign(window, {
    FOODS, SMART_FOODS, BHOJ, WEEKDAYS, T, tr, L,
    computeStatus, foodCountsForDay, bhojServesFoodOnDay,
  });
})();
