/* ============================================================
   App — routing, language, tweaks, mounted in the iOS frame
   ============================================================ */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "font": "friendly",
  "roundness": "rounded",
  "density": "regular"
}/*EDITMODE-END*/;

const FONT_MAP = {
  friendly: "'Baloo Bhai 2', 'Mukta Vaani', sans-serif",
  clean:    "'Mukta Vaani', 'Baloo Bhai 2', sans-serif",
  neutral:  "'Hind Vadodara', 'Mukta Vaani', sans-serif",
};
const ROUND_MAP = {
  sharp:   { r: '10px', rs: '8px' },
  rounded: { r: '22px', rs: '14px' },
  soft:    { r: '30px', rs: '20px' },
};
const DENSITY_MAP = {
  compact: { pad: '12px', gap: '9px',  screen: '14px' },
  regular: { pad: '16px', gap: '13px', screen: '18px' },
  comfy:   { pad: '20px', gap: '17px', screen: '22px' },
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [lang, setLang] = React.useState('gu');
  const [route, setRoute] = React.useState({ name: 'home' });
  const [, bump] = React.useState(0);
  const today = new Date().getDay();

  const rm = ROUND_MAP[t.roundness] || ROUND_MAP.rounded;
  const dm = DENSITY_MAP[t.density] || DENSITY_MAP.regular;
  const vars = {
    '--font-display': FONT_MAP[t.font] || FONT_MAP.friendly,
    '--radius': rm.r, '--radius-sm': rm.rs,
    '--pad-card': dm.pad, '--gap': dm.gap, '--screen-pad': dm.screen,
  };

  const openDetail = (id) => { setRoute({ name: 'detail', id }); scrollTop(); };
  const goHome = () => { setRoute({ name: 'home' }); scrollTop(); };
  const goAdmin = () => { setRoute({ name: 'admin' }); scrollTop(); };
  function scrollTop() { setTimeout(() => { document.querySelectorAll('.scroll-area').forEach((s) => (s.scrollTop = 0)); }, 30); }

  let screen, navActive = 'home';
  if (route.name === 'detail') {
    screen = <DetailScreen b={window.BHOJ.find((x) => x.id === route.id)} lang={lang} setLang={setLang} today={today} onBack={goHome} onAdmin={goAdmin} />;
  } else if (route.name === 'admin') {
    screen = <AdminScreen lang={lang} setLang={setLang} onBack={goHome} onSaved={() => bump((v) => v + 1)} />;
  } else {
    screen = <HomeScreen lang={lang} setLang={setLang} today={today} onOpen={openDetail} onAdmin={goAdmin} />;
  }
  const showNav = route.name !== 'admin';

  return (
    <div className="stage">
      <div className="device-scale">
      <IOSDevice>
        <div className="app-root" data-lang={lang} style={vars}>
          <div className="route-fade" key={route.name + (route.id || '')}>{screen}</div>
          {showNav && (
            <BottomNav active={navActive} lang={lang}
              onNav={(k) => { if (k === 'help') { goHome(); } else { goHome(); } }} />
          )}
        </div>
      </IOSDevice>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label={lang === 'gu' ? 'ટાઈપોગ્રાફી' : 'Typography'} />
        <TweakRadio label={lang === 'gu' ? 'ગુજરાતી ફોન્ટ' : 'Gujarati font'} value={t.font}
          options={[{ value: 'friendly', label: 'Friendly' }, { value: 'clean', label: 'Clean' }, { value: 'neutral', label: 'Neutral' }]}
          onChange={(v) => setTweak('font', v)} />
        <TweakSection label={lang === 'gu' ? 'આકાર' : 'Shape & space'} />
        <TweakRadio label={lang === 'gu' ? 'ગોળાઈ' : 'Roundness'} value={t.roundness}
          options={[{ value: 'sharp', label: 'Sharp' }, { value: 'rounded', label: 'Rounded' }, { value: 'soft', label: 'Soft' }]}
          onChange={(v) => setTweak('roundness', v)} />
        <TweakRadio label={lang === 'gu' ? 'ઘનતા' : 'Density'} value={t.density}
          options={[{ value: 'compact', label: 'Compact' }, { value: 'regular', label: 'Regular' }, { value: 'comfy', label: 'Comfy' }]}
          onChange={(v) => setTweak('density', v)} />
        <TweakSection label={lang === 'gu' ? 'ભાષા' : 'Language'} />
        <TweakRadio label={lang === 'gu' ? 'ભાષા' : 'Language'} value={lang}
          options={[{ value: 'gu', label: 'ગુજરાતી' }, { value: 'en', label: 'English' }]}
          onChange={(v) => setLang(v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
