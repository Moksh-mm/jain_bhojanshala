/* ============================================================
   Shared UI — icons, badges, chips, food tags, nav
   Exports to window: Icon, Stars, StatusBadge, Chip, FoodTag,
   MealTriple, ActionBtn, Facility, BottomNav, LangSwitch, Money
   ============================================================ */

const ICONS = {
  search:   <path d="M11 4a7 7 0 105.2 11.7l4 4" />,
  pin:      <g><path d="M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" /></g>,
  nav:      <path d="M21 3L3 10.5l7 2.7L13 21l8-18z" />,
  phone:    <path d="M5 4h3l1.6 4-2 1.3a13 13 0 006 6l1.3-2 4 1.6V20a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />,
  share:    <g><circle cx="6" cy="12" r="2.4" /><circle cx="18" cy="6" r="2.4" /><circle cx="18" cy="18" r="2.4" /><path d="M8.1 10.9l7.8-3.8M8.1 13.1l7.8 3.8" /></g>,
  clock:    <g><circle cx="12" cy="12" r="8.2" /><path d="M12 7.5V12l3 2" /></g>,
  check:    <path d="M5 12.5l4.5 4.5L19 7" />,
  cross:    <path d="M7 7l10 10M17 7L7 17" />,
  chevron:  <path d="M9 5l7 7-7 7" />,
  back:     <path d="M15 5l-7 7 7 7" />,
  globe:    <g><circle cx="12" cy="12" r="8.4" /><path d="M3.6 12h16.8M12 3.6c2.4 2.3 2.4 14.5 0 16.8-2.4-2.3-2.4-14.5 0-16.8z" /></g>,
  lock:     <g><rect x="5" y="10.5" width="14" height="9.5" rx="2.4" /><path d="M8 10.5V8a4 4 0 018 0v2.5" /></g>,
  star:     <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9L12 3.5z" />,
  parking:  <g><rect x="4" y="4" width="16" height="16" rx="4" /><path d="M9.5 16.5V8h3.2a2.6 2.6 0 010 5.2H9.5" /></g>,
  water:    <path d="M12 3.5s6 6.4 6 10.2A6 6 0 016 13.7C6 9.9 12 3.5 12 3.5z" />,
  washroom: <g><circle cx="8" cy="5.6" r="2" /><path d="M6 20v-5H5l1.6-5h2.8L11 15H10v5z" /><circle cx="16" cy="5.6" r="2" /><path d="M14 20v-4h-1.2L14.8 9.8a1.4 1.4 0 012.4 0L19.2 16H18v4z" /></g>,
  bed:      <g><path d="M3 8v11M3 12h18v7M21 19v-5a3 3 0 00-3-3H9v4" /><path d="M6.5 10.5h0" /></g>,
  wheelchair: <g><circle cx="11" cy="4.6" r="1.8" /><path d="M10 7v5h4l3 5M10 12a5 5 0 103.5 8.6" /></g>,
  temple:   <g><path d="M12 3l4 3H8l4-3z" /><path d="M6 9h12M7 9v9M17 9v9M5 18h14M10 18v-4h4v4" /></g>,
  family:   <g><circle cx="8" cy="6" r="2.2" /><circle cx="16" cy="6" r="2.2" /><path d="M4.5 20v-5a3.5 3.5 0 017 0v5M12.5 20v-5a3.5 3.5 0 017 0v5" /></g>,
  tiffin:   <g><rect x="6" y="9" width="12" height="11" rx="2" /><path d="M9 9V6.5A1.5 1.5 0 0110.5 5h3A1.5 1.5 0 0115 6.5V9M6 13.5h12" /><path d="M11 4h2" /></g>,
  sun:      <g><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M18.5 5.5l-1.4 1.4M6.9 17.1l-1.4 1.4" /></g>,
  bowl:     <g><path d="M3.5 11h17a8.5 8.5 0 01-17 0z" /><path d="M9 7.5c0-1.5 1-2 1.5-3M13 7.5c0-1.5 1-2 1.5-3" /></g>,
  moon:     <path d="M20 13.5A8 8 0 119.5 4a6.3 6.3 0 0010.5 9.5z" />,
  whatsapp: <g><path d="M4 20l1.4-4.2A8 8 0 1112 20a8 8 0 01-4-1.1L4 20z" /><path d="M9 9.2c0 3 2.3 5 4.8 5.3.8.1 1.2-.6 1.2-1.2 0-.3-1.4-.9-1.7-.7-.5.3-.8.5-1.4 0-.7-.6-1.3-1.4-1.1-1.9.1-.4.7-.6.6-1.1-.1-.4-.5-1.6-1-1.6S9 8.6 9 9.2z" /></g>,
  mail:     <g><rect x="3.5" y="5.5" width="17" height="13" rx="2.4" /><path d="M4 7l8 6 8-6" /></g>,
  plus:     <path d="M12 5v14M5 12h14" />,
  edit:     <path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" />,
  camera:   <g><rect x="3.5" y="7" width="17" height="12" rx="3" /><circle cx="12" cy="13" r="3.2" /><path d="M8.5 7l1.2-2h4.6l1.2 2" /></g>,
  filter:   <path d="M4 6h16M7 12h10M10 18h4" />,
  heart:    <path d="M12 20s-7-4.5-7-9.5A3.8 3.8 0 0112 8a3.8 3.8 0 017 2.5C19 15.5 12 20 12 20z" />,
  map:      <g><path d="M9 4L4 6v14l5-2 6 2 5-2V4l-5 2-6-2z" /><path d="M9 4v14M15 6v14" /></g>,
  info:     <g><circle cx="12" cy="12" r="8.4" /><path d="M12 11v5M12 8h0" /></g>,
};

