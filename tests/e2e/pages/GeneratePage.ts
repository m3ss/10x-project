import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Generate Flashcards Page Object Model
 *
 * Encapsulates all interactions with the flashcard generation page
 */
export class GeneratePage extends BasePage {
  // Locators using data-testid
  private readonly generationView: Locator;
  private readonly textInputArea: Locator;
  private readonly textInputTextarea: Locator;
  private readonly characterCount: Locator;
  private readonly generateButton: Locator;
  private readonly resetButton: Locator;
  private readonly bulkSaveButton: Locator;
  private readonly saveAllButton: Locator;
  private readonly saveAcceptedButton: Locator;
  private readonly totalFlashcardsCount: Locator;
  private readonly acceptedFlashcardsCount: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators using data-testid
    this.generationView = page.getByTestId("flashcard-generation-view");
    this.textInputArea = page.getByTestId("text-input-area");
    this.textInputTextarea = page.getByTestId("text-input-textarea");
    this.characterCount = page.getByTestId("character-count");
    this.generateButton = page.getByTestId("generate-button");
    this.resetButton = page.getByTestId("reset-button");
    this.bulkSaveButton = page.getByTestId("bulk-save-button");
    this.saveAllButton = page.getByTestId("save-all-button");
    this.saveAcceptedButton = page.getByTestId("save-accepted-button");
    this.totalFlashcardsCount = page.getByTestId("total-flashcards-count");
    this.acceptedFlashcardsCount = page.getByTestId("accepted-flashcards-count");
  }

  /**
   * Navigate to generate page
   */
  async goto() {
    await super.goto("/generate");
    await this.waitForElement(this.generationView);
  }

  /**
   * Enter text in the textarea
   */
  async enterText(text: string) {
    await this.fillInput(this.textInputTextarea, text);
  }

  /**
   * Get character count
   */
  async getCharacterCount(): Promise<string> {
    return await this.getTextContent(this.characterCount);
  }

  /**
   * Click generate button
   */
  async clickGenerate() {
    await this.clickButton(this.generateButton);
  }

  /**
   * Click reset button
   */
  async clickReset() {
    await this.clickButton(this.resetButton);
  }

  /**
   * Check if generate button is enabled
   */
  async isGenerateEnabled(): Promise<boolean> {
    return !(await this.generateButton.isDisabled());
  }

  /**
   * Check if generating (loading state)
   */
  async isGenerating(): Promise<boolean> {
    const buttonText = await this.generateButton.textContent();
    return buttonText?.includes("Generowanie...") || false;
  }

  /**
   * Wait for flashcards to be generated
   */
  async waitForGeneration(timeout = 30000) {
    await this.waitForElement(this.bulkSaveButton, timeout);
  }

  /**
   * Get total flashcards count
   */
  async getTotalFlashcardsCount(): Promise<number> {
    const text = await this.getTextContent(this.totalFlashcardsCount);
    return parseInt(text, 10);
  }

  /**
   * Get accepted flashcards count
   */
  async getAcceptedFlashcardsCount(): Promise<number> {
    const text = await this.getTextContent(this.acceptedFlashcardsCount);
    return parseInt(text, 10);
  }

  /**
   * Click save all button
   */
  async clickSaveAll() {
    await this.clickButton(this.saveAllButton);
  }

  /**
   * Click save accepted button
   */
  async clickSaveAccepted() {
    await this.clickButton(this.saveAcceptedButton);
  }

  /**
   * Check if save all button is disabled
   */
  async isSaveAllDisabled(): Promise<boolean> {
    return await this.saveAllButton.isDisabled();
  }

  /**
   * Check if save accepted button is disabled
   */
  async isSaveAcceptedDisabled(): Promise<boolean> {
    return await this.saveAcceptedButton.isDisabled();
  }

  /**
   * Check if saving (loading state)
   */
  async isSaving(): Promise<boolean> {
    const buttonText = await this.saveAllButton.textContent();
    return buttonText?.includes("Zapisywanie...") || false;
  }

  /**
   * Get flashcard by index
   */
  getFlashcardCard(index: number): Locator {
    return this.page.locator(`[data-testid^="flashcard-card-"]`).nth(index);
  }

  /**
   * Get all flashcard cards
   */
  getAllFlashcardCards(): Locator {
    return this.page.locator(`[data-testid^="flashcard-card-"]`);
  }

  /**
   * Generate flashcards with valid text
   */
  async generateFlashcards(text: string) {
    await this.enterText(text);
    await this.clickGenerate();
    await this.waitForGeneration();
  }
}
