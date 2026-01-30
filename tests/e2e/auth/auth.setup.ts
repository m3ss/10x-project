import { test as setup, expect } from '@playwright/test';
import { getTestUser } from '../helpers/test-helpers';
import { LoginPage } from '../pages/LoginPage';

const authFile = '.auth/user.json';

/**
 * Global setup for authentication
 * This runs once before all tests and saves the authenticated state
 */
setup('authenticate', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const testUser = getTestUser();
  
  // Navigate to login page
  await loginPage.goto();
  
  // Perform login using the login method
  await loginPage.login(testUser.email, testUser.password);
  
  // Wait for successful redirect
  await page.waitForTimeout(5000);
  
  // Verify we're logged in
  const url = page.url();
  expect(url).toMatch(/\/(my-flashcards|generate)/);
  
  // Save signed-in state to file
  await page.context().storageState({ path: authFile });
  
  console.log('✓ Authentication state saved to', authFile);
});
