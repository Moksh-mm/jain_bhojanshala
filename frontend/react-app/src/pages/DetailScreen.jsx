import { useState, useEffect } from 'react';
import {
  WEEKDAYS,
  computeStatus, bhojName, bhojArea, bhojCity,
  bhojNotice, bhojFacilities, formatMealTime, nextOpenInfo,
  L,
} from '../data/data';
import { Icon, Stars, Money, LangSwitch, ImagePlaceholder } from '../components/shared';
import { publicApi } from '../lib/api';

/* ─── Facility emoji map ─────────────────────────────────────────── */
const FAC_META = {
  parking:     { e: '🚗', gu: 'પાર્કિંગ',        en: 'Parking'        },
  water:       { e: '💧', gu: 'પીવાનું પાણી',    en: 'Drinking Water' },
  boilWater:   { e: '♨️', gu: 'ઉ. પાણી',         en: 'Boiled Water'   },
  washroom:    { e: '🚻', gu: 'વૉશરૂમ',          en: 'Washroom'       },
  dharamshala: { e: '🛏', gu: 'ધર્મશાળા',        en: 'Dharamshala'    },
  wheelchair:  { e: '♿', gu: 'વ્હીલચેર',        en: 'Wheelchair'     },
  temple:      { e: '🛕', gu: 'મંદિર',            en: 'Temple nearby'  },
  family:      { e: '👨‍👩‍👧', gu: 'કૌટુંબિક',  en: 'Family'         },
  ekashnu:     { e: '🍱', gu: 'એકાસણું',         en: 'Ekasanu'        },
  biaasanu:    { e: '🥘', gu: 'બીઆશણ',           en: 'Biyasanu'       },
  ambil:       { e: '🥣', gu: 'આયંબિલ',          en: 'Ambil'          },
  tirth:       { e: '🙏', gu: 'તીર્થ',            en: 'Tirth'          },
  upashray:    { e: '🏠', gu: 'ઉપાશ્રય',         en: 'Upashray'       },
};

