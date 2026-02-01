import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Home Page Object Model
 *
 * This class represents the home page and provides methods to interact with it.
 * Following Playwright guidelines:
 * - Use locators for resilient element selection
 * - Implement clear, reusable actions
 * - Separate page logic from test logic
 */
export class HomePage extends BasePage {
  // Locators
  readonly loginButton: Locator;
  readonly registerButton: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);

    // Define locators using various strategies
    this.loginButton = page.getByRole("link", { name: /login|zaloguj/i });
    this.registerButton = page.getByRole("link", { name: /register|rejestr/i });
    this.heading = page.locator("h1").first();
  }

  /**
   * Navigate to home page
   */
  async navigate() {
    await this.goto("/");
    await this.waitForPageLoad();
  }

  /**
   * Click login button
   */
  async goToLogin() {
    await this.clickButton(this.loginButton);
    await this.waitForPageLoad();
  }

  /**
   * Click register button
   */
  async goToRegister() {
    await this.clickButton(this.registerButton);
    await this.waitForPageLoad();
  }

  /**
   * Get heading text
   */
  async getHeadingText(): Promise<string> {
    return await this.getTextContent(this.heading);
  }

  /**
   * Check if user is on home page (which redirects to login)
   */
  async isOnHomePage(): Promise<boolean> {
    // Home page now redirects to login
    return this.getCurrentURL().includes("/login");
  }
}
