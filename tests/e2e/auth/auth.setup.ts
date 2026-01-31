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
  
  console.log('🔐 Starting authentication setup...');
  console.log('📧 Using email:', testUser.email);
  
  // Navigate to login page
  await loginPage.goto();
  console.log('✓ Navigated to login page');
  
  // Perform login
  await loginPage.login(testUser.email, testUser.password);
  console.log('✓ Login form submitted');
  
  // Wait for successful navigation to either my-flashcards or generate page
  // Supabase auth can take time, so use longer timeout
  try {
    await page.waitForURL(/\/(my-flashcards|generate)/, { timeout: 30000 });
    console.log('✓ Successfully redirected after login');
  } catch (error) {
    console.error('✗ Failed to redirect after login');
    console.error('Current URL:', page.url());
    
    // Check if there's an error message
    const hasError = await loginPage.hasError();
    if (hasError) {
      const errorMsg = await loginPage.getErrorMessage();
      console.error('Login error:', errorMsg);
    }
    throw error;
  }
  
  // Verify we're logged in
  const url = page.url();
  expect(url).toMatch(/\/(my-flashcards|generate)/);
  
  // Save signed-in state to file
  await page.context().storageState({ path: authFile });
  
  console.log('✓ Authentication state saved to', authFile);
});
