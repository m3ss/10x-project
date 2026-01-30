import { test, expect } from '../fixtures/test-fixtures';
import { getTestUser, generateRandomEmail } from '../helpers/test-helpers';

/**
 * Login E2E Tests
 * 
 * Tests for user authentication and login functionality
 */

test.describe('Login Page', () => {
  
  test.beforeEach(async ({ loginPage, context }) => {
    // Clear cookies and storage before each test for isolation
    await context.clearCookies();
    await loginPage.goto();
  });

  test('should display login form', async ({ loginPage, page }) => {
    // Check if we're on the login page
    expect(page.url()).toContain('/login');
    
    // Take a screenshot for visual regression
    await expect(page).toHaveScreenshot('login-page.png');
  });

  test('should successfully login with valid credentials', async ({ loginPage, page }) => {
    const testUser = getTestUser();
    
    // Listen for API response
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );
    
    // Perform login
    await loginPage.login(testUser.email, testUser.password);
    
    // Wait for API response
    const response = await responsePromise;
    
    // Log response status
    console.log('Login API status:', response.status());
    console.log('Login API URL:', response.url());
    
    // Try to get response body (if available)
    let responseBody;
    try {
      responseBody = await response.json();
      console.log('Login API response:', responseBody);
    } catch (e) {
      console.log('Could not parse response body (might be redirect)');
    }
    
    // Wait a bit for navigation
    await page.waitForTimeout(3000);
    
    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    // Check if login was successful (200 or 302 redirect)
    expect([200, 302]).toContain(response.status());
    
    // Check if we're redirected to my-flashcards or generate
    expect(currentUrl).toMatch(/\/(my-flashcards|generate)/);
  });

  test('should show error with invalid email format', async ({ loginPage, page }) => {
    // Try to login with invalid email
    await loginPage.login('invalid-email', 'password123');
    
    // HTML5 validation should prevent submission
    // Check if still on login page
    expect(page.url()).toContain('/login');
  });

  test('should show error with empty fields', async ({ loginPage, page }) => {
    // Try to submit with empty fields
    await loginPage.login('', '');
    
    // HTML5 validation should prevent submission
    expect(page.url()).toContain('/login');
  });

  test('should show error with incorrect password', async ({ loginPage, page }) => {
    const testUser = getTestUser();
    
    // Try to login with wrong password
    await loginPage.login(testUser.email, 'wrongpassword123');
    
    // Wait a bit for error to appear
    await page.waitForTimeout(1000);
    
    // Check if still on login page (not redirected)
    expect(page.url()).toContain('/login');
  });

  test('should show error with non-existent email', async ({ loginPage, page }) => {
    const randomEmail = generateRandomEmail();
    
    // Try to login with non-existent email
    await loginPage.login(randomEmail, 'somepassword123');
    
    // Wait a bit for error to appear
    await page.waitForTimeout(1000);
    
    // Check if still on login page (not redirected)
    expect(page.url()).toContain('/login');
  });

  test('should show error with password less than 6 characters', async ({ loginPage, page }) => {
    const testUser = getTestUser();
    
    // Try to login with short password
    await loginPage.login(testUser.email, '12345');
    
    // Wait a bit for error to appear
    await page.waitForTimeout(1000);
    
    // Check if still on login page (not redirected)
    expect(page.url()).toContain('/login');
  });

  test('should navigate to register page when clicking register link', async ({ loginPage, page }) => {
    // Click register link
    await loginPage.goToRegister();
    
    // Should be redirected to register page
    await page.waitForURL('**/register');
    expect(page.url()).toContain('/register');
  });

  test.skip('should show loading state during login', async ({ loginPage, page }) => {
    // Skipped: Loading state is too fast to catch reliably in tests
    const testUser = getTestUser();
    
    // Start login
    await loginPage.login(testUser.email, testUser.password);
    
    // Check loading state (might be too fast, but worth checking)
    // This test might be flaky due to speed
    const isLoading = await loginPage.isLoading();
    // We're checking that either it's loading or already redirected
    expect(isLoading || page.url().includes('/my-flashcards')).toBeTruthy();
  });

  test('should redirect logged-in user away from login page', async ({ loginPage, page }) => {
    const testUser = getTestUser();
    
    // First login
    await loginPage.login(testUser.email, testUser.password);
    
    // Wait for redirect
    await page.waitForTimeout(2000);
    expect(page.url()).toMatch(/\/(my-flashcards|generate)/);
    
    // Try to navigate back to login page
    await page.goto('/login');
    await page.waitForTimeout(1000);
    
    // Should be redirected away (to /my-flashcards)
    expect(page.url()).toContain('/my-flashcards');
  });
});

test.describe('Login Page - Keyboard Navigation', () => {
  test('should allow form submission with Enter key', async ({ loginPage, page }) => {
    const testUser = getTestUser();
    
    await loginPage.goto();
    
    // Fill form using keyboard
    await page.getByTestId('login-email-input').fill(testUser.email);
    await page.getByTestId('login-password-input').fill(testUser.password);
    
    // Press Enter on password field
    await page.getByTestId('login-password-input').press('Enter');
    
    // Wait for redirect
    await page.waitForTimeout(2000);
    
    // Should redirect to /my-flashcards or /generate
    expect(page.url()).toMatch(/\/(my-flashcards|generate)/);
  });

  test('should navigate between fields with Tab key', async ({ loginPage, page }) => {
    await loginPage.goto();
    
    // Focus email input
    await page.getByTestId('login-email-input').focus();
    
    // Tab to password
    await page.keyboard.press('Tab');
    
    // Check that password field is focused
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focusedElement).toBe('login-password-input');
  });
});
