'use client';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// Shows "Loading…" as soon as an in-app link is clicked, and hides it when the new page arrives.
// (A loading.tsx file would also give instant feedback, but it makes missing pages answer 200 instead of 404.)
export function NavigationProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const current = `${pathname}?${search}`;
  // The address that was showing when the link was clicked; the badge shows until the address changes.
  const [clickedOn, setClickedOn] = useState<string | null>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest('a');
      if (!link || link.target || link.hasAttribute('download')) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      setClickedOn(`${window.location.pathname}?${new URLSearchParams(window.location.search).toString()}`);
    }
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return clickedOn === current ? <div className="navprogress" role="status">Loading…</div> : null;
}
