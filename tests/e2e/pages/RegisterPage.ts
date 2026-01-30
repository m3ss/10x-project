import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Register Page Object Model
 * 
 * Encapsulates all interactions with the register page
 */
export class RegisterPage extends BasePage {
  // Locators using data-testid
  private readonly registerForm: Locator;
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly confirmPasswordInput: Locator;
  private readonly submitButton: Locator;
  private readonly errorMessage: Locator;
  private readonly loginLink: Locator;
  private readonly passwordStrength: Locator;

  constructor(page: Page) {
    super(page);
    
    // Initialize locators using data-testid
    this.registerForm = page.getByTestId('register-form');
    this.emailInput = page.getByTestId('register-email-input');
    this.passwordInput = page.getByTestId('register-password-input');
    this.confirmPasswordInput = page.getByTestId('register-confirm-password-input');
    this.submitButton = page.getByTestId('register-submit-button');
    this.errorMessage = page.getByTestId('register-error');
    this.loginLink = page.getByTestId('login-link');
    this.passwordStrength = page.getByTestId('password-strength');
  }

  /**
   * Navigate to register page
   */
  async goto() {
    await super.goto('/register');
    await this.waitForElement(this.registerForm);
  }

  /**
   * Perform registration
   */
  async register(email: string, password: string, confirmPassword: string) {
    await this.fillInput(this.emailInput, email);
    await this.fillInput(this.passwordInput, password);
    await this.fillInput(this.confirmPasswordInput, confirmPassword);
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
   * Get password strength text
   */
  async getPasswordStrength(): Promise<string> {
    return await this.getTextContent(this.passwordStrength);
  }

  /**
   * Check if password strength indicator is visible
   */
  async hasPasswordStrength(): Promise<boolean> {
    return await this.isVisible(this.passwordStrength);
  }

  /**
   * Click login link
   */
  async goToLogin() {
    await this.clickButton(this.loginLink);
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  /**
   * Wait for redirect after successful registration
   */
  async waitForRedirect(expectedPath: string = '/generate') {
    await this.page.waitForURL(`**${expectedPath}`, { timeout: 10000 });
  }

  /**
   * Check if loading state is displayed
   */
  async isLoading(): Promise<boolean> {
    const loadingText = await this.submitButton.textContent();
    return loadingText?.includes('Tworzenie konta...') || false;
  }
}
