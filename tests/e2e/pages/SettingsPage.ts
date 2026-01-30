import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Settings Page Object Model
 * 
 * Encapsulates all interactions with the account settings page
 */
export class SettingsPage extends BasePage {
  // Locators using data-testid
  private readonly accountSettings: Locator;
  private readonly accountEmail: Locator;
  private readonly accountId: Locator;
  private readonly deleteAccountButton: Locator;
  private readonly deleteAccountDialog: Locator;
  private readonly deleteAccountConfirmInput: Locator;
  private readonly deleteAccountCancel: Locator;
  private readonly deleteAccountConfirm: Locator;

  constructor(page: Page) {
    super(page);
    
    // Initialize locators using data-testid
    this.accountSettings = page.getByTestId('account-settings');
    this.accountEmail = page.getByTestId('account-email');
    this.accountId = page.getByTestId('account-id');
    this.deleteAccountButton = page.getByTestId('delete-account-button');
    this.deleteAccountDialog = page.getByTestId('delete-account-dialog');
    this.deleteAccountConfirmInput = page.getByTestId('delete-account-confirm-input');
    this.deleteAccountCancel = page.getByTestId('delete-account-cancel');
    this.deleteAccountConfirm = page.getByTestId('delete-account-confirm');
  }

  /**
   * Navigate to settings page
   */
  async goto() {
    await super.goto('/settings');
    await this.waitForElement(this.accountSettings);
  }

  /**
   * Get account email
   */
  async getAccountEmail(): Promise<string> {
    return await this.getTextContent(this.accountEmail);
  }

  /**
   * Get account ID
   */
  async getAccountId(): Promise<string> {
    return await this.getTextContent(this.accountId);
  }

  /**
   * Click delete account button
   */
  async clickDeleteAccount() {
    await this.clickButton(this.deleteAccountButton);
    await this.waitForElement(this.deleteAccountDialog);
  }

  /**
   * Enter confirmation text for account deletion
   */
  async enterDeleteConfirmation(text: string) {
    await this.fillInput(this.deleteAccountConfirmInput, text);
  }

  /**
   * Cancel account deletion
   */
  async cancelAccountDeletion() {
    await this.clickButton(this.deleteAccountCancel);
  }

  /**
   * Confirm account deletion
   */
  async confirmAccountDeletion() {
    await this.clickButton(this.deleteAccountConfirm);
  }

  /**
   * Check if delete confirm button is disabled
   */
  async isDeleteConfirmDisabled(): Promise<boolean> {
    return await this.deleteAccountConfirm.isDisabled();
  }

  /**
   * Check if deleting (loading state)
   */
  async isDeleting(): Promise<boolean> {
    const buttonText = await this.deleteAccountConfirm.textContent();
    return buttonText?.includes('Usuwanie...') || false;
  }

  /**
   * Complete account deletion flow
   */
  async deleteAccount() {
    await this.clickDeleteAccount();
    await this.enterDeleteConfirmation('USUŃ KONTO');
    await this.confirmAccountDeletion();
  }

  /**
   * Wait for redirect after account deletion
   */
  async waitForRedirectAfterDeletion() {
    await this.page.waitForURL('**/?message=*', { timeout: 10000 });
  }
}
