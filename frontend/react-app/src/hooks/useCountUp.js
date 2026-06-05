import { useEffect, useState } from 'react';

export function useCountUp(target, dur = 650) {
  const [n, setN] = useState(target);
  useEffect(() => {
    const reduce =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    const guard = setTimeout(finish, dur + 250);
    return () => { cancelAnimationFrame(raf); clearTimeout(guard); };
  }, [target, dur]);
  return n;
}
