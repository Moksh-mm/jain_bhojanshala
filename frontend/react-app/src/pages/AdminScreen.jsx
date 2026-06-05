import { useState, useEffect } from 'react';
import { BHOJ, FOODS, WEEKDAYS, L, tr } from '../data/data';
import { Icon, LangSwitch, ImagePlaceholder } from '../components/shared';

function Toggle({ on, onChange }) {
  return (
    <button className={'toggle' + (on ? ' toggle-on' : '')} onClick={() => onChange(!on)} role="switch" aria-checked={on}>
      <span className="toggle-knob" />
    </button>
  );
}

function AdminLogin({ lang, onLogin, onBack }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  return (
    <div className="admin-login">
      <button className="cover-back solid admin-login-back" onClick={onBack}>
        <Icon name="back" size={20} stroke={2.4} />
      </button>
      <div className="login-card">
        <span className="login-lock"><Icon name="lock" size={26} stroke={1.8} /></span>
        <h1>{L('adminPanel', lang)}</h1>
        <p className="login-sub">{L('secureLogin', lang)}</p>
        <label className="field">
          <span>{L('username', lang)}</span>
          <input value={u} onChange={(e) => setU(e.target.value)} placeholder="admin" />
        </label>
        <label className="field">
          <span>{L('password', lang)}</span>
          <input type="password" value={p} onChange={(e) => setP(e.target.value)} placeholder="••••••" />
        </label>
        <button className="login-btn" onClick={onLogin}>
          <Icon name="lock" size={16} stroke={2.2} />{L('login', lang)}
        </button>
        <p className="login-hint">{L('loginHint', lang)}</p>
      </div>
    </div>
  );
}

const ALL_FOODS = ['rotli', 'thepla', 'dal', 'khichdi', 'kadhi', 'bhaat', 'shaak', 'chaas', 'mithai', 'dhokla', 'tea'];