function Icon({ name, size = 20, stroke = 2, fill = false, style = {} }) {
  const g = ICONS[name] || ICONS.info;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'}
      stroke={fill ? 'none' : 'currentColor'} strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block', ...style }}>
      {g}
    </svg>
  );
}

function Stars({ value = 0, size = 13 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--gold)' }}>
      <Icon name="star" size={size} fill />
      <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: size + 1 }}>{value.toFixed(1)}</span>
    </span>
  );
}

const STATUS_META = {
  open:   { key: 'open',   color: 'var(--green)',  bg: 'var(--green-bg)' },
  soon:   { key: 'soon',   color: 'var(--orange)', bg: 'var(--orange-bg)' },
  closed: { key: 'closed', color: 'var(--red)',    bg: 'var(--red-bg)' },
};

function StatusBadge({ status, lang, pulse = true }) {
  const m = STATUS_META[status] || STATUS_META.closed;
  return (
    <span className="status-badge" style={{ color: m.color, background: m.bg }}>
      <span className={'status-dot' + (pulse && status !== 'closed' ? ' pulse' : '')} style={{ background: m.color }}></span>
      {window.L(m.key, lang)}
    </span>
  );
}

function Money({ amount, lang, suffix = false }) {
  if (amount === 0) return <span className="price-free">{window.L('free', lang)}</span>;
  return <span className="price"><span className="rupee">₹</span>{amount}{suffix && <span className="price-suffix">{window.L('perPerson', lang)}</span>}</span>;
}

function Chip({ active, children, onClick, emoji }) {
  return (
    <button className={'chip' + (active ? ' chip-on' : '')} onClick={onClick}>
      {emoji && <span className="chip-emoji">{emoji}</span>}
      {children}
    </button>
  );
}

// count-up animation for badge numbers (always lands on target, even if rAF is throttled)
function useCountUp(target, dur = 650) {
  const [n, setN] = React.useState(target);
  React.useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setN(target); return; }
    let raf, start, done = false;
    const finish = () => { if (!done) { done = true; setN(target); } };
    const step = (t) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setN(Math.round(target * e));
      if (p < 1) raf = requestAnimationFrame(step); else finish();
    };
    setN(0);
    raf = requestAnimationFrame(step);
    const guard = setTimeout(finish, dur + 250); // snap to target if rAF stalls (background tab)
    return () => { cancelAnimationFrame(raf); clearTimeout(guard); };
  }, [target]);
  return n;
}

