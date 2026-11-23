import type { ReactNode } from 'react';

// A table that scrolls sideways when it is wider than the screen. On phones only, a short hint and a
// soft fade at the right edge tell the visitor there is more to see (both are hidden in globals.css above 600px).
export function SwipeTable({ children }: { children: ReactNode }) {
  return (
    <div className="swipe">
      <p className="swipe-hint">Swipe sideways to see all columns →</p>
      <div className="tablewrap">{children}</div>
    </div>
  );
}
