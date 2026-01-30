import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * My Flashcards Page Object Model
 * 
 * Encapsulates all interactions with the my flashcards page
 */
export class MyFlashcardsPage extends BasePage {
  // Locators using data-testid
  private readonly myFlashcardsView: Locator;
  private readonly totalCount: Locator;
  private readonly createButton: Locator;
  private readonly filters: Locator;
  private readonly filterAll: Locator;
  private readonly filterAiFull: Locator;
  private readonly filterAiEdited: Locator;
  private readonly filterManual: Locator;
  private readonly flashcardsList: Locator;
  private readonly emptyState: Locator;
  private readonly pagination: Locator;
  private readonly paginationInfo: Locator;
  private readonly paginationPrevious: Locator;
  private readonly paginationNext: Locator;

  constructor(page: Page) {
    super(page);
    
    // Initialize locators using data-testid
    this.myFlashcardsView = page.getByTestId('my-flashcards-view');
    this.totalCount = page.getByTestId('flashcards-total-count');
    this.createButton = page.getByTestId('create-flashcard-button');
    this.filters = page.getByTestId('flashcard-filters');
    this.filterAll = page.getByTestId('filter-all');
    this.filterAiFull = page.getByTestId('filter-ai-full');
    this.filterAiEdited = page.getByTestId('filter-ai-edited');
    this.filterManual = page.getByTestId('filter-manual');
    this.flashcardsList = page.getByTestId('flashcards-list');
    this.emptyState = page.getByTestId('empty-state');
    this.pagination = page.getByTestId('pagination');
    this.paginationInfo = page.getByTestId('pagination-info');
    this.paginationPrevious = page.getByTestId('pagination-previous');
    this.paginationNext = page.getByTestId('pagination-next');
  }

  /**
   * Navigate to my flashcards page
   */
  async goto() {
    await super.goto('/my-flashcards');
    await this.waitForElement(this.myFlashcardsView);
  }

  /**
   * Get total flashcards count text
   */
  async getTotalCountText(): Promise<string> {
    return await this.getTextContent(this.totalCount);
  }

  /**
   * Click create flashcard button
   */
  async clickCreateFlashcard() {
    await this.clickButton(this.createButton);
  }

  /**
   * Apply filter
   */
  async applyFilter(filter: 'all' | 'ai-full' | 'ai-edited' | 'manual') {
    switch (filter) {
      case 'all':
        await this.clickButton(this.filterAll);
        break;
      case 'ai-full':
        await this.clickButton(this.filterAiFull);
        break;
      case 'ai-edited':
        await this.clickButton(this.filterAiEdited);
        break;
      case 'manual':
        await this.clickButton(this.filterManual);
        break;
    }
  }

  /**
   * Check if empty state is visible
   */
  async hasEmptyState(): Promise<boolean> {
    return await this.isVisible(this.emptyState);
  }

  /**
   * Check if flashcards list is visible
   */
  async hasFlashcardsList(): Promise<boolean> {
    return await this.isVisible(this.flashcardsList);
  }

  /**
   * Get flashcard card by ID
   */
  getFlashcardCard(id: number): Locator {
    return this.page.getByTestId(`flashcard-card-${id}`);
  }

  /**
   * Get all flashcard cards
   */
  getAllFlashcardCards(): Locator {
    return this.page.locator('[data-testid^="flashcard-card-"]');
  }

  /**
   * Get count of visible flashcard cards
   */
  async getFlashcardsCount(): Promise<number> {
    return await this.getAllFlashcardCards().count();
  }

  /**
   * Click edit button on flashcard
   */
  async clickEditFlashcard(id: number) {
    const card = this.getFlashcardCard(id);
    await card.getByTestId('edit-flashcard-button').click();
  }

  /**
   * Click delete button on flashcard
   */
  async clickDeleteFlashcard(id: number) {
    const card = this.getFlashcardCard(id);
    await card.getByTestId('delete-flashcard-button').click();
  }

  /**
   * Flip flashcard (click on flip area)
   */
  async flipFlashcard(id: number) {
    const card = this.getFlashcardCard(id);
    await card.getByTestId('flashcard-flip-area').click();
  }

  /**
   * Check if pagination is visible
   */
  async hasPagination(): Promise<boolean> {
    return await this.isVisible(this.pagination);
  }

  /**
   * Get pagination info text (e.g., "Strona 1 z 3")
   */
  async getPaginationInfo(): Promise<string> {
    return await this.getTextContent(this.paginationInfo);
  }

  /**
   * Click previous page button
   */
  async clickPreviousPage() {
    await this.clickButton(this.paginationPrevious);
  }

  /**
   * Click next page button
   */
  async clickNextPage() {
    await this.clickButton(this.paginationNext);
  }

  /**
   * Check if previous button is disabled
   */
  async isPreviousDisabled(): Promise<boolean> {
    return await this.paginationPrevious.isDisabled();
  }

  /**
   * Check if next button is disabled
   */
  async isNextDisabled(): Promise<boolean> {
    return await this.paginationNext.isDisabled();
  }
}