function FoodTag({ foodKey, count, active, onClick, lang }) {
  const f = window.FOODS[foodKey];
  const dim = count === 0;
  const shown = useCountUp(count);
  return (
    <button className={'foodtag' + (active ? ' foodtag-on' : '') + (dim ? ' foodtag-dim' : '')}
      onClick={dim ? undefined : onClick} disabled={dim}>
      <span className="foodtag-emoji">{f.emoji}</span>
      <span className="foodtag-name">{window.tr(f, lang)}</span>
      <span className={'foodtag-count' + (active ? ' on' : '')}>{shown}</span>
    </button>
  );
}

// breakfast / lunch / dinner availability trio on cards
function MealTriple({ day, lang }) {
  const meals = [['breakfast', 'sun'], ['lunch', 'bowl'], ['dinner', 'moon']];
  return (
    <div className="meal-triple">
      {meals.map(([k, icon]) => {
        const on = !day.closed && day.meals && day.meals[k] && day.meals[k].available;
        return (
          <div key={k} className={'meal-pill' + (on ? ' meal-on' : ' meal-off')}>
            <Icon name={icon} size={14} stroke={2} />
            <span>{window.L(k, lang)}</span>
            <Icon name={on ? 'check' : 'cross'} size={13} stroke={2.6} />
          </div>
        );
      })}
    </div>
  );
}

function ActionBtn({ icon, label, variant = 'ghost', onClick }) {
  return (
    <button className={'action-btn action-' + variant} onClick={onClick}>
      <Icon name={icon} size={18} stroke={2} />
      <span>{label}</span>
    </button>
  );
}

const FACILITY_LABELS = {
  parking:    { gu: 'પાર્કિંગ', en: 'Parking', icon: 'parking' },
  water:      { gu: 'પીવાનું પાણી', en: 'Drinking water', icon: 'water' },
  washroom:   { gu: 'વૉશરૂમ', en: 'Washroom', icon: 'washroom' },
  dharamshala:{ gu: 'ધર્મશાળા', en: 'Dharamshala', icon: 'bed' },
  wheelchair: { gu: 'વ્હીલચેર', en: 'Wheelchair access', icon: 'wheelchair' },
  temple:     { gu: 'દેરાસર નજીક', en: 'Temple nearby', icon: 'temple' },
  family:     { gu: 'કૌટુંબિક બેઠક', en: 'Family seating', icon: 'family' },
};

function Facility({ name, lang }) {
  const f = FACILITY_LABELS[name];
  if (!f) return null;
  return (
    <div className="facility">
      <span className="facility-ic"><Icon name={f.icon} size={22} stroke={1.8} /></span>
      <span className="facility-label">{window.tr(f, lang)}</span>
    </div>
  );
}

function LangSwitch({ lang, setLang }) {
  return (
    <div className="lang-switch" role="group" aria-label="language">
      <button className={lang === 'gu' ? 'on' : ''} onClick={() => setLang('gu')}>ગુજરાતી</button>
      <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>English</button>
    </div>
  );
}

function BottomNav({ active, lang, onNav }) {
  const items = [
    ['home', 'pin', 'navHome'],
    ['map', 'map', 'navMap'],
    ['saved', 'heart', 'navSaved'],
    ['help', 'info', 'navHelp'],
  ];
  return (
    <nav className="bottom-nav">
      {items.map(([key, icon, label]) => (
        <button key={key} className={'nav-item' + (active === key ? ' nav-on' : '')} onClick={() => onNav && onNav(key)}>
          <Icon name={icon} size={23} stroke={2} fill={active === key && key === 'saved'} />
          <span>{window.L(label, lang)}</span>
        </button>
      ))}
    </nav>
  );
}

Object.assign(window, {
  Icon, Stars, StatusBadge, Money, Chip, FoodTag, MealTriple,
  ActionBtn, Facility, FACILITY_LABELS, LangSwitch, BottomNav, useCountUp,
});
