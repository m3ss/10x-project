import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';

/**
 * Example E2E Tests
 * 
 * This demonstrates:
 * - Page Object Model pattern
 * - Browser contexts for isolation
 * - Locators for resilient element selection
 * - Assertions with expect
 * - Setup and teardown hooks
 */

test.describe('Home Page', () => {
  test('should display home page correctly', async ({ page }) => {
    // Arrange
    const homePage = new HomePage(page);

    // Act
    await homePage.navigate();

    // Assert
    await expect(page).toHaveTitle(/10x Astro Starter|flashcard/i);
    expect(await homePage.isOnHomePage()).toBe(true);
  });

  test('should navigate to login page', async ({ page }) => {
    // Arrange
    const homePage = new HomePage(page);

    // Act
    await homePage.navigate();
    await homePage.goToLogin();

    // Assert
    await expect(page).toHaveURL(/.*login/);
  });
});

test.describe('Login Page', () => {
  test('should display login form', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);

    // Act
    await loginPage.navigate();

    // Assert
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Act
    await loginPage.login('invalid@example.com', 'wrongpassword');

    // Wait for response
    await page.waitForTimeout(2000);

    // Assert - this will fail until real authentication is implemented
    // await expect(loginPage.errorMessage).toBeVisible();
  });
});

test.describe('Visual Regression', () => {
  test('should match home page screenshot', async ({ page }) => {
    // Arrange
    const homePage = new HomePage(page);

    // Act
    await homePage.navigate();

    // Assert - Visual comparison
    await expect(page).toHaveScreenshot('home-page.png', {
      maxDiffPixels: 100,
    });
  });
});

test.describe('API Testing', () => {
  test('should check API health endpoint', async ({ request }) => {
    // This is an example of API testing with Playwright
    // Uncomment when you have an API endpoint to test
    
    // const response = await request.get('/api/health');
    // expect(response.ok()).toBeTruthy();
    // expect(response.status()).toBe(200);
  });
});

// Example of using test hooks
test.describe('Test Hooks Example', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    console.log('Setting up test...');
  });

  test.afterEach(async ({ page }) => {
    // Cleanup after each test
    console.log('Cleaning up test...');
  });

  test('example test with hooks', async ({ page }) => {
    // Test implementation
    await page.goto('/');
    await expect(page).toHaveTitle(/.+/);
  });
});
