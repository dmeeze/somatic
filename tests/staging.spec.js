// @ts-check
const { test, expect } = require('@playwright/test');

const BASE = 'https://drewmayo.com/somatic-staging/';

test('page loads with correct title', async ({ page }) => {
  await page.goto(BASE);
  await expect(page).toHaveTitle('Somatic');
});

test('home screen is visible', async ({ page }) => {
  await page.goto(BASE);
  await expect(page.locator('#home')).toBeVisible();
});

test('CSS and JS load without errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const failedResources = [];
  page.on('response', (response) => {
    if (response.status() >= 400) {
      failedResources.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto(BASE);
  await page.waitForLoadState('networkidle');

  expect(errors, `JS errors: ${errors.join(', ')}`).toHaveLength(0);
  expect(failedResources, `Failed resources: ${failedResources.join(', ')}`).toHaveLength(0);
});

test('app renders home screen content', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const home = page.locator('#home');
  await expect(home).not.toBeEmpty();
});

test('service worker registers', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  const swRegistered = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false;
    const reg = await navigator.serviceWorker.getRegistration();
    return !!reg;
  });
  expect(swRegistered).toBe(true);
});