function MealEditor({ k, icon, meal, lang, onChange }) {
  const on = meal.available;
  const toggleItem = (f) => {
    const items = meal.items ? [...meal.items] : [];
    const i = items.indexOf(f);
    i >= 0 ? items.splice(i, 1) : items.push(f);
    onChange({ ...meal, items });
  };
  return (
    <div className={'meal-editor' + (on ? '' : ' me-off')}>
      <div className="me-head">
        <span className="mb-icon"><Icon name={icon} size={17} stroke={2} /></span>
        <span className="me-title">{L(k, lang)}</span>
        <Toggle on={on} onChange={(v) => onChange({ ...meal, available: v })} />
      </div>
      {on && (
        <div className="me-fields">
          <div className="me-row">
            <label className="field sm">
              <span>{L('timeLabel', lang)}</span>
              <input value={meal.time || ''} onChange={(e) => onChange({ ...meal, time: e.target.value })} placeholder="7:00 AM - 8:30 AM" />
            </label>
            <label className="field sm price">
              <span>{L('priceLabel', lang)}</span>
              <input type="number" value={meal.price ?? 0} onChange={(e) => onChange({ ...meal, price: Math.max(0, +e.target.value || 0) })} />
            </label>
          </div>
          <span className="me-menu-label">{L('menuLabel', lang)}</span>
          <div className="me-foods">
            {ALL_FOODS.map((f) => (
              <button key={f} className={'me-food' + (meal.items?.includes(f) ? ' on' : '')} onClick={() => toggleItem(f)}>
                {FOODS[f].emoji} {tr(FOODS[f], lang)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function emptyMeal() { return { available: false, time: '', price: 0, items: [], sm: 420, em: 510 }; }

export default function AdminScreen({ lang, setLang, onBack, onSaved }) {
  const [authed, setAuthed] = useState(false);
  const [bid, setBid]       = useState(BHOJ[0].id);
  const b = BHOJ.find((x) => x.id === bid);
  const [selWd, setSelWd]   = useState(new Date().getDay());
  const [draft, setDraft]   = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    const wk = {};
    for (let d = 0; d < 7; d++) {
      const src = b.week[d];
      if (!src || src.closed) {
        wk[d] = { closed: true, meals: { breakfast: emptyMeal(), lunch: emptyMeal(), dinner: emptyMeal() } };
      } else {
        wk[d] = { closed: false, meals: {
          breakfast: { ...emptyMeal(), ...src.meals.breakfast },
          lunch:     { ...emptyMeal(), ...src.meals.lunch },
          dinner:    { ...emptyMeal(), ...src.meals.dinner },
        }};
      }
    }
    setDraft({ week: wk, notice: b.notice ? tr(b.notice, lang) : '', tiffin: { ...b.tiffin } });
  }, [bid]);

  if (!authed) return <AdminLogin lang={lang} onBack={onBack} onLogin={() => setAuthed(true)} />;
  if (!draft) return null;

  const dayDraft = draft.week[selWd];
  const setMeal   = (k, m) => setDraft((d) => ({ ...d, week: { ...d.week, [selWd]: { ...d.week[selWd], meals: { ...d.week[selWd].meals, [k]: m } } } }));
  const setClosed = (v) =>    setDraft((d) => ({ ...d, week: { ...d.week, [selWd]: { ...d.week[selWd], closed: v } } }));

  const save = () => {
    const wk = {};
    for (let d = 0; d < 7; d++) {
      const dd = draft.week[d];
      if (dd.closed) { wk[d] = { closed: true }; continue; }
      const meals = {};
      ['breakfast', 'lunch', 'dinner'].forEach((k) => {
        const m = dd.meals[k];
        if (m.available) {
          let sm = m.sm, em = m.em;
          const parse = (s) => { const mt = /(\d+):(\d+)\s*(AM|PM)/i.exec(s || ''); if (!mt) return null; let h = +mt[1] % 12; if (/pm/i.test(mt[3])) h += 12; return h * 60 + (+mt[2]); };
          const parts = (m.time || '').split('-');
          const a = parse(parts[0]); const z = parse(parts[1]);
          if (a != null) sm = a; if (z != null) em = z;
          meals[k] = { available: true, time: m.time, price: m.price, items: m.items, sm, em };
        } else meals[k] = { available: false };
      });
      wk[d] = { closed: false, meals };
    }
    b.week = wk;
    b.tiffin = { ...draft.tiffin };
    b.notice = draft.notice.trim() ? { gu: draft.notice, en: draft.notice } : null;
    b.updated = { gu: 'હમણાં જ', en: 'Just now' };
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
    onSaved?.();
  };

  return (
    <div className="screen admin">
      {/* Header */}
      <header className="app-header admin-head">
        <button className="cover-back inline" onClick={onBack}>
          <Icon name="back" size={19} stroke={2.4} />
        </button>
        <span className="brand-name">{L('adminPanel', lang)}</span>
        <div className="header-actions">
          <LangSwitch lang={lang} setLang={setLang} />
          <button className="admin-btn" onClick={onBack}>{L('logout', lang)}</button>
        </div>
      </header>

      {/* Scrollable body — centered on desktop */}
      <div className="scroll-area">
        <div className="admin-body">

          {/* Bhojanshala selector */}
          <div className="admin-section-label">{L('manageTitle', lang)}</div>
          <label className="field">
            <div className="select-wrap">
              <select value={bid} onChange={(e) => setBid(e.target.value)}>
                {BHOJ.map((x) => <option key={x.id} value={x.id}>{tr(x.name, lang)}</option>)}
              </select>
              <Icon name="chevron" size={14} stroke={2.4} style={{ transform: 'rotate(90deg)' }} />
            </div>
          </label>

          {/* Photos */}
          <div className="admin-photos">
            <span className="me-menu-label">
              <Icon name="camera" size={15} stroke={2} /> {L('photos', lang)}
            </span>
            <div className="photo-slots">
              <ImagePlaceholder label={lang === 'gu' ? 'મુખ્ય ફોટો' : 'Main photo'} style={{ height: 96, borderRadius: 14 }} />
              <ImagePlaceholder label={lang === 'gu' ? 'કવર ફોટો' : 'Cover photo'} style={{ height: 96, borderRadius: 14 }} />
            </div>
          </div>

          {/* Day selector */}
          <div>
            <span className="me-menu-label">{L('editTimeline', lang)}</span>
            <div className="admin-days">
              {WEEKDAYS.short[lang].map((w, i) => (
                <button key={i} className={'admin-day' + (selWd === i ? ' on' : '')} onClick={() => setSelWd(i)}>{w}</button>
              ))}
            </div>
          </div>

          {/* Closed all day toggle */}
          <div className="closed-toggle-row">
            <span>{L('closedAllDay', lang)}</span>
            <Toggle on={dayDraft.closed} onChange={setClosed} />
          </div>

          {/* Meal editors – 2-col grid on desktop */}
          {!dayDraft.closed && (
            <div className="editor-stack">
              <MealEditor k="breakfast" icon="sun"  meal={dayDraft.meals.breakfast} lang={lang} onChange={(m) => setMeal('breakfast', m)} />
              <MealEditor k="lunch"     icon="bowl" meal={dayDraft.meals.lunch}     lang={lang} onChange={(m) => setMeal('lunch', m)} />
              <MealEditor k="dinner"    icon="moon" meal={dayDraft.meals.dinner}    lang={lang} onChange={(m) => setMeal('dinner', m)} />
            </div>
          )}

          {/* Notice */}
          <label className="field">
            <span>{L('notice', lang)}</span>
            <textarea
              value={draft.notice}
              onChange={(e) => setDraft((d) => ({ ...d, notice: e.target.value }))}
              placeholder={lang === 'gu' ? 'દા.ત. આજે ફક્ત બપોરનું ભોજન' : 'e.g. Only lunch available today'}
              rows="2"
            />
          </label>

          {/* Tiffin toggle */}
          <div className="closed-toggle-row">
            <span>{L('tiffinTitle', lang)}</span>
            <Toggle
              on={draft.tiffin.available}
              onChange={(v) => setDraft((d) => ({ ...d, tiffin: { ...d.tiffin, available: v, mode: d.tiffin.mode || 'own' } }))}
            />
          </div>
          {draft.tiffin.available && (
            <div className="tiffin-mode">
              {[['own', 'tiffinOwn'], ['provided', 'tiffinProv']].map(([m, key]) => (
                <button
                  key={m}
                  className={'mode-opt' + (draft.tiffin.mode === m ? ' on' : '')}
                  onClick={() => setDraft((d) => ({ ...d, tiffin: { ...d.tiffin, mode: m } }))}>
                  {L(key, lang)}
                </button>
              ))}
            </div>
          )}

          <button className={'save-btn' + (savedFlash ? ' saved' : '')} onClick={save}>
            <Icon name={savedFlash ? 'check' : 'edit'} size={18} stroke={2.4} />
            {savedFlash ? L('saved', lang) : L('saveChanges', lang)}
          </button>

          <div className="scroll-pad" />
        </div>
      </div>
    </div>
  );
}
