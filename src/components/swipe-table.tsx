'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

// A table that scrolls sideways when it is wider than its box. Only when that happens (on any screen size)
// a short hint and a soft fade at the right edge tell the visitor there is more to see. The fade goes away
// once they reach the last column. Both start hidden so the first render matches the server's.
export function SwipeTable({ children }: { children: ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const measure = () => {
      setOverflowing(wrap.scrollWidth > wrap.clientWidth);
      setAtEnd(wrap.scrollLeft + wrap.clientWidth >= wrap.scrollWidth - 1);
    };

    // The observer reports once as soon as it starts watching, which gives the first measurement.
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    if (wrap.firstElementChild) observer.observe(wrap.firstElementChild);
    wrap.addEventListener('scroll', measure, { passive: true });
    return () => {
      observer.disconnect();
      wrap.removeEventListener('scroll', measure);
    };
  }, []);

  return (
    <div className={`swipe${overflowing ? ' overflowing' : ''}${atEnd ? ' at-end' : ''}`}>
      <p className="swipe-hint">Scroll sideways to see all columns →</p>
      <div className="tablewrap" ref={wrapRef}>
        {children}
      </div>
    </div>
  );
}
