import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createSeed } from '../src/lib/seed-data';
import { TOUR_STEPS, tourText } from '../src/lib/tour-steps';

const seed = createSeed();
const onboardingIds = seed.onboardingCases.map(c => c.id);
const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

// The source file(s) that must carry each step's data-tour attribute.
function sourceFor(page: string): string {
  // The layout and the sidebar parts it draws appear on every page.
  const layout = read('src/app/layout.tsx') + read('src/components/sidebar-nav.tsx') + read('src/components/reset-demo-button.tsx');
  if (page === '/') return read('src/app/page.tsx') + layout;
  if (page.startsWith('/onboarding/')) return read('src/app/onboarding/[id]/page.tsx') + layout;
  if (page === '/controls') return read('src/app/controls/page.tsx') + layout;
  throw new Error(`Unknown tour page ${page}`);
}

describe('tour steps', () => {
  it('has 25 steps, and only the first two (About this demo, Welcome) and the last are centred', () => {
    expect(TOUR_STEPS).toHaveLength(25);
    expect(TOUR_STEPS.map(step => step.target === null)).toEqual(TOUR_STEPS.map((_, index) => index <= 1 || index === 24));
  });

  it('visits every page of the app', () => {
    expect(new Set(TOUR_STEPS.map(step => step.page.split('/')[1]))).toEqual(new Set(['', 'onboarding', 'controls']));
  });

  it('only visits pages that exist in the demo data', () => {
    for (const step of TOUR_STEPS) {
      const [, section, id] = step.page.split('/');
      if (step.page === '/' || step.page === '/controls') continue;
      if (section === 'onboarding') expect(onboardingIds).toContain(id);
      else throw new Error(`Unknown tour page ${step.page}`);
    }
  });

  it('never points two steps at the same element on one page', () => {
    const seen = new Set<string>();
    for (const step of TOUR_STEPS) {
      if (!step.target) continue;
      const key = `${step.page}#${step.target}`;
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
    }
  });

  it('points every step at an element tagged in the page source', () => {
    for (const step of TOUR_STEPS) {
      if (!step.target) continue;
      expect(sourceFor(step.page), `${step.page} ${step.target}`).toContain(`data-tour="${step.target}"`);
    }
  });

  it('tags the phone-layout target of a step in the page source too', () => {
    for (const step of TOUR_STEPS) {
      if (!step.phoneTarget) continue;
      expect(sourceFor(step.page), `${step.page} ${step.phoneTarget}`).toContain(`'${step.phoneTarget}'`);
    }
  });

  it('has a short title and short text, online and local, for every step', () => {
    for (const step of TOUR_STEPS) {
      expect(step.title.trim().length).toBeGreaterThan(0);
      for (const publicDemo of [false, true]) {
        const text = tourText(step, publicDemo);
        expect(text.trim().length, step.title).toBeGreaterThan(0);
        expect(text.length, step.title).toBeLessThanOrEqual(330);
      }
    }
  });

  it('uses the online wording only where it is given', () => {
    const step = TOUR_STEPS.find(item => item.onlineText)!;
    expect(tourText(step, true)).toBe(step.onlineText);
    expect(tourText(step, false)).toBe(step.text);
    const plain = TOUR_STEPS.find(item => !item.onlineText)!;
    expect(tourText(plain, true)).toBe(plain.text);
  });

  it('keeps the role-switch step working online: it invites a role switch instead of saying it is off', () => {
    const step = TOUR_STEPS.find(item => item.target === 'role-switcher')!;
    expect(tourText(step, true)).toContain('Try the role switch');
    expect(tourText(step, true)).not.toContain('turned off');
  });

  it('explains KYC, sanctions and PEP where they first appear', () => {
    const first = (word: string) => TOUR_STEPS.findIndex(step => step.text.includes(word));
    expect(TOUR_STEPS[first('KYC')].text).toContain('know your customer');
    expect(TOUR_STEPS[first('sanctions')].text).toMatch(/sanctions list \(/);
    expect(TOUR_STEPS[first('PEP')].text).toContain('politically exposed person');
  });
});
