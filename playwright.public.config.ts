import { defineConfig } from '@playwright/test';

// Runs the app in online (look-only) mode on a temp database. See scripts/e2e-public.mjs.
const baseURL = 'http://127.0.0.1:3108';

export default defineConfig({
  testDir: './e2e-public',
  testMatch: '**/*.e2e.ts',
  workers: 1,
  use: {
    baseURL,
    headless: true,
    // Pretend the guided tour has already been offered, so its pop-up does not cover the page.
    storageState: {
      cookies: [],
      origins: [{ origin: baseURL, localStorage: [{ name: 'kyc-onboarding-tour-off', value: '1' }] }]
    }
  },
  webServer: {
    command: 'npx next dev --hostname 127.0.0.1 --port 3108',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120000,
    env: { KYC_ONBOARDING_PUBLIC_DEMO: '1' }
  }
});
