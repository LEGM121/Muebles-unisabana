import { test, expect } from '@playwright/test';

test('La página principal abre', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL('http://localhost:5173/');
});