import { test, expect, type Page } from '@playwright/test';

// Real clicks on the sidebar role switch, as a visitor would do them. (Earlier tests posted to
// /api/role directly, which skipped the browser's own origin and Referer headers.)
const PAGE_URL = '/onboarding/ONB-008';

async function switchRole(page: Page, role: string) {
  await page.getByLabel('Demo role (not authentication)').selectOption(role);
  await page.getByRole('button', { name: 'Switch role' }).click();
}

test('switching through all three roles by real click keeps the visitor on the same page', async ({ page }) => {
  await page.goto(PAGE_URL);

  await switchRole(page, 'read-only');
  await expect(page).toHaveURL(new RegExp(`${PAGE_URL}`));
  await expect(page.getByLabel('Demo role (not authentication)')).toHaveValue('read-only');
  await expect(page.getByText('The read-only role cannot change onboarding files.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Request information' })).toHaveCount(0);
  const refused = await page.request.post('/api/onboarding', {
    headers: { origin: 'http://127.0.0.1:3105' },
    form: { id: 'ONB-008', action: 'request-info', version: '0', note: 'Should not be saved' }
  });
  expect(refused.status()).toBe(403);

  await switchRole(page, 'senior-approver');
  await expect(page).toHaveURL(new RegExp(`${PAGE_URL}`));
  await expect(page.getByLabel('Demo role (not authentication)')).toHaveValue('senior-approver');
  await expect(page.getByRole('button', { name: 'Request information' })).toBeVisible();

  await switchRole(page, 'analyst');
  await expect(page).toHaveURL(new RegExp(`${PAGE_URL}`));
  await expect(page.getByLabel('Demo role (not authentication)')).toHaveValue('analyst');
  await expect(page.getByRole('button', { name: 'Request information' })).toBeVisible();
});

test('a role switch from another site is refused and does not set the cookie', async ({ page }) => {
  const response = await page.request.post('/api/role', {
    headers: { origin: 'https://evil.example' },
    form: { role: 'senior-approver' }
  });
  expect(response.status()).toBe(403);
  const cookies = await page.context().cookies();
  expect(cookies.find(cookie => cookie.name === 'demo-role')).toBeUndefined();
});

test('the redirect after a role switch only ever stays on this site', async ({ page }) => {
  const origin = 'http://127.0.0.1:3105';
  const redirectFor = async (referer?: string) => {
    const response = await page.request.post('/api/role', {
      headers: referer ? { origin, referer } : { origin },
      form: { role: 'analyst' },
      maxRedirects: 0
    });
    expect(response.status()).toBe(303);
    return response.headers().location;
  };
  expect(await redirectFor(`${origin}/?status=In%20progress`)).toBe(`${origin}/?status=In%20progress`);
  expect(await redirectFor('http://evil.example/steal')).toBe(`${origin}/`);
  expect(await redirectFor(`${origin}//evil.example/steal`)).toBe(`${origin}/`);
  expect(await redirectFor(`${origin}/\\evil.example`)).toBe(`${origin}/`);
  expect(await redirectFor('not a url')).toBe(`${origin}/`);
  expect(await redirectFor()).toBe(`${origin}/`);
});
