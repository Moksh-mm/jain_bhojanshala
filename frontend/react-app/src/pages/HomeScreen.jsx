import { useState, useMemo, useEffect } from 'react';
import {
  computeStatus,
  bhojName, bhojArea, bhojCity, bhojNotice,
  L, tr
} from '../data/data';
import {
  Icon, StatusBadge, Stars, Chip,
  MealTriple, ActionBtn, LangSwitch, ImagePlaceholder
} from '../components/shared';
import { useCountUp } from '../hooks/useCountUp';
import { publicApi } from '../lib/api';

const QUICK_CHIPS = [
  { key: 'open',        emoji: '🟢', gu: 'હમણાં ખુલ્લું', en: 'Open now'     },
  { key: 'dharamshala', emoji: '🛏️', gu: 'ધર્મશાળા',       en: 'Dharamshala'  },
  { key: 'derasar',     emoji: '🛕', gu: 'દેરાસર',          en: 'Derasar'      },
  { key: 'tiffin',      emoji: '🥡', gu: 'ટિફિન સેવા',      en: 'Tiffin'       },
  { key: 'boilWater',   emoji: '💧', gu: 'ઉકાળેલું પાણી',   en: 'Boiled water' },
  { key: 'ekashnu',     emoji: '🍽', gu: 'એકાસણું',          en: 'Ekasanu'      },
  { key: 'biaasanu',    emoji: '🍽', gu: 'બિયાસણું',        en: 'Biyasanu'     },
  { key: 'ambil',       emoji: '🥣', gu: 'આંબિલ',           en: 'Ambil'        },
  { key: 'parking',     emoji: '🅿️', gu: 'પાર્કિંગ',        en: 'Parking'      },
];

const SORTS = [
  { key: 'name',   gu: 'A-Z ક્રમ',      en: 'A-Z order'    },
  { key: 'rating', gu: 'ઉચ્ચ રેટિંગ',   en: 'Highest rated' },
  { key: 'open',   gu: 'હમણાં ખુલ્લું', en: 'Open now'     },
];

function BhojCard({ b, lang, onOpen }) {
  const tm     = b.todayMeals;
  const status = computeStatus(tm);
  const notice = bhojNotice(b, lang);

  return (
    <article className="card" onClick={() => onOpen(b.id)}>
      <div className="card-photo">
        {b.coverImage
          ? <img src={b.coverImage} alt={bhojName(b, lang)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <ImagePlaceholder label={lang === 'gu' ? 'ભોજનશાળા' : 'bhojanshala'} style={{ width: '100%', height: '100%' }} />
        }
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

        <MealTriple todayMeals={tm} lang={lang} />

        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
          {b.directionsUrl
            ? <a href={b.directionsUrl} target="_blank" rel="noopener noreferrer" className="action-btn action-ghost" onClick={e => e.stopPropagation()}><Icon name="nav" size={18} stroke={2} /><span>{L('directions', lang)}</span></a>
            : <ActionBtn icon="nav" label={L('directions', lang)} variant="ghost" />
          }
          {b.phone
            ? <a href={`tel:${b.phone}`} className="action-btn action-ghost" onClick={e => e.stopPropagation()}><Icon name="phone" size={18} stroke={2} /><span>{L('call', lang)}</span></a>
            : <ActionBtn icon="phone" label={L('call', lang)} variant="ghost" />
          }
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
  const [sort,     setSort]     = useState('name');
  const [city,     setCity]     = useState('');
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    publicApi.getBhojanshalas({ today: 'true' })
      .then(res => setBhojanshalas(res.data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleChip = (k) =>
    setChips((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const results = useMemo(() => {
    let list = bhojanshalas.slice();
    if (chips.has('open'))        list = list.filter(b => computeStatus(b.todayMeals) === 'open');
    if (chips.has('dharamshala')) list = list.filter(b => b.facilities?.dharamshalaAvailable);
    if (chips.has('derasar'))     list = list.filter(b => b.derasarAvailable);
    if (chips.has('tiffin'))      list = list.filter(b => b.tiffin?.available);
    if (chips.has('boilWater'))   list = list.filter(b => b.facilities?.boilWater);
    if (chips.has('ekashnu'))     list = list.filter(b => b.facilities?.ekashnu);
    if (chips.has('biaasanu'))    list = list.filter(b => b.facilities?.biaasanu);
    if (chips.has('ambil'))       list = list.filter(b => b.facilities?.ambil);
    if (chips.has('parking'))     list = list.filter(b => b.facilities?.parking);
    if (city.trim()) {
      const q = city.trim().toLowerCase();
      list = list.filter(b =>
        b.cityEnglish?.toLowerCase().includes(q) ||
        b.cityGujarati?.toLowerCase().includes(q) ||
        b.areaEnglish?.toLowerCase().includes(q)
      );
    }
    const ord = { open: 0, partial: 1, soon: 1, closed: 2 };
    list.sort((a, b) => {
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'open')   return (ord[computeStatus(a.todayMeals)] ?? 2) - (ord[computeStatus(b.todayMeals)] ?? 2);
      return (a.nameEnglish || '').localeCompare(b.nameEnglish || '');
    });
    return list;
  }, [bhojanshalas, chips, sort, city]);

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
            <p className="block-label">{L('quickFilters', lang)}</p>
            <div className="chip-scroll">
              {QUICK_CHIPS.map((c) => (
                <Chip key={c.key} emoji={c.emoji} active={chips.has(c.key)} onClick={() => toggleChip(c.key)}>
                  {tr(c, lang)}
                </Chip>
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
