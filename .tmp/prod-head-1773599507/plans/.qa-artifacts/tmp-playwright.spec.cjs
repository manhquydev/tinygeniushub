const { test, expect } = require('@playwright/test');

test('home title', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page).toHaveTitle(/Cùng Con T? H?c/);
});