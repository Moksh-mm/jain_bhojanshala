import { useState } from 'react';
import { FOODS, WEEKDAYS, computeStatus, L, tr } from '../data/data';
import {
  Icon, StatusBadge, Stars, Money, ActionBtn,
  Facility, LangSwitch, ImagePlaceholder
} from '../components/shared';

function nextOpenInfo(b, fromWeekday, lang) {
  for (let i = 1; i <= 7; i++) {
    const wd = (fromWeekday + i) % 7;
    const day = b.week[wd];
    if (day && !day.closed) {
      const meals = ['breakfast', 'lunch', 'dinner']
        .map((k) => day.meals[k])
        .filter((m) => m && m.available);
      if (meals.length) {
        const first = meals.sort((a, c) => a.sm - c.sm)[0];
        return `${WEEKDAYS.long[lang][wd]} · ${first.time.split(' - ')[0]}`;
      }
    }
  }
  return null;
}

function MealBlock({ k, icon, meal, lang }) {
  const on = meal?.available;
  return (
    <div className={'meal-block' + (on ? '' : ' meal-block-off')}>
      <div className="mb-head">
        <span className="mb-icon"><Icon name={icon} size={18} stroke={2} /></span>
        <span className="mb-title">{L(k, lang)}</span>
        <span className={'mb-status ' + (on ? 'on' : 'off')}>
          <Icon name={on ? 'check' : 'cross'} size={13} stroke={2.8} />
          {on ? L('available', lang) : L('notAvail', lang)}
        </span>
      </div>
      {on && (
        <>
          <div className="mb-meta">
            <span className="mb-time"><Icon name="clock" size={14} stroke={2} />{meal.time}</span>
            <span className="mb-price"><Money amount={meal.price} lang={lang} suffix /></span>
          </div>
          <div className="mb-menu">
            {meal.items.map((it) => (
              <span key={it} className="mb-item">{FOODS[it].emoji} {tr(FOODS[it], lang)}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function DetailScreen({ b, lang, setLang, today, onBack, onAdmin }) {
  const base = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base); d.setDate(base.getDate() + i);
    return { idx: i, wd: d.getDay(), date: d.getDate() };
  });
  const [sel, setSel] = useState(0);
  const selWd = days[sel].wd;
  const day = b.week[selWd];
  const closed = !day || day.closed;
  const status = computeStatus(b, today);

  return (
    <div className="screen">
      <div className="scroll-area detail-scroll">

        {/* ── Cover ── */}
        <div className="cover">
          <ImagePlaceholder
            label={lang === 'gu' ? 'ભોજનશાળા / થાળી' : 'Hall / Thali photo'}
            style={{ width: '100%', height: '100%' }}
          />
          <div className="cover-grad" />
          <button className="cover-back" onClick={onBack} aria-label="Go back">
            <Icon name="back" size={20} stroke={2.4} />
          </button>
          <div className="cover-top-right">
            <LangSwitch lang={lang} setLang={setLang} />
          </div>
          <div className="cover-info">
            <div className="cover-badges">
              <StatusBadge status={status} lang={lang} />
              <span className="dist-pill light">
                <Icon name="pin" size={12} stroke={2.2} />{b.dist} {L('km', lang)}
              </span>
            </div>
            <h1 className="detail-name">{tr(b.name, lang)}</h1>
            <div className="detail-sub">
              <Stars value={b.rating} size={14} />
              <span className="rev">{b.reviews} {L('reviews', lang)}</span>
            </div>
          </div>
        </div>

        {/* ── Two-column body on desktop ── */}
        <div className="detail-body">
          <div className="detail-grid">

            {/* ── LEFT col: address, actions, tiffin, facilities ── */}
            <div className="detail-col-main">
              <div className="addr-row">
                <Icon name="pin" size={17} stroke={2} style={{ color: 'var(--saffron)', marginTop: 2 }} />
                <span>{tr(b.address, lang)}</span>
              </div>
              <div className="phone-row">
                <Icon name="phone" size={16} stroke={2} style={{ color: 'var(--saffron)' }} />
                <span>{b.phone}</span>
              </div>

              <div className="detail-actions">
                <ActionBtn icon="nav"   label={L('directions', lang)} variant="primary" />
                <ActionBtn icon="phone" label={L('call', lang)}       variant="ghost" />
                <ActionBtn icon="share" label={L('share', lang)}      variant="ghost" />
              </div>

              {b.notice && (
                <div className="notice-card">
                  <span className="notice-ic">⚠</span>
                  <div>
                    <span className="notice-label">{L('notice', lang)}</span>
                    <p>{tr(b.notice, lang)}</p>
                  </div>
                </div>
              )}

              {/* Tiffin */}
              <section className="section">
                <h2 className="section-title"><span className="st-accent" />{L('tiffinTitle', lang)}</h2>
                <div className={'tiffin-card' + (b.tiffin.available ? '' : ' tiffin-off')}>
                  <span className="tiffin-ic">🥡</span>
                  {b.tiffin.available ? (
                    <div>
                      <span className="tiffin-yes">{L('available', lang)}</span>
                      <p>{b.tiffin.mode === 'own' ? L('tiffinOwn', lang) : L('tiffinProv', lang)}</p>
                    </div>
                  ) : (
                    <p className="tiffin-no">{L('tiffinNo', lang)}</p>
                  )}
                </div>
              </section>

              {/* Facilities */}
              <section className="section">
                <h2 className="section-title"><span className="st-accent" />{L('facilities', lang)}</h2>
                <div className="facility-grid">
                  {b.facilities.map((f) => <Facility key={f} name={f} lang={lang} />)}
                </div>
              </section>

              {/* Trust badge */}
              <div className="trust-badge">
                <span className="trust-pulse" />
                <div>
                  <span className="trust-line">
                    {L('lastUpdated', lang)}: <strong>{tr(b.updated, lang)}</strong>
                  </span>
                  <span className="trust-by">{L('updatedBy', lang)}: {L('admin', lang)}</span>
                </div>
              </div>
            </div>

            {/* ── RIGHT col: 7-day timeline + contact ── */}
            <div className="detail-col-side">
              {/* 7-day timeline */}
              <section className="section section-first">
                <h2 className="section-title"><span className="st-accent" />{L('sevenDay', lang)}</h2>
                <div className="timeline">
                  {days.map((d) => {
                    const dayClosed = !b.week[d.wd] || b.week[d.wd].closed;
                    return (
                      <button
                        key={d.idx}
                        className={'tl-day' + (sel === d.idx ? ' tl-on' : '') + (dayClosed ? ' tl-closed' : '')}
                        onClick={() => setSel(d.idx)}>
                        <span className="tl-wd">{WEEKDAYS.short[lang][d.wd]}</span>
                        <span className="tl-date">{d.date}</span>
                        <span className="tl-mark">{dayClosed ? '×' : '•'}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="timeline-panel" key={sel}>
                  {closed ? (
                    <div className="closed-card">
                      <span className="closed-emoji">🔴</span>
                      <h3>{L('closedToday', lang)}</h3>
                      <p>{L('noMeals', lang)}</p>
                      {nextOpenInfo(b, selWd, lang) && (
                        <div className="next-open">
                          {L('nextOpen', lang)}: <strong>{nextOpenInfo(b, selWd, lang)}</strong>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="meal-stack">
                      <MealBlock k="breakfast" icon="sun"  meal={day.meals.breakfast} lang={lang} />
                      <MealBlock k="lunch"     icon="bowl" meal={day.meals.lunch}     lang={lang} />
                      <MealBlock k="dinner"    icon="moon" meal={day.meals.dinner}    lang={lang} />
                    </div>
                  )}
                </div>
              </section>

              {/* Contact */}
              <section className="section contact">
                <h2 className="section-title"><span className="st-accent" />{L('needHelp', lang)}</h2>
                <div className="contact-grid">
                  <a className="contact-item" href={'tel:' + b.phone}>
                    <Icon name="phone" size={20} stroke={2} /><span>{L('call', lang)}</span>
                  </a>
                  <a className="contact-item wa">
                    <Icon name="whatsapp" size={20} stroke={2} /><span>{L('whatsapp', lang)}</span>
                  </a>
                  <a className="contact-item">
                    <Icon name="mail" size={20} stroke={2} /><span>{L('email', lang)}</span>
                  </a>
                </div>
                <button className="suggest-btn" onClick={onAdmin}>
                  <Icon name="plus" size={17} stroke={2.4} />{L('suggest', lang)}
                </button>
              </section>
            </div>
          </div>

          <div className="scroll-pad" />
        </div>
      </div>
    </div>
  );
}