/* ─── Photo gallery ──────────────────────────────────────────────── */
function Gallery({ photos, alt }) {
  const [idx, setIdx] = useState(0);
  if (!photos?.length) return null;
  const prev = () => setIdx(i => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx(i => (i + 1) % photos.length);
  return (
    <div className="dt-gallery">
      <div className="dt-gallery-main">
        <img src={photos[idx]} alt={alt} className="dt-gallery-img" loading="lazy" />
        {photos.length > 1 && (
          <>
            <button className="dt-gallery-arrow left" onClick={prev} aria-label="Previous">‹</button>
            <button className="dt-gallery-arrow right" onClick={next} aria-label="Next">›</button>
            <div className="dt-gallery-dots">
              {photos.map((_, i) => (
                <button key={i} className={'dt-gallery-dot' + (idx === i ? ' on' : '')} onClick={() => setIdx(i)} aria-label={`Photo ${i + 1}`} />
              ))}
            </div>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <div className="dt-gallery-thumbs">
          {photos.map((url, i) => (
            <button key={i} className={'dt-thumb-btn' + (idx === i ? ' on' : '')} onClick={() => setIdx(i)}>
              <img src={url} alt={alt} className="dt-thumb-img" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Large meal card ────────────────────────────────────────────── */
function MealCard({ emoji, labelKey, meal, lang }) {
  const on = meal?.enabled;
  return (
    <div className={'dt-meal-card' + (on ? ' on' : ' off')}>
      <span className="dt-meal-emoji">{emoji}</span>
      <div className="dt-meal-body">
        <div className="dt-meal-row">
          <span className="dt-meal-name">{L(labelKey, lang)}</span>
          <span className={'dt-meal-status ' + (on ? 'on' : 'off')}>
            {on ? '✓ ' + L('available', lang) : '✗ ' + L('notAvail', lang)}
          </span>
        </div>
        {on && (meal.startTime || meal.price != null) && (
          <div className="dt-meal-meta">
            {meal.startTime && (
              <span className="dt-meal-time">
                <Icon name="clock" size={13} stroke={2} />
                {formatMealTime(meal)}
              </span>
            )}
            {meal.price != null && (
              <span className="dt-meal-price">
                <Money amount={meal.price} lang={lang} suffix />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Bhojanshala tab ────────────────────────────────────────────── */
function BhojTab({ bhoj, availability, sel, setSel, lang }) {
  const selDay  = availability[sel] ?? null;
  const closed  = !selDay || selDay.isClosed;
  const notice  = bhojNotice(bhoj, lang);
  const facList = bhojFacilities(bhoj);

  return (
    <div className="dt-bhoj-layout">

      {/* Left column: calendar + meals */}
      <div className="dt-col-left">
        {notice && (
          <div className="dt-notice-card">
            <span className="dt-notice-ic">⚠️</span>
            <div>
              <span className="dt-notice-label">{L('notice', lang)}</span>
              <p className="dt-notice-text">{notice}</p>
            </div>
          </div>
        )}

        <div className="dt-card">
          <h3 className="dt-card-title">📅 {L('sevenDay', lang)}</h3>
          <div className="dt-date-row">
            {availability.map((day, i) => {
              const d    = new Date(day.date + 'T00:00:00Z');
              const dow  = d.getUTCDay();
              const dt   = d.getUTCDate();
              const open = !day.isClosed && [day.navkarshi, day.lunch, day.chovihar].some(m => m?.enabled);
              return (
                <button
                  key={i}
                  className={'dt-date' + (sel === i ? ' on' : '') + (day.isClosed ? ' closed' : '')}
                  onClick={() => setSel(i)}
                >
                  <span className="dt-date-wd">{WEEKDAYS.short[lang][dow]}</span>
                  <span className="dt-date-num">{dt}</span>
                  <span className={'dt-date-pip ' + (day.isClosed ? 'red' : open ? 'green' : 'orange')} />
                </button>
              );
            })}
          </div>

          <div className="dt-meals" key={sel}>
            {selDay?.specialNotice && (
              <div className="dt-day-notice">ℹ️ {selDay.specialNotice}</div>
            )}
            {closed ? (
              <div className="dt-closed-card">
                <div className="dt-closed-icon">🔴</div>
                <div>
                  <strong>{L('closedToday', lang)}</strong>
                  <p>{L('noMeals', lang)}</p>
                  {nextOpenInfo(availability, sel, lang) && (
                    <p className="dt-next-open">
                      {L('nextOpen', lang)}: <strong>{nextOpenInfo(availability, sel, lang)}</strong>
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <MealCard emoji="☀️" labelKey="breakfast" meal={selDay?.navkarshi} lang={lang} />
                <MealCard emoji="🥣" labelKey="ayambil"  meal={selDay?.ayambil}   lang={lang} />
                <MealCard emoji="🍽" labelKey="lunch"     meal={selDay?.lunch}     lang={lang} />
                <MealCard emoji="🌙" labelKey="dinner"    meal={selDay?.chovihar}  lang={lang} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right column: tiffin + facilities */}
      <div className="dt-col-right">
        <div className="dt-card">
          <h3 className="dt-card-title">🥡 {L('tiffinTitle', lang)}</h3>
          <div className={'dt-tiffin' + (bhoj.tiffin?.available ? ' on' : ' off')}>
            <span className="dt-tiffin-icon">🥡</span>
            {bhoj.tiffin?.available ? (
              <div>
                <p className="dt-tiffin-yes">{L('available', lang)}</p>
                <p className="dt-tiffin-sub">
                  {bhoj.tiffin.type === 'OWN' ? L('tiffinOwn', lang) : L('tiffinProv', lang)}
                </p>
              </div>
            ) : (
              <p className="dt-tiffin-no">{L('tiffinNo', lang)}</p>
            )}
          </div>
        </div>

        {facList.length > 0 && (
          <div className="dt-card">
            <h3 className="dt-card-title">✨ {L('facilities', lang)}</h3>
            <div className="dt-fac-grid">
              {facList.map(key => {
                const f = FAC_META[key];
                if (!f) return null;
                return (
                  <div key={key} className="dt-fac-cell">
                    <span className="dt-fac-emoji">{f.e}</span>
                    <span className="dt-fac-label">{lang === 'gu' ? f.gu : f.en}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Service tab (Dharmashala / Derasar) ────────────────────────── */
function ServiceTabContent({ icon, titleGu, titleEn, desc, photos, directionsUrl, phone, whatsapp, lang }) {
  const title = lang === 'gu' ? titleGu : titleEn;
  return (
    <div className="dt-svc-page">
      <div className="dt-svc-hero">
        <span className="dt-svc-big-icon">{icon}</span>
        <h2 className="dt-svc-title">{title}</h2>
      </div>

      {desc ? (
        <div className="dt-card dt-svc-desc">
          <p className="dt-svc-desc-text">{desc}</p>
        </div>
      ) : null}

      {photos?.length > 0 && <Gallery photos={photos} alt={title} />}

      <div className="dt-svc-btns">
        {directionsUrl && (
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="dt-svc-btn primary">
            <Icon name="nav" size={20} stroke={2} />{L('directions', lang)}
          </a>
        )}
        {phone && (
          <a href={`tel:${phone}`} className="dt-svc-btn ghost">
            <Icon name="phone" size={20} stroke={2} />{L('call', lang)}
          </a>
        )}
        {whatsapp && (
          <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="dt-svc-btn wa">
            <Icon name="whatsapp" size={20} stroke={2} />{L('whatsapp', lang)}
          </a>
        )}
      </div>
    </div>
  );
}

function EmptyTab({ icon, msgGu, msgEn, lang }) {
  return (
    <div className="dt-empty-tab">
      <span className="dt-empty-icon">{icon}</span>
      <p>{lang === 'gu' ? msgGu : msgEn}</p>
    </div>
  );
}

/* ─── Main screen ────────────────────────────────────────────────── */
export default function DetailScreen({ id, lang, setLang, onBack }) {
  const [bhoj,         setBhoj]         = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState('bhoj');
  const [sel,          setSel]          = useState(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setBhoj(null);
    setAvailability([]);
    setSel(0);
    setActiveTab('bhoj');
    publicApi.getBhojanshala(id, 7)
      .then(res => {
        setBhoj(res.data);
        setAvailability(res.availability || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="screen dt-loading">
      <div className="loading-spinner" />
      <p>{L('loading', lang)}</p>
    </div>
  );

  if (!bhoj) return (
    <div className="screen dt-loading">
      <Icon name="info" size={36} stroke={1.5} />
      <p style={{ marginTop: 12 }}>{L('noData', lang)}</p>
      <button className="dt-back-link" onClick={onBack} style={{ marginTop: 16 }}>
        ← {L('backHome', lang)}
      </button>
    </div>
  );

  const today       = availability[0];
  const todayStatus = computeStatus(today);
  const hasDharam   = !!bhoj.dharamshala?.available;
  const hasDerasar  = !!bhoj.derasar?.available;

  // Collect all photos for a potential header gallery (future use)
  const heroImg = bhoj.coverImage || null;

  const TABS = [
    { key: 'bhoj',        icon: '🍛', gu: 'ભોજનશાળા', en: 'Bhojanshala', enabled: true      },
    { key: 'dharamshala', icon: '🛏', gu: 'ધર્મશાળા',  en: 'Dharamshala', enabled: hasDharam },
    { key: 'derasar',     icon: '🛕', gu: 'દેરાસર',    en: 'Derasar',     enabled: hasDerasar},
  ];

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: bhojName(bhoj, lang), url: window.location.href }).catch(() => {});
    }
  };

  return (
    <div className="screen">
      <div className="dt-page">

        {/* ════════════ HERO ════════════ */}
        <div className="dt-hero">
          {/* Image layer */}
          <div className="dt-hero-img-wrap">
            {heroImg
              ? <img src={heroImg} alt={bhojName(bhoj, lang)} className="dt-hero-img" />
              : (
                <div className="dt-hero-placeholder">
                  <span className="dt-hero-placeholder-icon">🛕</span>
                </div>
              )
            }
            <div className="dt-hero-grad" />
          </div>

          {/* Top controls */}
          <div className="dt-hero-top">
            <button className="dt-back-btn" onClick={onBack} aria-label="Back">
              <Icon name="back" size={20} stroke={2.4} />
            </button>
            <div className="dt-hero-top-right">
              <LangSwitch lang={lang} setLang={setLang} />
              <button className="dt-icon-btn" onClick={handleShare} title="Share">
                <Icon name="share" size={17} stroke={2} />
              </button>
            </div>
          </div>

          {/* Bottom overlay */}
          <div className="dt-hero-foot">
            <div className="dt-hero-left">
              <p className="dt-hero-loc">
                📍 {[bhojArea(bhoj, lang), bhojCity(bhoj, lang)].filter(Boolean).join(' · ')}
              </p>
              <h1 className="dt-hero-name">{bhojName(bhoj, lang)}</h1>
              <div className="dt-hero-badges">
                <span className="dt-hero-badge">🍛 {lang === 'gu' ? 'ભોજનશાળા' : 'Bhojanshala'}</span>
                {hasDharam  && <span className="dt-hero-badge">🛏 {lang === 'gu' ? 'ધર્મશાળા' : 'Dharamshala'}</span>}
                {hasDerasar && <span className="dt-hero-badge">🛕 {lang === 'gu' ? 'દેરાસર' : 'Derasar'}</span>}
              </div>
            </div>

            {/* Floating status card */}
            <div className={'dt-status-card dt-sc-' + todayStatus}>
              <div className="dt-sc-top">
                <span className={'dt-sc-dot dt-sc-' + todayStatus} />
                <span className="dt-sc-headline">
                  {today?.isClosed
                    ? (lang === 'gu' ? 'આજે બંધ' : 'Closed today')
                    : todayStatus === 'open'
                      ? (lang === 'gu' ? 'આજે ખુલ્લું' : 'Open today')
                      : (lang === 'gu' ? 'આંશિક ખુલ્લું' : 'Partial')
                  }
                </span>
              </div>
              <div className="dt-sc-meals">
                {[
                  { meal: today?.navkarshi, gu: 'ન.',   en: 'N' },
                  { meal: today?.lunch,     gu: 'બ.',   en: 'L' },
                  { meal: today?.chovihar,  gu: 'ચ.',   en: 'C' },
                ].map(({ meal, gu, en }, i) => (
                  <span key={i} className={'dt-sc-meal ' + (meal?.enabled ? 'on' : 'off')}>
                    {meal?.enabled ? '✓' : '✗'} {lang === 'gu' ? gu : en}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ════════════ QUICK ACTIONS ════════════ */}
        <div className="dt-quick-bar">
          {[
            { icon: 'nav',      gu: 'માર્ગ',     en: 'Directions', href: bhoj.directionsUrl,                                                          target: '_blank'    },
            { icon: 'phone',    gu: 'કૉલ',       en: 'Call',       href: bhoj.phone ? `tel:${bhoj.phone}` : null                                                          },
            { icon: 'whatsapp', gu: 'WhatsApp',  en: 'WhatsApp',   href: bhoj.whatsappNumber ? `https://wa.me/${bhoj.whatsappNumber.replace(/\D/g,'')}` : null, target: '_blank' },
            { icon: 'share',    gu: 'શેર',       en: 'Share',      onClick: handleShare                                                                                    },
          ].map((a, i) => {
            const El = a.href ? 'a' : 'button';
            return (
              <El
                key={i}
                className={'dt-qbtn' + (!a.href && !a.onClick ? ' dt-qbtn-dim' : '')}
                href={a.href || undefined}
                target={a.target || undefined}
                rel={a.target ? 'noopener noreferrer' : undefined}
                onClick={a.onClick || undefined}
              >
                <span className="dt-qbtn-icon"><Icon name={a.icon} size={22} stroke={1.8} /></span>
                <span className="dt-qbtn-label">{lang === 'gu' ? a.gu : a.en}</span>
              </El>
            );
          })}
        </div>

        {/* ════════════ SERVICE TABS ════════════ */}
        <div className="dt-tabs-wrap">
          <div className="dt-tabs">
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={'dt-tab' + (activeTab === tab.key ? ' dt-tab-on' : '') + (!tab.enabled ? ' dt-tab-dim' : '')}
                onClick={() => tab.enabled && setActiveTab(tab.key)}
                disabled={!tab.enabled}
              >
                <span className="dt-tab-icon">{tab.icon}</span>
                <span className="dt-tab-label">{lang === 'gu' ? tab.gu : tab.en}</span>
                {!tab.enabled && <span className="dt-tab-na">{lang === 'gu' ? 'ઉ.નથી' : 'N/A'}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* ════════════ TAB CONTENT ════════════ */}
        <div className="dt-content">
          {activeTab === 'bhoj' && (
            <BhojTab bhoj={bhoj} availability={availability} sel={sel} setSel={setSel} lang={lang} />
          )}

          {activeTab === 'dharamshala' && (
            hasDharam
              ? <ServiceTabContent
                  icon="🛏" titleGu="ધર્મશાળા" titleEn="Dharamshala"
                  desc={bhoj.dharamshala?.description}
                  photos={bhoj.dharamshala?.photos}
                  directionsUrl={bhoj.dharamshala?.directionsUrl}
                  phone={bhoj.phone} whatsapp={bhoj.whatsappNumber}
                  lang={lang}
                />
              : <EmptyTab icon="🛏" msgGu="ધર્મશાળા ઉપલબ્ધ નથી." msgEn="Dharamshala not available." lang={lang} />
          )}

          {activeTab === 'derasar' && (
            hasDerasar
              ? <ServiceTabContent
                  icon="🛕" titleGu="દેરાસર" titleEn="Derasar"
                  desc={bhoj.derasar?.description}
                  photos={bhoj.derasar?.photos}
                  directionsUrl={bhoj.derasar?.directionsUrl}
                  phone={bhoj.phone} whatsapp={bhoj.whatsappNumber}
                  lang={lang}
                />
              : <EmptyTab icon="🛕" msgGu="દેરાસર માહિતી ઉપલબ્ધ નથી." msgEn="Derasar information not available." lang={lang} />
          )}
        </div>

        {/* ════════════ VERIFIED FOOTER ════════════ */}
        <div className="dt-footer">
          <span className="dt-verified">
            ✅ {lang === 'gu' ? 'ભોજનશાળા એડ્મિન દ્વારા ચકાસાયેલ' : 'Verified by Bhojanshala Admin'}
          </span>
          <Stars value={bhoj.rating} size={13} />
          <span className="dt-footer-rev">{bhoj.reviewCount} {L('reviews', lang)}</span>
        </div>

        <div className="dt-scroll-pad" />
      </div>

      {/* ════════════ FLOATING MOBILE NAV ════════════ */}
      <nav className="dt-float-bar">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={'dt-fb-btn' + (activeTab === tab.key ? ' on' : '') + (!tab.enabled ? ' dim' : '')}
            onClick={() => tab.enabled && setActiveTab(tab.key)}
            disabled={!tab.enabled}
          >
            <span className="dt-fb-icon">{tab.icon}</span>
            <span className="dt-fb-label">{lang === 'gu' ? tab.gu : tab.en}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
