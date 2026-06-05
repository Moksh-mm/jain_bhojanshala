import { useState, useEffect } from 'react';
import {
  FOODS, WEEKDAYS,
  computeStatus, bhojName, bhojArea, bhojCity, bhojAddress,
  bhojNotice, bhojFacilities, formatMealTime, nextOpenInfo,
  L, tr
} from '../data/data';
import {
  Icon, StatusBadge, Stars, Money, ActionBtn,
  Facility, LangSwitch, ImagePlaceholder
} from '../components/shared';
import { publicApi } from '../lib/api';

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
            <span className="mb-time"><Icon name="clock" size={14} stroke={2} />{formatMealTime(meal)}</span>
            <span className="mb-price"><Money amount={meal.price} lang={lang} suffix /></span>
          </div>
          <div className="mb-menu">
            {(meal.items || []).map((it) => FOODS[it] && (
              <span key={it} className="mb-item">{FOODS[it].emoji} {tr(FOODS[it], lang)}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function DetailScreen({ id, lang, setLang, onBack, onAdmin }) {
  const [bhoj,     setBhoj]     = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [sel,      setSel]      = useState(0);

  useEffect(() => {
    if (!id) return;
    publicApi.getBhojanshala(id, 7)
      .then(res => {
        setBhoj(res.data);
        setTimeline(res.timeline || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="empty-state">
          <div className="loading-spinner" />
          <p>{L('loading', lang)}</p>
        </div>
      </div>
    );
  }

  if (!bhoj) {
    return (
      <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="empty-state">
          <Icon name="info" size={32} stroke={1.6} />
          <p>{L('noData', lang)}</p>
          <button className="action-btn action-primary" onClick={onBack} style={{ marginTop: 16 }}>
            {L('backHome', lang)}
          </button>
        </div>
      </div>
    );
  }

  const selDay    = timeline[sel] ?? null;
  const closed    = !selDay || selDay.isClosed;
  const status    = computeStatus(timeline[0]);  // today's status
  const facilities = bhojFacilities(bhoj);
  const notice    = bhojNotice(bhoj, lang);
  const specialNotice = selDay?.specialNotice ?? null;

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
            </div>
            <h1 className="detail-name">{bhojName(bhoj, lang)}</h1>
            <div className="detail-sub">
              <Stars value={bhoj.rating} size={14} />
              <span className="rev">{bhoj.reviewCount} {L('reviews', lang)}</span>
            </div>
          </div>
        </div>

        {/* ── Two-column body on desktop ── */}
        <div className="detail-body">
          <div className="detail-grid">

            {/* LEFT col */}
            <div className="detail-col-main">
              {bhojAddress(bhoj, lang) && (
                <div className="addr-row">
                  <Icon name="pin" size={17} stroke={2} style={{ color: 'var(--saffron)', marginTop: 2 }} />
                  <span>{bhojAddress(bhoj, lang)}</span>
                </div>
              )}
              {bhoj.phone && (
                <div className="phone-row">
                  <Icon name="phone" size={16} stroke={2} style={{ color: 'var(--saffron)' }} />
                  <span>{bhoj.phone}</span>
                </div>
              )}

              <div className="detail-actions">
                <ActionBtn icon="nav"   label={L('directions', lang)} variant="primary" />
                <ActionBtn icon="phone" label={L('call', lang)}       variant="ghost" />
                <ActionBtn icon="share" label={L('share', lang)}      variant="ghost" />
              </div>

              {notice && (
                <div className="notice-card">
                  <span className="notice-ic">⚠</span>
                  <div>
                    <span className="notice-label">{L('notice', lang)}</span>
                    <p>{notice}</p>
                  </div>
                </div>
              )}

              {/* Tiffin */}
              <section className="section">
                <h2 className="section-title"><span className="st-accent" />{L('tiffinTitle', lang)}</h2>
                <div className={'tiffin-card' + (bhoj.tiffin?.available ? '' : ' tiffin-off')}>
                  <span className="tiffin-ic">🥡</span>
                  {bhoj.tiffin?.available ? (
                    <div>
                      <span className="tiffin-yes">{L('available', lang)}</span>
                      <p>{bhoj.tiffin.type === 'OWN' ? L('tiffinOwn', lang) : L('tiffinProv', lang)}</p>
                    </div>
                  ) : (
                    <p className="tiffin-no">{L('tiffinNo', lang)}</p>
                  )}
                </div>
              </section>

              {/* Facilities */}
              {facilities.length > 0 && (
                <section className="section">
                  <h2 className="section-title"><span className="st-accent" />{L('facilities', lang)}</h2>
                  <div className="facility-grid">
                    {facilities.map((f) => <Facility key={f} name={f} lang={lang} />)}
                  </div>
                </section>
              )}

              <div className="trust-badge">
                <span className="trust-pulse" />
                <div>
                  <span className="trust-line">{bhojArea(bhoj, lang)} · {bhojCity(bhoj, lang)}</span>
                  <span className="trust-by">{L('updatedBy', lang)}: {L('admin', lang)}</span>
                </div>
              </div>
            </div>

            {/* RIGHT col: 7-day timeline */}
            <div className="detail-col-side">
              <section className="section section-first">
                <h2 className="section-title"><span className="st-accent" />{L('sevenDay', lang)}</h2>
                <div className="timeline">
                  {timeline.map((day, idx) => {
                    const d = new Date(day.date);
                    const dow = d.getDay();
                    return (
                      <button
                        key={idx}
                        className={'tl-day' + (sel === idx ? ' tl-on' : '') + (day.isClosed ? ' tl-closed' : '')}
                        onClick={() => setSel(idx)}>
                        <span className="tl-wd">{WEEKDAYS.short[lang][dow]}</span>
                        <span className="tl-date">{d.getDate()}</span>
                        <span className="tl-mark">{day.isClosed ? '×' : '•'}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="timeline-panel" key={sel}>
                  {(specialNotice) && (
                    <div className="notice-card" style={{ marginBottom: 12 }}>
                      <span className="notice-ic">ℹ</span>
                      <p>{specialNotice}</p>
                    </div>
                  )}

                  {closed ? (
                    <div className="closed-card">
                      <span className="closed-emoji">🔴</span>
                      <h3>{L('closedToday', lang)}</h3>
                      <p>{L('noMeals', lang)}</p>
                      {nextOpenInfo(timeline, sel, lang) && (
                        <div className="next-open">
                          {L('nextOpen', lang)}: <strong>{nextOpenInfo(timeline, sel, lang)}</strong>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="meal-stack">
                      <MealBlock k="breakfast" icon="sun"  meal={selDay?.meals.breakfast} lang={lang} />
                      <MealBlock k="lunch"     icon="bowl" meal={selDay?.meals.lunch}     lang={lang} />
                      <MealBlock k="dinner"    icon="moon" meal={selDay?.meals.dinner}    lang={lang} />
                    </div>
                  )}
                </div>
              </section>

              {/* Contact */}
              <section className="section contact">
                <h2 className="section-title"><span className="st-accent" />{L('needHelp', lang)}</h2>
                <div className="contact-grid">
                  <a className="contact-item" href={bhoj.phone ? `tel:${bhoj.phone}` : undefined}>
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
