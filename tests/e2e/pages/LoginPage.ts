import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Login Page Object Model
 * 
 * Encapsulates all interactions with the login page
 */
export class LoginPage extends BasePage {
  // Locators using data-testid
  private readonly loginForm: Locator;
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton: Locator;
  private readonly errorMessage: Locator;
  private readonly registerLink: Locator;

  constructor(page: Page) {
    super(page);
    
    // Initialize locators using data-testid
    this.loginForm = page.getByTestId('login-form');
    this.emailInput = page.getByTestId('login-email-input');
    this.passwordInput = page.getByTestId('login-password-input');
    this.submitButton = page.getByTestId('login-submit-button');
    this.errorMessage = page.getByTestId('login-error');
    this.registerLink = page.getByTestId('register-link');
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await super.goto('/login');
    await this.waitForElement(this.loginForm);
  }

  /**
   * Perform login action
   */
  async login(email: string, password: string) {
    await this.fillInput(this.emailInput, email);
    await this.fillInput(this.passwordInput, password);
    await this.clickButton(this.submitButton);
  }

  /**
   * Check if error message is displayed
   */
  async hasError(): Promise<boolean> {
    return await this.isVisible(this.errorMessage);
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    return await this.getTextContent(this.errorMessage);
  }

  /**
   * Click register link
   */
  async goToRegister() {
    await this.clickButton(this.registerLink);
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  /**
   * Wait for redirect after successful login
   */
  async waitForRedirect(expectedPath: string = '/generate') {
    await this.page.waitForURL(`**${expectedPath}`, { timeout: 10000 });
  }

  /**
   * Check if loading state is displayed
   */
  async isLoading(): Promise<boolean> {
    const loadingText = await this.submitButton.textContent();
    return loadingText?.includes('Logowanie...') || false;
  }
}
