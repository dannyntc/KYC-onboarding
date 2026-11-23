import { test, expect, type Page } from '@playwright/test';

const SAVE_BUTTONS = ['Save review', 'Request information', 'Escalate case', /^Generate .*memo$/];

async function switchRole(page: Page, role: 'read-only' | 'analyst') {
  await page.getByLabel('Demo role (not authentication)').selectOption(role);
  await page.getByRole('button', { name: 'Switch role' }).click();
  await expect(page.getByLabel('Demo role (not authentication)')).toHaveValue(role);
}

test('the alert page hides every action for the read-only role and shows them again for the analyst', async ({ page }) => {
  await page.goto('/cases/ALT-001');
  await switchRole(page, 'read-only');

  for (const name of SAVE_BUTTONS) await expect(page.getByRole('button', { name })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Add draft to analyst note' })).toHaveCount(0);
  await expect(page.getByText('The read-only role cannot change cases.')).toBeVisible();
  await expect(page.getByLabel('ANALYST NOTE / REASON FOR ACTION')).toHaveAttribute('readonly', '');

  // Put the demo role back to the analyst so nothing else depends on this test.
  await switchRole(page, 'analyst');
  for (const name of SAVE_BUTTONS) await expect(page.getByRole('button', { name })).toBeEnabled();
  await expect(page.getByText('The read-only role cannot change cases.')).toHaveCount(0);
  await expect(page.getByLabel('ANALYST NOTE / REASON FOR ACTION')).not.toHaveAttribute('readonly', '');
});
