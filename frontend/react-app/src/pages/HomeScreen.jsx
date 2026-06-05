import { useState, useMemo, useEffect } from 'react';
import {
  FOODS, SMART_FOODS,
  computeStatus, servesTodayFood, foodCountsForList, minPriceToday,
  bhojName, bhojArea, bhojCity, bhojNotice,
  L, tr
} from '../data/data';
import {
  Icon, StatusBadge, Stars, Money, Chip, FoodTag,
  MealTriple, ActionBtn, LangSwitch, ImagePlaceholder
} from '../components/shared';
import { useCountUp } from '../hooks/useCountUp';
import { publicApi } from '../lib/api';

const QUICK_CHIPS = [
  { key: 'open',        emoji: '🟢', gu: 'હમણાં ખુલ્લું', en: 'Open now' },
  { key: 'breakfast',   emoji: '🍵', gu: 'નવકારશી',         en: 'Navkarshi' },
  { key: 'lunch',       emoji: '🍛', gu: 'બપોરે',           en: 'Lunch' },
  { key: 'dinner',      emoji: '🌙', gu: 'ચોવિહાર',         en: 'Chovihar' },
  { key: 'dharamshala', emoji: '🛏️', gu: 'ધર્મશાળા',       en: 'Dharamshala' },
  { key: 'tiffin',      emoji: '🥡', gu: 'ટિફિન',           en: 'Tiffin' },
  { key: 'free',        emoji: '💰', gu: 'નિ:શુલ્ક',        en: 'Free' },
  { key: 'under100',    emoji: '₹',  gu: '₹100 થી ઓછું',   en: 'Under ₹100' },
];

const SORTS = [
  { key: 'name',    gu: 'A-Z ક્રમ',       en: 'A-Z order' },
  { key: 'price',   gu: 'ઓછી કિંમત',      en: 'Lowest price' },
  { key: 'rating',  gu: 'ઉચ્ચ રેટિંગ',    en: 'Highest rated' },
  { key: 'open',    gu: 'હમણાં ખુલ્લું',   en: 'Open now' },
];

function BhojCard({ b, lang, onOpen }) {
  const status    = computeStatus(b.todaySchedule);
  const meals     = b.todaySchedule?.meals ?? {};
  const notice    = bhojNotice(b, lang);
  const lunchItems = meals.lunch?.items || meals.breakfast?.items || [];

  return (
    <article className="card" onClick={() => onOpen(b.id)}>
      <div className="card-photo">
        <ImagePlaceholder
          label={lang === 'gu' ? 'ભોજનનો ફોટો' : 'meal photo'}
          style={{ width: '100%', height: '100%' }}
        />
        <div className="card-photo-top">
          <StatusBadge status={status} lang={lang} />
        </div>
        {notice && <div className="card-notice-strip">⚠ {notice}</div>}
      </div>

      <div className="card-body">
        <div className="card-head">
          <div>
            <h3 className="card-name">{bhojName(b, lang)}</h3>
            <p className="card-area">{bhojArea(b, lang)} · {bhojCity(b, lang)}</p>
          </div>
          <Stars value={b.rating} />
        </div>

        <MealTriple todaySchedule={b.todaySchedule} lang={lang} />

        {!b.todaySchedule?.isClosed && (
          <div className="card-prices">
            {['breakfast', 'lunch', 'dinner'].map((k) => {
              const meal = meals[k];
              const ok   = meal?.available;
              return (
                <div key={k} className={'pr-col' + (ok ? '' : ' pr-off')}>
                  <span className="pr-label">{L(k, lang)}</span>
                  {ok ? <Money amount={meal.price} lang={lang} /> : <span className="pr-na">{L('notAvail', lang)}</span>}
                </div>
              );
            })}
          </div>
        )}

        {lunchItems.length > 0 && (
          <div className="menu-preview">
            {lunchItems.slice(0, 4).map((k) => FOODS[k] && (
              <span key={k} className="menu-chip">{FOODS[k].emoji} {tr(FOODS[k], lang)}</span>
            ))}
          </div>
        )}

        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
          <ActionBtn icon="nav"     label={L('directions', lang)} variant="ghost" />
          <ActionBtn icon="phone"   label={L('call', lang)}       variant="ghost" />
          <ActionBtn icon="chevron" label={L('viewDetails', lang)} variant="primary" onClick={() => onOpen(b.id)} />
        </div>
      </div>
    </article>
  );
}

