import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Login Page Object Model
 * 
 * Handles login page interactions following Playwright best practices:
 * - Clear, semantic locators
 * - Reusable action methods
 * - Wait strategies for reliable tests
 */
export class LoginPage extends BasePage {
  // Locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    
    // Define locators
    this.emailInput = page.getByLabel(/email|e-mail/i);
    this.passwordInput = page.getByLabel(/password|hasło/i);
    this.submitButton = page.getByRole('button', { name: /login|zaloguj/i });
    this.errorMessage = page.locator('[role="alert"]').first();
    this.heading = page.locator('h1, h2').first();
  }

  /**
   * Navigate to login page
   */
  async navigate() {
    await this.goto('/login');
    await this.waitForPageLoad();
  }

  /**
   * Fill login form
   */
  async fillLoginForm(email: string, password: string) {
    await this.fillInput(this.emailInput, email);
    await this.fillInput(this.passwordInput, password);
  }

  /**
   * Submit login form
   */
  async submitLogin() {
    await this.clickButton(this.submitButton);
  }

  /**
   * Complete login process
   */
  async login(email: string, password: string) {
    await this.fillLoginForm(email, password);
    await this.submitLogin();
  }

  /**
   * Check if error message is visible
   */
  async hasErrorMessage(): Promise<boolean> {
    return await this.isVisible(this.errorMessage);
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    return await this.getTextContent(this.errorMessage);
  }

  /**
   * Check if on login page
   */
  async isOnLoginPage(): Promise<boolean> {
    return this.getCurrentURL().includes('/login');
  }
}
