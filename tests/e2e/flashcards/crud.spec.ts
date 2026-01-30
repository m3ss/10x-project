import { test, expect } from '../fixtures/test-fixtures';
import { generateSampleText } from '../helpers/test-helpers';

test.describe('Flashcards CRUD Operations', () => {
  
  // Tests use authenticated state from auth.setup.ts
  // No manual login required!

  test.describe('CREATE - Manual Flashcard Creation', () => {
    
    test('should open create dialog when clicking create button', async ({ myFlashcardsPage, page }) => {
      // Navigate to my-flashcards page
      await myFlashcardsPage.goto();
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('my-flashcards-view')).toBeVisible();
      
      // Wait for create button to be ready
      const createButton = page.getByTestId('create-flashcard-button');
      await expect(createButton).toBeVisible();
      
      // Click create flashcard button
      await createButton.click();
      
      // Wait for dialog to appear with longer timeout
      await expect(page.getByTestId('create-flashcard-dialog')).toBeVisible({ timeout: 10000 });
      
      // Check dialog elements
      await expect(page.getByTestId('create-front-input')).toBeVisible();
      await expect(page.getByTestId('create-back-input')).toBeVisible();
      await expect(page.getByTestId('create-submit-button')).toBeVisible();
      await expect(page.getByTestId('create-cancel-button')).toBeVisible();
    });

    test('should successfully create a new flashcard', async ({ myFlashcardsPage, page }) => {
      // Navigate to my-flashcards page
      await myFlashcardsPage.goto();
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('my-flashcards-view')).toBeVisible();
      
      // Get initial count
      const initialCountText = await myFlashcardsPage.getTotalCountText();
      const initialCount = parseInt(initialCountText.match(/\d+/)?.[0] || '0', 10);
      
      // Click create button and wait for dialog
      const createButton = page.getByTestId('create-flashcard-button');
      await expect(createButton).toBeVisible();
      await createButton.click();
      await expect(page.getByTestId('create-flashcard-dialog')).toBeVisible({ timeout: 10000 });
      
      // Fill in flashcard data
      const frontText = `Test question - ${Date.now()}`;
      const backText = `Test answer - ${Date.now()}`;
      
      await page.getByTestId('create-front-input').fill(frontText);
      await page.getByTestId('create-back-input').fill(backText);
      
      // Submit
      await page.getByTestId('create-submit-button').click();
      
      // Wait for dialog to close and data to refresh
      await expect(page.getByTestId('create-flashcard-dialog')).not.toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(1000);
      
      // Dialog should be closed
      await expect(page.getByTestId('create-flashcard-dialog')).not.toBeVisible();
      
      // Count should increase
      const newCountText = await myFlashcardsPage.getTotalCountText();
      const newCount = parseInt(newCountText.match(/\d+/)?.[0] || '0', 10);
      expect(newCount).toBeGreaterThan(initialCount);
      
      // New flashcard should be visible in the list
      const flashcardsCount = await myFlashcardsPage.getFlashcardsCount();
      expect(flashcardsCount).toBeGreaterThan(0);
    });

    test('should show validation error for empty front field', async ({ myFlashcardsPage, page }) => {
      await myFlashcardsPage.goto();
      
      // Open create dialog
      await myFlashcardsPage.clickCreateFlashcard();
      
      // Fill only back field
      await page.getByTestId('create-back-input').fill('Test answer');
      
      // Try to submit
      await page.getByTestId('create-submit-button').click();
      
      // Error should be displayed
      await expect(page.getByTestId('create-front-error')).toBeVisible();
    });

    test('should show validation error for empty back field', async ({ myFlashcardsPage, page }) => {
      // Navigate to my-flashcards page
      await myFlashcardsPage.goto();
      
      // Open create dialog
      await myFlashcardsPage.clickCreateFlashcard();
      
      // Wait for dialog
      await page.waitForTimeout(500);
      await expect(page.getByTestId('create-flashcard-dialog')).toBeVisible();
      
      // Fill only front field
      await page.getByTestId('create-front-input').fill('Test question');
      
      // Try to submit
      await page.getByTestId('create-submit-button').click();
      
      // Wait for validation
      await page.waitForTimeout(300);
      
      // Error should be displayed
      await expect(page.getByTestId('create-back-error')).toBeVisible();
    });

    test('should cancel flashcard creation', async ({ myFlashcardsPage, page }) => {
      await myFlashcardsPage.goto();
      
      // Open create dialog
      await myFlashcardsPage.clickCreateFlashcard();
      
      // Fill fields
      await page.getByTestId('create-front-input').fill('Test question');
      await page.getByTestId('create-back-input').fill('Test answer');
      
      // Click cancel
      await page.getByTestId('create-cancel-button').click();
      
      // Dialog should be closed
      await expect(page.getByTestId('create-flashcard-dialog')).not.toBeVisible();
    });
  });

  test.describe('CREATE - AI-Generated Flashcards', () => {
    
    test('should generate flashcards from text', async ({ generatePage, page }) => {
      // Navigate to generate page
      await generatePage.goto();
      await page.waitForLoadState('networkidle');
      
      // Generate sample text (1500+ characters required)
      const sampleText = generateSampleText(1500);
      
      // Enter text and wait for validation
      await generatePage.enterText(sampleText);
      await page.waitForTimeout(2000); // Wait for character count update
      
      // Verify button is enabled
      const isEnabled = await generatePage.isGenerateEnabled();
      if (!isEnabled) {
        throw new Error('Generate button is still disabled after entering text');
      }
      
      // Generate flashcards
      await generatePage.clickGenerate();
      
      // Wait for generation to complete
      await generatePage.waitForGeneration(40000);
      
      // Check if flashcards were generated
      const totalCount = await generatePage.getTotalFlashcardsCount();
      expect(totalCount).toBeGreaterThan(0);
      
      // Check if flashcard cards are visible
      const flashcardsCount = await generatePage.getAllFlashcardCards().count();
      expect(flashcardsCount).toBeGreaterThan(0);
    });

    test('should save generated flashcards', async ({ generatePage, myFlashcardsPage, page }) => {
      // Navigate to generate page
      await generatePage.goto();
      await page.waitForLoadState('networkidle');
      
      // Generate flashcards with sufficient text
      const sampleText = generateSampleText(1500);
      await generatePage.enterText(sampleText);
      await page.waitForTimeout(2000);
      
      // Verify button is enabled before clicking
      const isEnabled = await generatePage.isGenerateEnabled();
      if (!isEnabled) {
        throw new Error('Generate button is disabled');
      }
      
      await generatePage.clickGenerate();
      await generatePage.waitForGeneration(40000);
      
      // Save all flashcards
      await generatePage.clickSaveAll();
      
      // Wait for save operation to complete
      await page.waitForTimeout(3000);
      
      // Navigate to my flashcards
      await myFlashcardsPage.goto();
      await page.waitForLoadState('networkidle');
      
      // Check if flashcards appear
      const hasFlashcards = await myFlashcardsPage.hasFlashcardsList();
      expect(hasFlashcards).toBe(true);
    });

    test('should disable generate button for empty text', async ({ generatePage }) => {
      await generatePage.goto();
      
      // Check if generate button is disabled initially
      const isDisabled = !(await generatePage.isGenerateEnabled());
      expect(isDisabled).toBe(true);
    });

    test('should enable generate button with sufficient text', async ({ generatePage, page }) => {
      // Navigate to generate page
      await generatePage.goto();
      await page.waitForLoadState('networkidle');
      
      // Enter sufficient text (need 1000+ characters)
      const sampleText = generateSampleText(1500);
      await generatePage.enterText(sampleText);
      
      // Wait for character count and button state to update
      await page.waitForTimeout(2000);
      
      // Generate button should be enabled
      const isEnabled = await generatePage.isGenerateEnabled();
      expect(isEnabled).toBe(true);
    });
  });

  test.describe('READ - View and Filter Flashcards', () => {
    
    test('should display flashcards list', async ({ myFlashcardsPage }) => {
      await myFlashcardsPage.goto();
      
      // Check if my flashcards view is visible
      const myFlashcardsView = await myFlashcardsPage.page.getByTestId('my-flashcards-view');
      await expect(myFlashcardsView).toBeVisible();
      
      // Either empty state or flashcards list should be visible
      const hasEmptyState = await myFlashcardsPage.hasEmptyState();
      const hasFlashcardsList = await myFlashcardsPage.hasFlashcardsList();
      
      expect(hasEmptyState || hasFlashcardsList).toBe(true);
    });

    test('should flip flashcard to show back', async ({ myFlashcardsPage, page }) => {
      await myFlashcardsPage.goto();
      
      // Check if we have flashcards
      const hasFlashcards = await myFlashcardsPage.hasFlashcardsList();
      if (!hasFlashcards) {
        test.skip();
      }
      
      // Get first flashcard
      const firstCard = await myFlashcardsPage.getAllFlashcardCards().first();
      
      // Front should be visible
      await expect(firstCard.getByTestId('flashcard-front')).toBeVisible();
      
      // Click to flip
      await firstCard.getByTestId('flashcard-flip-area').click();
      
      // Wait for flip animation
      await page.waitForTimeout(500);
      
      // Back should be visible
      await expect(firstCard.getByTestId('flashcard-back')).toBeVisible();
    });

    test.skip('should filter flashcards by type', async ({ myFlashcardsPage, page }) => {
      await myFlashcardsPage.goto();
      
      // Check if we have flashcards
      const hasFlashcards = await myFlashcardsPage.hasFlashcardsList();
      if (!hasFlashcards) {
        test.skip();
      }
      
      // Apply AI-full filter
      await myFlashcardsPage.applyFilter('ai-full');
      await page.waitForTimeout(1000);
      
      // Apply AI-edited filter
      await myFlashcardsPage.applyFilter('ai-edited');
      await page.waitForTimeout(1000);
      
      // Apply Manual filter
      await myFlashcardsPage.applyFilter('manual');
      await page.waitForTimeout(1000);
      
      // Apply All filter
      await myFlashcardsPage.applyFilter('all');
      await page.waitForTimeout(1000);
    });
  });

  test.describe('UPDATE - Edit Flashcard', () => {
    
    test('should open edit dialog when clicking edit button', async ({ myFlashcardsPage, page }) => {
      await myFlashcardsPage.goto();
      
      // Check if we have flashcards
      const hasFlashcards = await myFlashcardsPage.hasFlashcardsList();
      if (!hasFlashcards) {
        test.skip();
      }
      
      // Click edit on first flashcard
      const firstCard = await myFlashcardsPage.getAllFlashcardCards().first();
      await firstCard.getByTestId('edit-flashcard-button').click();
      
      // Edit dialog should be visible
      const editDialog = page.getByTestId('edit-flashcard-dialog');
      await expect(editDialog).toBeVisible();
      
      // Check dialog elements
      await expect(page.getByTestId('edit-front-input')).toBeVisible();
      await expect(page.getByTestId('edit-back-input')).toBeVisible();
      await expect(page.getByTestId('edit-save-button')).toBeVisible();
      await expect(page.getByTestId('edit-cancel-button')).toBeVisible();
    });

    test('should successfully edit a flashcard', async ({ myFlashcardsPage, page }) => {
      await myFlashcardsPage.goto();
      
      // Check if we have flashcards
      const hasFlashcards = await myFlashcardsPage.hasFlashcardsList();
      if (!hasFlashcards) {
        test.skip();
      }
      
      // Click edit on first flashcard
      const firstCard = await myFlashcardsPage.getAllFlashcardCards().first();
      
      // Get original text
      const originalFront = await firstCard.getByTestId('flashcard-front').textContent();
      
      // Click edit
      await firstCard.getByTestId('edit-flashcard-button').click();
      
      // Modify front text
      const newFront = `Edited - ${Date.now()}`;
      await page.getByTestId('edit-front-input').clear();
      await page.getByTestId('edit-front-input').fill(newFront);
      
      // Save changes
      await page.getByTestId('edit-save-button').click();
      
      // Wait for dialog to close
      await page.waitForTimeout(2000);
      
      // Dialog should be closed
      await expect(page.getByTestId('edit-flashcard-dialog')).not.toBeVisible();
      
      // Reload page to verify changes
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Check if text was updated
      const updatedCard = await myFlashcardsPage.getAllFlashcardCards().first();
      const updatedFront = await updatedCard.getByTestId('flashcard-front').textContent();
      
      expect(updatedFront).toContain(newFront);
    });

    test('should show validation error when editing with empty front', async ({ myFlashcardsPage, page }) => {
      await myFlashcardsPage.goto();
      
      // Check if we have flashcards
      const hasFlashcards = await myFlashcardsPage.hasFlashcardsList();
      if (!hasFlashcards) {
        test.skip();
      }
      
      // Click edit on first flashcard
      const firstCard = await myFlashcardsPage.getAllFlashcardCards().first();
      await firstCard.getByTestId('edit-flashcard-button').click();
      
      // Clear front field
      await page.getByTestId('edit-front-input').clear();
      
      // Try to save
      await page.getByTestId('edit-save-button').click();
      
      // Error should be displayed
      await expect(page.getByTestId('edit-front-error')).toBeVisible();
    });

    test('should cancel flashcard edit', async ({ myFlashcardsPage, page }) => {
      await myFlashcardsPage.goto();
      
      // Check if we have flashcards
      const hasFlashcards = await myFlashcardsPage.hasFlashcardsList();
      if (!hasFlashcards) {
        test.skip();
      }
      
      // Click edit on first flashcard
      const firstCard = await myFlashcardsPage.getAllFlashcardCards().first();
      await firstCard.getByTestId('edit-flashcard-button').click();
      
      // Modify text
      await page.getByTestId('edit-front-input').clear();
      await page.getByTestId('edit-front-input').fill('This should not be saved');
      
      // Cancel
      await page.getByTestId('edit-cancel-button').click();
      
      // Dialog should be closed
      await expect(page.getByTestId('edit-flashcard-dialog')).not.toBeVisible();
    });
  });

  test.describe('DELETE - Remove Flashcard', () => {
    
    test('should open delete confirmation dialog', async ({ myFlashcardsPage, page }) => {
      await myFlashcardsPage.goto();
      
      // Check if we have flashcards
      const hasFlashcards = await myFlashcardsPage.hasFlashcardsList();
      if (!hasFlashcards) {
        test.skip();
      }
      
      // Click delete on first flashcard
      const firstCard = await myFlashcardsPage.getAllFlashcardCards().first();
      await firstCard.getByTestId('delete-flashcard-button').click();
      
      // Delete dialog should be visible
      const deleteDialog = page.getByTestId('delete-confirm-dialog');
      await expect(deleteDialog).toBeVisible();
      
      // Check dialog elements
      await expect(page.getByTestId('delete-confirm-description')).toBeVisible();
      await expect(page.getByTestId('delete-confirm-button')).toBeVisible();
      await expect(page.getByTestId('delete-cancel-button')).toBeVisible();
    });

    test('should successfully delete a flashcard', async ({ myFlashcardsPage, page }) => {
      await myFlashcardsPage.goto();
      
      // Check if we have flashcards
      const hasFlashcards = await myFlashcardsPage.hasFlashcardsList();
      if (!hasFlashcards) {
        test.skip();
      }
      
      // Get initial count
      const initialCount = await myFlashcardsPage.getFlashcardsCount();
      
      // Click delete on first flashcard
      const firstCard = await myFlashcardsPage.getAllFlashcardCards().first();
      await firstCard.getByTestId('delete-flashcard-button').click();
      
      // Confirm deletion
      await page.getByTestId('delete-confirm-button').click();
      
      // Wait for deletion
      await page.waitForTimeout(2000);
      
      // Dialog should be closed
      await expect(page.getByTestId('delete-confirm-dialog')).not.toBeVisible();
      
      // Count should decrease (or show empty state)
      const newCount = await myFlashcardsPage.getFlashcardsCount();
      const hasEmptyState = await myFlashcardsPage.hasEmptyState();
      
      expect(newCount < initialCount || hasEmptyState).toBe(true);
    });

    test('should cancel flashcard deletion', async ({ myFlashcardsPage, page }) => {
      await myFlashcardsPage.goto();
      
      // Check if we have flashcards
      const hasFlashcards = await myFlashcardsPage.hasFlashcardsList();
      if (!hasFlashcards) {
        test.skip();
      }
      
      // Get initial count
      const initialCount = await myFlashcardsPage.getFlashcardsCount();
      
      // Click delete on first flashcard
      const firstCard = await myFlashcardsPage.getAllFlashcardCards().first();
      await firstCard.getByTestId('delete-flashcard-button').click();
      
      // Cancel deletion
      await page.getByTestId('delete-cancel-button').click();
      
      // Dialog should be closed
      await expect(page.getByTestId('delete-confirm-dialog')).not.toBeVisible();
      
      // Count should remain the same
      const newCount = await myFlashcardsPage.getFlashcardsCount();
      expect(newCount).toBe(initialCount);
    });
  });
});
