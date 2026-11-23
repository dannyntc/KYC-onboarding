'use client';

import 'driver.js/dist/driver.css';
import { Suspense, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { driver, type Driver } from 'driver.js';
import { TOUR_STEPS, tourText } from '@/lib/tour-steps';

// Remembers that this browser has already been offered the tour, so it is only auto-offered once.
export const TOUR_SEEN_KEY = 'kyc-onboarding-tour-seen';
const TARGET_WAIT_MS = 3000;
// Must match the phone breakpoint in globals.css.
const PHONE_QUERY = '(max-width: 600px)';

function tourSeen(): boolean {
  try {
    return localStorage.getItem(TOUR_SEEN_KEY) === '1';
  } catch {
    return true; // No storage (private mode): never auto-open, the sidebar link still works.
  }
}

function markTourSeen() {
  try {
    localStorage.setItem(TOUR_SEEN_KEY, '1');
  } catch {
    // Nothing to do: the tour just may be offered again next time.
  }
}

// Removes ?tour=... from the address without reloading the page.
function removeTourFromAddress() {
  const params = new URLSearchParams(window.location.search);
  params.delete('tour');
  const query = params.toString();
  window.history.replaceState(null, '', window.location.pathname + (query ? `?${query}` : ''));
}

function endTour() {
  markTourSeen();
  removeTourFromAddress();
}

// The tour lives in the address: ?tour=N means "show step N on this page". That needs no
// database, survives a reload, and moves between pages by simply opening the next address.
function TourController({ publicDemo }: { publicDemo: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const tourParam = useSearchParams().get('tour');
  const number = tourParam === null ? 0 : Number(tourParam);
  const step = Number.isInteger(number) ? TOUR_STEPS[number - 1] : undefined;

  // A first-time visitor to the queue is offered step 1, once.
  useEffect(() => {
    if (pathname !== '/' || tourParam !== null || tourSeen()) return;
    markTourSeen();
    window.history.replaceState(null, '', '/?tour=1');
  }, [pathname, tourParam]);

  useEffect(() => {
    if (!step) return;
    if (step.page !== pathname) {
      router.replace(`${step.page}?tour=${number}`);
      return;
    }

    const goTo = (target: number) => {
      const next = TOUR_STEPS[target - 1];
      if (next.page === pathname) window.history.replaceState(null, '', `${next.page}?tour=${target}`);
      else router.push(`${next.page}?tour=${target}`);
    };

    let timer: ReturnType<typeof setTimeout> | undefined;
    let bubble: Driver | undefined;
    const started = Date.now();

    // The page may still be drawing, so wait briefly for the element this step points at.
    const open = () => {
      const target = (window.matchMedia(PHONE_QUERY).matches && step.phoneTarget) || step.target;
      const element = target ? document.querySelector(`[data-tour="${target}"]`) : null;
      if (target && !element && Date.now() - started < TARGET_WAIT_MS) {
        timer = setTimeout(open, 50);
        return;
      }
      if (target && !element) console.warn(`[tour] step ${number}: "${target}" not found on ${pathname}`);
      const isFirst = number === 1;
      const isLast = number === TOUR_STEPS.length;
      const nextLabel = isFirst ? 'Start tour' : isLast ? 'Finish' : 'Next';
      bubble = driver({
        overlayClickBehavior: 'none',
        stagePadding: 6,
        steps: [
          {
            element: element ?? undefined,
            popover: {
              title: step.title,
              description: tourText(step, publicDemo),
              side: step.side ?? 'bottom',
              align: 'start',
              popoverClass: 'wg-tour',
              showProgress: true,
              progressText: `Step ${number} of ${TOUR_STEPS.length}`,
              showButtons: isFirst ? ['next', 'close'] : ['previous', 'next', 'close'],
              disableButtons: [],
              prevBtnText: 'Back',
              nextBtnText: nextLabel,
              doneBtnText: nextLabel,
              closeBtnLabel: 'Close tour',
              onNextClick: () => (isLast ? endTour() : goTo(number + 1)),
              onPrevClick: () => goTo(number - 1)
            }
          }
        ],
        // Closing with the cross, the Escape key or the overlay ends the tour for good.
        onDestroyed: (_element, _step, { reason }) => {
          if (reason === 'close' || reason === 'escape' || reason === 'overlay') endTour();
        }
      });
      bubble.drive();
    };
    open();

    return () => {
      clearTimeout(timer);
      if (bubble?.isActive()) bubble.destroy();
    };
  }, [step, number, pathname, publicDemo, router]);

  return null;
}

// useSearchParams needs a Suspense boundary so the rest of the page can still be built ahead of time.
export function GuidedTour({ publicDemo }: { publicDemo: boolean }) {
  return (
    <Suspense fallback={null}>
      <TourController publicDemo={publicDemo} />
    </Suspense>
  );
}
