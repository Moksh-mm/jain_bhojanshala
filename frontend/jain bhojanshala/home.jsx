/* ============================================================
   Home screen — hero, search, filters, smart food finder, cards
   Exports to window: HomeScreen, BhojCard
   ============================================================ */

const QUICK_CHIPS = [
  { key: 'open',    emoji: '🟢', gu: 'હમણાં ખુલ્લું', en: 'Open now' },
  { key: 'breakfast', emoji: '🍵', gu: 'સવારે', en: 'Breakfast' },
  { key: 'lunch',   emoji: '🍛', gu: 'બપોરે', en: 'Lunch' },
  { key: 'dinner',  emoji: '🌙', gu: 'સાંજે', en: 'Dinner' },
  { key: 'dharamshala', emoji: '🛏️', gu: 'ધર્મશાળા', en: 'Dharamshala' },
  { key: 'tiffin',  emoji: '🥡', gu: 'ટિફિન', en: 'Tiffin' },
  { key: 'free',    emoji: '💰', gu: 'નિ:શુલ્ક', en: 'Free' },
  { key: 'under100',emoji: '₹',  gu: '₹100 થી ઓછું', en: 'Under ₹100' },
];

const SORTS = [
  { key: 'near',   gu: 'નજીકના', en: 'Nearest' },
  { key: 'price',  gu: 'ઓછી કિંમત', en: 'Lowest price' },
  { key: 'rating', gu: 'ઉચ્ચ રેટિંગ', en: 'Highest rated' },
  { key: 'open',   gu: 'હમણાં ખુલ્લું', en: 'Open now' },
];

function todayMeals(b, today) {
  const day = b.week[today];
  if (!day || day.closed) return {};
  return day.meals || {};
}
function minPriceToday(b, today) {
  const m = todayMeals(b, today);
  const ps = Object.values(m).filter((x) => x.available).map((x) => x.price);
  return ps.length ? Math.min(...ps) : Infinity;
}

function BhojCard({ b, lang, today, onOpen }) {
  const status = window.computeStatus(b, today);
  const day = b.week[today];
  const closed = !day || day.closed;
  const m = todayMeals(b, today);
  const lunchItems = (m.lunch && m.lunch.available && m.lunch.items) || (m.breakfast && m.breakfast.items) || [];

  return (
    <article className="card" onClick={() => onOpen(b.id)}>
      <div className="card-photo">
        <image-slot id={'img-' + b.id} shape="rect" placeholder={lang === 'gu' ? 'ભોજનનો ફોટો' : 'meal photo'}
          style={{ width: '100%', height: '100%' }}></image-slot>
        <div className="card-photo-top">
          <StatusBadge status={status} lang={lang} />
          <span className="dist-pill"><Icon name="pin" size={12} stroke={2.2} />{b.dist} {window.L('km', lang)}</span>
        </div>
        {b.notice && <div className="card-notice-strip">⚠ {window.tr(b.notice, lang)}</div>}
      </div>

      <div className="card-body">
        <div className="card-head">
          <div>
            <h3 className="card-name">{window.tr(b.name, lang)}</h3>
            <p className="card-area">{window.tr(b.area, lang)} · {window.tr(b.city, lang)}</p>
          </div>
          <Stars value={b.rating} />
        </div>

        <MealTriple day={day || { closed: true }} lang={lang} />

        {!closed && (
          <div className="card-prices">
            {['breakfast', 'lunch', 'dinner'].map((k) => {
              const meal = m[k];
              const ok = meal && meal.available;
              return (
                <div key={k} className={'pr-col' + (ok ? '' : ' pr-off')}>
                  <span className="pr-label">{window.L(k, lang)}</span>
                  {ok ? <Money amount={meal.price} lang={lang} /> : <span className="pr-na">{window.L('notAvail', lang)}</span>}
                </div>
              );
            })}
          </div>
        )}

        {!closed && lunchItems.length > 0 && (
          <div className="menu-preview">
            {lunchItems.slice(0, 4).map((k) => (
              <span key={k} className="menu-chip">{window.FOODS[k].emoji} {window.tr(window.FOODS[k], lang)}</span>
            ))}
          </div>
        )}

        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
          <ActionBtn icon="nav" label={window.L('directions', lang)} variant="ghost" />
          <ActionBtn icon="phone" label={window.L('call', lang)} variant="ghost" />
          <ActionBtn icon="chevron" label={window.L('viewDetails', lang)} variant="primary" onClick={() => onOpen(b.id)} />
        </div>
      </div>
    </article>
  );
}

