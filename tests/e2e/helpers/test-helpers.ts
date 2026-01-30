import type { Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

/**
 * Test Helper Functions
 * 
 * Common utilities for E2E tests
 */

/**
 * Get test user credentials from environment variables
 */
export function getTestUser() {
  return {
    email: process.env.E2E_USERNAME || 'user@test.pl',
    password: process.env.E2E_PASSWORD || 'Abcd1234!',
    id: process.env.E2E_USERNAME_ID || '725fae9f-89e0-4f57-941f-514b86cffa49',
  };
}

/**
 * Login as test user
 */
export async function loginAsTestUser(page: Page, email?: string, password?: string) {
  const loginPage = new LoginPage(page);
  const testUser = getTestUser();
  
  const loginEmail = email || testUser.email;
  const loginPassword = password || testUser.password;
  
  await loginPage.goto();
  await loginPage.login(loginEmail, loginPassword);
  
  // Wait for redirect with simple timeout (avoid waitForRedirect issues)
  await page.waitForTimeout(5000);
  
  // Verify we're logged in (should be on /my-flashcards or /generate)
  const url = page.url();
  if (!url.includes('/my-flashcards') && !url.includes('/generate')) {
    // Check if there's an error message
    const hasError = await loginPage.hasError();
    if (hasError) {
      const errorMessage = await loginPage.getErrorMessage();
      throw new Error(`Login failed with error: ${errorMessage}`);
    }
    throw new Error(`Login failed - still on ${url}`);
  }
}

/**
 * Generate a random email for testing
 */
export function generateRandomEmail(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `test.${timestamp}.${random}@example.com`;
}

/**
 * Generate a valid password for testing
 */
export function generateValidPassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const nums = '0123456789';
  const special = '!@#$%^&*';
  
  let password = '';
  // Add 6 random letters
  for (let i = 0; i < 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Add 2 numbers
  for (let i = 0; i < 2; i++) {
    password += nums.charAt(Math.floor(Math.random() * nums.length));
  }
  // Add 1 special character
  password += special.charAt(Math.floor(Math.random() * special.length));
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Generate sample text for flashcard generation
 * Default 1500 characters (app requires minimum 1000)
 */
export function generateSampleText(length: number = 1500): string {
  const baseText = `
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
    Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris 
    nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in 
    reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
    Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia 
    deserunt mollit anim id est laborum. Curabitur pretium tincidunt lacus. 
    Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros 
    bibendum elit, nec luctus magna felis sollicitudin mauris.
  `.trim();
  
  // Repeat baseText to reach desired length
  let result = '';
  while (result.length < length) {
    result += baseText + ' ';
  }
  
  return result.substring(0, length);
}

/**
 * Wait for a specific amount of time
 */
export async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Clear browser storage (localStorage, sessionStorage, cookies)
 */
export async function clearBrowserStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.context().clearCookies();
}

/**
 * Take a screenshot with timestamp
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
}

/**
 * Check if element exists (without throwing error)
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  try {
    const element = page.locator(selector);
    return await element.count() > 0;
  } catch {
    return false;
  }
}

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(page: Page, timeout: number = 5000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Get current theme (light/dark)
 */
export async function getCurrentTheme(page: Page): Promise<'light' | 'dark'> {
  const isDark = await page.evaluate(() => {
    return document.documentElement.classList.contains('dark');
  });
  return isDark ? 'dark' : 'light';
}

/**
 * Set theme
 */
export async function setTheme(page: Page, theme: 'light' | 'dark'): Promise<void> {
  await page.evaluate((theme) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, theme);
}
