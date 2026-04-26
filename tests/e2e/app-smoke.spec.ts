import { expect, test } from '@playwright/test';

test('opens the SimpleCAD start page', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId('app-shell')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'SimpleCAD' })).toBeVisible();
  await expect(page.getByTestId('start-new-drawing')).toBeVisible();
  await expect(page.getByTestId('start-open-file')).toBeVisible();
});