export default function HomeScreen({ lang, setLang, onOpen, onAdmin }) {
  const [bhojanshalas, setBhojanshalas] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const [chips,    setChips]    = useState(new Set());
  const [food,     setFood]     = useState(null);
  const [sort,     setSort]     = useState('name');
  const [city,     setCity]     = useState('');
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    publicApi.getBhojanshalas({ today: 'true' })
      .then(res => setBhojanshalas(res.data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => foodCountsForList(bhojanshalas), [bhojanshalas]);
  const toggleChip = (k) =>
    setChips((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const results = useMemo(() => {
    let list = bhojanshalas.slice();
    if (food) list = list.filter(b => servesTodayFood(b, food));
    if (chips.has('open'))        list = list.filter(b => computeStatus(b.todaySchedule) === 'open');
    if (chips.has('breakfast'))   list = list.filter(b => b.todaySchedule?.meals.breakfast?.available);
    if (chips.has('lunch'))       list = list.filter(b => b.todaySchedule?.meals.lunch?.available);
    if (chips.has('dinner'))      list = list.filter(b => b.todaySchedule?.meals.dinner?.available);
    if (chips.has('dharamshala')) list = list.filter(b => b.facilities?.dharamshalaAvailable);
    if (chips.has('tiffin'))      list = list.filter(b => b.tiffin?.available);
    if (chips.has('free'))        list = list.filter(b =>
      ['breakfast','lunch','dinner'].some(k => b.todaySchedule?.meals[k]?.available && b.todaySchedule.meals[k].price === 0)
    );
    if (chips.has('under100'))    list = list.filter(b => minPriceToday(b) < 100);
    if (city.trim()) {
      const q = city.trim().toLowerCase();
      list = list.filter(b =>
        b.cityEnglish?.toLowerCase().includes(q) ||
        b.cityGujarati?.toLowerCase().includes(q) ||
        b.areaEnglish?.toLowerCase().includes(q)
      );
    }
    const ord = { open: 0, soon: 1, closed: 2 };
    list.sort((a, b) => {
      if (sort === 'price')  return minPriceToday(a) - minPriceToday(b);
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'open')   return ord[computeStatus(a.todaySchedule)] - ord[computeStatus(b.todaySchedule)];
      return (a.nameEnglish || '').localeCompare(b.nameEnglish || '');
    });
    return list;
  }, [bhojanshalas, chips, food, sort, city]);

  const resultCount = useCountUp(results.length, 500);

  return (
    <div className="screen">

      {/* ═══════════════ HEADER ═══════════════ */}
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true"><span>ૐ</span></span>
          <span className="brand-name">{L('appName', lang)}</span>
        </div>

        <nav className="desktop-nav" aria-label="Site navigation">
          <a href="#" className="dnav-link dnav-active">{L('navHome', lang)}</a>
          <a href="#" className="dnav-link">{L('navMap', lang)}</a>
          <a href="#" className="dnav-link">{L('navSaved', lang)}</a>
          <a href="#" className="dnav-link">{L('navHelp', lang)}</a>
        </nav>

        <div className="header-actions">
          <LangSwitch lang={lang} setLang={setLang} />
          <button className="admin-btn" onClick={onAdmin}>
            <Icon name="lock" size={15} stroke={2} />{L('adminLogin', lang)}
          </button>
        </div>
      </header>

      {/* ═══════════════ HOME LAYOUT ═══════════════ */}
      <div className="home-layout">

        {/* LEFT SIDEBAR */}
        <aside className="home-sidebar">
          <section className="hero sidebar-hero">
            <h1 className="hero-title">{L('heroTitle', lang)}</h1>
            <p className="hero-sub">{L('heroSub', lang)}</p>
            <div className="search-card">
              <div className="search-row">
                <Icon name="pin" size={20} stroke={2} style={{ color: 'var(--saffron)' }} />
                <input
                  id="city-search"
                  className="search-input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={L('searchCity', lang)}
                />
                {city && (
                  <button className="search-clear" onClick={() => setCity('')} aria-label="Clear">
                    <Icon name="cross" size={16} stroke={2.4} />
                  </button>
                )}
              </div>
              <button className="search-btn">
                <Icon name="search" size={19} stroke={2.4} />{L('search', lang)}
              </button>
            </div>
          </section>

          <section className="sidebar-block">
            <div className="chip-scroll">
              {QUICK_CHIPS.map((c) => (
                <Chip key={c.key} emoji={c.emoji} active={chips.has(c.key)} onClick={() => toggleChip(c.key)}>
                  {tr(c, lang)}
                </Chip>
              ))}
            </div>
          </section>

          <section className="sidebar-block smart">
            <div className="smart-head">
              <div>
                <h2 className="block-title">{L('smartTitle', lang)}</h2>
                <p className="block-sub">{L('smartSub', lang)}</p>
              </div>
              {food && (
                <button className="text-btn" onClick={() => setFood(null)}>{L('clear', lang)}</button>
              )}
            </div>
            <div className="foodtag-grid">
              {SMART_FOODS.map((k) => (
                <FoodTag
                  key={k} foodKey={k} count={counts[k]} active={food === k} lang={lang}
                  onClick={() => setFood((f) => (f === k ? null : k))}
                />
              ))}
            </div>
          </section>

          <div className="sidebar-pad" />
        </aside>

        {/* RIGHT CONTENT */}
        <main className="home-content">
          <div className="results-bar">
            <h2 className="block-title">
              {L('resultsNear', lang)}
              {!loading && <span className="result-count">{resultCount}</span>}
            </h2>
            <div className="sort-wrap">
              <button className="sort-btn" onClick={() => setSortOpen((o) => !o)}>
                <Icon name="filter" size={15} stroke={2.2} />
                {tr(SORTS.find((s) => s.key === sort), lang)}
                <Icon name="chevron" size={13} stroke={2.4} style={{ transform: 'rotate(90deg)' }} />
              </button>
              {sortOpen && (
                <div className="sort-menu">
                  {SORTS.map((s) => (
                    <button
                      key={s.key}
                      className={'sort-opt' + (sort === s.key ? ' on' : '')}
                      onClick={() => { setSort(s.key); setSortOpen(false); }}>
                      {tr(s, lang)}{sort === s.key && <Icon name="check" size={16} stroke={2.6} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {food && (
            <div className="active-food-banner">
              <span>{FOODS[food].emoji} {tr(FOODS[food], lang)}</span>
              <span className="afb-count">{counts[food]} {lang === 'gu' ? 'ભોજનશાળા' : 'bhojanshalas'}</span>
            </div>
          )}

          <section className="cards">
            {loading && (
              <div className="empty-state">
                <div className="loading-spinner" />
                <p>{L('loading', lang)}</p>
              </div>
            )}
            {!loading && error && (
              <div className="empty-state">
                <Icon name="info" size={32} stroke={1.6} />
                <p>{lang === 'gu' ? 'ડેટા લોડ ન થઈ શક્યો' : 'Could not load data'}</p>
              </div>
            )}
            {!loading && !error && results.length === 0 && (
              <div className="empty-state">
                <Icon name="search" size={32} stroke={1.6} />
                <p>{L('noResults', lang)}</p>
              </div>
            )}
            {!loading && results.map((b) => (
              <BhojCard key={b.id} b={b} lang={lang} onOpen={onOpen} />
            ))}
          </section>

          <footer className="app-footer">
            <div className="footer-links">
              <a href="#">{L('about', lang)}</a>
              <a href="#">{L('contact', lang)}</a>
              <a href="#">{L('privacy', lang)}</a>
              <button className="footer-admin-link" onClick={onAdmin}>{L('adminLogin', lang)}</button>
            </div>
            <p className="footer-brand">© {L('appName', lang)}</p>
            <p className="footer-made">{L('madeWith', lang)}</p>
          </footer>

          <div className="scroll-pad" />
        </main>
      </div>
    </div>
  );
}