function HomeScreen({ lang, setLang, today, onOpen, onAdmin }) {
  const [chips, setChips] = React.useState(new Set());
  const [food, setFood] = React.useState(null);
  const [sort, setSort] = React.useState('near');
  const [city, setCity] = React.useState('');
  const [sortOpen, setSortOpen] = React.useState(false);

  const counts = React.useMemo(() => window.foodCountsForDay(today), [today]);
  const toggleChip = (k) => setChips((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const results = React.useMemo(() => {
    let list = window.BHOJ.slice();
    if (food) list = list.filter((b) => window.bhojServesFoodOnDay(b, food, today));
    if (chips.has('open')) list = list.filter((b) => window.computeStatus(b, today) === 'open');
    if (chips.has('breakfast')) list = list.filter((b) => todayMeals(b, today).breakfast?.available);
    if (chips.has('lunch')) list = list.filter((b) => todayMeals(b, today).lunch?.available);
    if (chips.has('dinner')) list = list.filter((b) => todayMeals(b, today).dinner?.available);
    if (chips.has('dharamshala')) list = list.filter((b) => b.dharamshala);
    if (chips.has('tiffin')) list = list.filter((b) => b.tiffin.available);
    if (chips.has('free')) list = list.filter((b) => Object.values(todayMeals(b, today)).some((x) => x.available && x.price === 0));
    if (chips.has('under100')) list = list.filter((b) => minPriceToday(b, today) < 100);
    if (city.trim()) {
      const q = city.trim().toLowerCase();
      list = list.filter((b) => window.tr(b.city, lang).toLowerCase().includes(q) || window.tr(b.city, 'en').toLowerCase().includes(q) || window.tr(b.area, lang).toLowerCase().includes(q));
    }
    const ord = { open: 0, soon: 1, closed: 2 };
    list.sort((a, b) => {
      if (sort === 'near') return a.dist - b.dist;
      if (sort === 'price') return minPriceToday(a, today) - minPriceToday(b, today);
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'open') return ord[window.computeStatus(a, today)] - ord[window.computeStatus(b, today)];
      return 0;
    });
    return list;
  }, [chips, food, sort, city, today, lang]);

  const resultCount = useCountUp(results.length, 500);

  return (
    <div className="screen">
      {/* header */}
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true"><span>ૐ</span></span>
          <span className="brand-name">{window.L('appName', lang)}</span>
        </div>
        <button className="admin-btn" onClick={onAdmin}><Icon name="lock" size={15} stroke={2} />{window.L('adminLogin', lang)}</button>
      </header>

      <div className="scroll-area">
        {/* hero */}
        <section className="hero">
          <h1 className="hero-title">{window.L('heroTitle', lang)}</h1>
          <p className="hero-sub">{window.L('heroSub', lang)}</p>
          <LangSwitch lang={lang} setLang={setLang} />
          <div className="search-card">
            <div className="search-row">
              <Icon name="pin" size={20} stroke={2} style={{ color: 'var(--saffron)' }} />
              <input className="search-input" value={city} onChange={(e) => setCity(e.target.value)}
                placeholder={window.L('searchCity', lang)} />
              {city && <button className="search-clear" onClick={() => setCity('')}><Icon name="cross" size={16} stroke={2.4} /></button>}
            </div>
            <button className="loc-row" onClick={() => setCity(lang === 'gu' ? 'પાલીતાણા' : 'Palitana')}>
              <span className="loc-dot"><Icon name="nav" size={14} stroke={2.2} fill /></span>
              {window.L('useLocation', lang)}
            </button>
            <button className="search-btn"><Icon name="search" size={19} stroke={2.4} />{window.L('search', lang)}</button>
          </div>
        </section>

        {/* quick filter chips */}
        <section className="block">
          <div className="chip-scroll">
            {QUICK_CHIPS.map((c) => (
              <Chip key={c.key} emoji={c.emoji} active={chips.has(c.key)} onClick={() => toggleChip(c.key)}>
                {window.tr(c, lang)}
              </Chip>
            ))}
          </div>
        </section>

        {/* smart food finder */}
        <section className="block smart">
          <div className="smart-head">
            <div>
              <h2 className="block-title">{window.L('smartTitle', lang)}</h2>
              <p className="block-sub">{window.L('smartSub', lang)}</p>
            </div>
            {food && <button className="text-btn" onClick={() => setFood(null)}>{window.L('clear', lang)}</button>}
          </div>
          <div className="foodtag-grid">
            {window.SMART_FOODS.map((k) => (
              <FoodTag key={k} foodKey={k} count={counts[k]} active={food === k} lang={lang}
                onClick={() => setFood((f) => (f === k ? null : k))} />
            ))}
          </div>
        </section>

        {/* results header + sort */}
        <section className="block results-head">
          <h2 className="block-title">
            {window.L('resultsNear', lang)}
            <span className="result-count">{resultCount}</span>
          </h2>
          <div className="sort-wrap">
            <button className="sort-btn" onClick={() => setSortOpen((o) => !o)}>
              <Icon name="filter" size={15} stroke={2.2} />
              {window.tr(SORTS.find((s) => s.key === sort), lang)}
              <Icon name="chevron" size={13} stroke={2.4} style={{ transform: sortOpen ? 'rotate(90deg)' : 'rotate(90deg)' }} />
            </button>
            {sortOpen && (
              <div className="sort-menu">
                {SORTS.map((s) => (
                  <button key={s.key} className={'sort-opt' + (sort === s.key ? ' on' : '')}
                    onClick={() => { setSort(s.key); setSortOpen(false); }}>
                    {window.tr(s, lang)}{sort === s.key && <Icon name="check" size={16} stroke={2.6} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* active food chip indicator */}
        {food && (
          <div className="active-food-banner">
            <span>{window.FOODS[food].emoji} {window.tr(window.FOODS[food], lang)}</span>
            <span className="afb-count">{counts[food]} {window.L('resultsNear', lang).split(' ').slice(-1)}</span>
          </div>
        )}

        {/* cards */}
        <section className="cards">
          {results.length === 0 && (
            <div className="empty-state">
              <Icon name="search" size={32} stroke={1.6} />
              <p>{lang === 'gu' ? 'કોઈ ભોજનશાળા મળી નથી' : 'No bhojanshalas found'}</p>
            </div>
          )}
          {results.map((b) => <BhojCard key={b.id} b={b} lang={lang} today={today} onOpen={onOpen} />)}
        </section>

        <div className="scroll-pad"></div>
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen, BhojCard, QUICK_CHIPS, SORTS });
