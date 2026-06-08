import { useState } from 'react';
import HomeScreen   from './pages/HomeScreen';
import DetailScreen from './pages/DetailScreen';
import AdminApp     from './admin/AdminApp';
import { BottomNav } from './components/shared';
import { AuthProvider } from './auth/AuthContext';

function AppInner() {
  const [lang,  setLang]  = useState('gu');
  const [route, setRoute] = useState({ name: 'home' });

  const scrollTop = () =>
    setTimeout(() => {
      document.querySelectorAll('.scroll-area, .home-layout, .detail-scroll').forEach(
        (el) => (el.scrollTop = 0)
      );
    }, 30);

  const openDetail = (id) => { setRoute({ name: 'detail', id }); scrollTop(); };
  const goHome     = ()   => { setRoute({ name: 'home' });        scrollTop(); };
  const goAdmin    = ()   => { setRoute({ name: 'admin' });       scrollTop(); };

  if (route.name === 'admin') {
    return <AdminApp goHome={goHome} />;
  }

  let screen;
  if (route.name === 'detail') {
    screen = (
      <DetailScreen
        id={route.id} lang={lang} setLang={setLang}
        onBack={goHome} onAdmin={goAdmin}
      />
    );
  } else {
    screen = (
      <HomeScreen
        lang={lang} setLang={setLang}
        onOpen={openDetail} onAdmin={goAdmin}
      />
    );
  }

  return (
    <div className="app-shell" data-lang={lang}>
      <div className="route-fade" key={route.name + (route.id || '')}>
        {screen}
      </div>
      {route.name !== 'detail' && (
        <BottomNav active="home" lang={lang} onNav={() => goHome()} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
