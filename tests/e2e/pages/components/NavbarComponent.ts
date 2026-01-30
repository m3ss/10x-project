import type { Page, Locator } from '@playwright/test';

/**
 * Authenticated Navbar Component Object Model
 * 
 * Encapsulates interactions with the authenticated navbar
 */
export class NavbarComponent {
  private readonly page: Page;
  private readonly navbar: Locator;
  private readonly logoLink: Locator;
  private readonly navMyFlashcards: Locator;
  private readonly navGenerate: Locator;
  private readonly themeToggle: Locator;
  private readonly userMenuTrigger: Locator;
  private readonly userMenuContent: Locator;
  private readonly userMenuEmail: Locator;
  private readonly menuMyFlashcards: Locator;
  private readonly menuGenerate: Locator;
  private readonly menuSettings: Locator;
  private readonly menuLogout: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Initialize locators using data-testid
    this.navbar = page.getByTestId('authenticated-navbar');
    this.logoLink = page.getByTestId('logo-link');
    this.navMyFlashcards = page.getByTestId('nav-my-flashcards');
    this.navGenerate = page.getByTestId('nav-generate');
    this.themeToggle = page.getByTestId('theme-toggle');
    this.userMenuTrigger = page.getByTestId('user-menu-trigger');
    this.userMenuContent = page.getByTestId('user-menu-content');
    this.userMenuEmail = page.getByTestId('user-menu-email');
    this.menuMyFlashcards = page.getByTestId('menu-my-flashcards');
    this.menuGenerate = page.getByTestId('menu-generate');
    this.menuSettings = page.getByTestId('menu-settings');
    this.menuLogout = page.getByTestId('menu-logout');
  }

  /**
   * Check if navbar is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.navbar.isVisible();
  }

  /**
   * Click logo link
   */
  async clickLogo() {
    await this.logoLink.click();
  }

  /**
   * Navigate to My Flashcards via navbar
   */
  async goToMyFlashcards() {
    await this.navMyFlashcards.click();
  }

  /**
   * Navigate to Generate via navbar
   */
  async goToGenerate() {
    await this.navGenerate.click();
  }

  /**
   * Toggle theme
   */
  async toggleTheme() {
    await this.themeToggle.click();
  }

  /**
   * Open user menu
   */
  async openUserMenu() {
    await this.userMenuTrigger.click();
    await this.userMenuContent.waitFor({ state: 'visible' });
  }

  /**
   * Get user email from menu
   */
  async getUserEmail(): Promise<string> {
    await this.openUserMenu();
    return await this.userMenuEmail.textContent() || '';
  }

  /**
   * Navigate to My Flashcards via menu
   */
  async goToMyFlashcardsViaMenu() {
    await this.openUserMenu();
    await this.menuMyFlashcards.click();
  }

  /**
   * Navigate to Generate via menu
   */
  async goToGenerateViaMenu() {
    await this.openUserMenu();
    await this.menuGenerate.click();
  }

  /**
   * Navigate to Settings via menu
   */
  async goToSettings() {
    await this.openUserMenu();
    await this.menuSettings.click();
  }

  /**
   * Logout via menu
   */
  async logout() {
    await this.openUserMenu();
    await this.menuLogout.click();
  }

  /**
   * Check if logout is in progress
   */
  async isLoggingOut(): Promise<boolean> {
    const text = await this.menuLogout.textContent();
    return text?.includes('Wylogowywanie...') || false;
  }

  /**
   * Wait for redirect after logout
   */
  async waitForLogoutRedirect() {
    await this.page.waitForURL('**/', { timeout: 10000 });
  }
}
