# E2E Tests with Playwright

This directory contains end-to-end tests for the 10x-cards application using Playwright and the Page Object Model pattern.

## 📁 Directory Structure

```
tests/e2e/
├── auth/                    # Authentication tests
│   ├── login.spec.ts
│   ├── register.spec.ts
│   ├── logout.spec.ts
│   └── auth-guards.spec.ts
├── flashcards/              # Flashcard-related tests
│   ├── generate.spec.ts
│   ├── save.spec.ts
│   ├── list.spec.ts
│   ├── crud.spec.ts
│   ├── filter.spec.ts
│   └── pagination.spec.ts
├── pages/                   # Page Object Models
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   ├── RegisterPage.ts
│   ├── GeneratePage.ts
│   ├── MyFlashcardsPage.ts
│   ├── SettingsPage.ts
│   ├── components/
│   │   └── NavbarComponent.ts
│   └── index.ts
├── helpers/                 # Test helper functions
│   └── test-helpers.ts
├── fixtures/                # Test fixtures
│   └── test-fixtures.ts
└── README.md
```

## 🎯 Page Object Model (POM)

All tests use the Page Object Model pattern for better maintainability and reusability. Each page/component has its own class that encapsulates:

- **Locators**: Using `data-testid` attributes for reliable element selection
- **Actions**: Methods to interact with the page (e.g., `login()`, `fillForm()`)
- **Assertions**: Methods to verify page state (e.g., `hasError()`, `isVisible()`)

### Example Usage

```typescript
import { test, expect } from '../fixtures/test-fixtures';

test('should login successfully', async ({ loginPage }) => {
  await loginPage.goto();
  await loginPage.login('user@test.pl', 'Password123!');
  await loginPage.waitForRedirect('/generate');
});
```

## 🔧 Configuration

Test configuration is in `playwright.config.ts` at the project root:

- **Browser**: Chromium only (Desktop Chrome)
- **Base URL**: http://localhost:4321
- **Environment**: Loads variables from `.env.test`
- **Authentication**: Uses storage state (see below)
- **Parallel Execution**: Enabled
- **Retries on CI**: 2
- **Screenshots/Videos**: On failure only

## 🔐 Authentication State (Best Practice)

Tests use **Playwright Storage State** for authentication - this is the recommended approach:

### How It Works

1. **Setup Phase** (`auth.setup.ts`):
   - Runs once before all tests
   - Logs in with test user credentials
   - Saves authentication state to `.auth/user.json`

2. **Test Phase**:
   - All tests automatically use the saved auth state
   - No need to login in each test
   - Much faster execution (no repeated logins)
   - Avoids rate limiting

### Benefits

✅ **Performance**: Login once, reuse everywhere  
✅ **Stability**: Reduces flakiness from repeated logins  
✅ **Rate Limiting**: Avoids API rate limits  
✅ **Best Practice**: Official Playwright recommendation

### Files

- `tests/e2e/auth/auth.setup.ts` - Authentication setup
- `.auth/user.json` - Saved authentication state (gitignored)

### Manual Login in Tests

For tests that specifically test authentication flows (login, logout, register), you can still use manual login:

```typescript
import { loginAsTestUser } from '../helpers/test-helpers';

test('specific auth test', async ({ page }) => {
  await loginAsTestUser(page);
});
```

## 🚀 Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with visible browser
npm run test:e2e:headed

# Debug mode (step-by-step)
npm run test:e2e:debug

# Playwright UI mode
npm run test:e2e:ui

# View test report
npm run test:e2e:report

# Generate tests by recording
npm run test:e2e:codegen
```

## 📝 Test User Credentials

Test user credentials are stored in `.env.test`:

```env
E2E_USERNAME=user@test.pl
E2E_PASSWORD=Abcd1234!
E2E_USERNAME_ID=725fae9f-89e0-4f57-941f-514b86cffa49
```

Use the `getTestUser()` helper function to access these:

```typescript
import { getTestUser } from '../helpers/test-helpers';

const testUser = getTestUser();
await loginPage.login(testUser.email, testUser.password);
```

## 🎨 Test Helpers

Helper functions are available in `tests/e2e/helpers/test-helpers.ts`:

- `getTestUser()` - Get test user credentials
- `loginAsTestUser(page)` - Quick login as test user
- `generateRandomEmail()` - Generate random email for testing
- `generateValidPassword()` - Generate valid password
- `generateSampleText(length)` - Generate sample text for flashcard generation
- `clearBrowserStorage(page)` - Clear all browser storage
- `takeScreenshot(page, name)` - Take timestamped screenshot
- `getCurrentTheme(page)` - Get current theme (light/dark)
- `setTheme(page, theme)` - Set theme

## 📦 Fixtures

Test fixtures provide pre-initialized Page Objects:

```typescript
import { test, expect } from '../fixtures/test-fixtures';

test('my test', async ({ 
  loginPage,           // LoginPage instance
  registerPage,        // RegisterPage instance
  generatePage,        // GeneratePage instance
  myFlashcardsPage,    // MyFlashcardsPage instance
  settingsPage,        // SettingsPage instance
  navbar               // NavbarComponent instance
}) => {
  // Your test code
});
```

## 🏷️ Data-TestId Selectors

All components use `data-testid` attributes for reliable element selection:

### LoginForm
- `login-form` - Main form container
- `login-email-input` - Email input field
- `login-password-input` - Password input field
- `login-submit-button` - Submit button
- `login-error` - Error message
- `register-link` - Link to register page

### RegisterForm
- `register-form` - Main form container
- `register-email-input` - Email input field
- `register-password-input` - Password input field
- `register-confirm-password-input` - Confirm password input
- `register-submit-button` - Submit button
- `register-error` - Error message
- `password-strength` - Password strength indicator
- `login-link` - Link to login page

### GeneratePage
- `flashcard-generation-view` - Main container
- `text-input-area` - Text input container
- `text-input-textarea` - Textarea element
- `character-count` - Character counter
- `generate-button` - Generate button
- `reset-button` - Reset button
- `bulk-save-button` - Bulk save container
- `save-all-button` - Save all button
- `save-accepted-button` - Save accepted button
- `total-flashcards-count` - Total count
- `accepted-flashcards-count` - Accepted count

### MyFlashcardsPage
- `my-flashcards-view` - Main container
- `flashcards-total-count` - Total flashcards count
- `create-flashcard-button` - Create button
- `flashcard-filters` - Filters container
- `filter-all` - All filter button
- `filter-ai-full` - AI full filter button
- `filter-ai-edited` - AI edited filter button
- `filter-manual` - Manual filter button
- `flashcards-list` - Flashcards list container
- `empty-state` - Empty state container
- `pagination` - Pagination container
- `pagination-info` - Pagination info text
- `pagination-previous` - Previous button
- `pagination-next` - Next button

### FlashcardCard
- `flashcard-card-{id}` - Card container (dynamic ID)
- `flashcard-created-date` - Creation date
- `edit-flashcard-button` - Edit button
- `delete-flashcard-button` - Delete button
- `flashcard-flip-area` - Click area for flipping
- `flashcard-front` - Front side
- `flashcard-back` - Back side

### AccountSettings
- `account-settings` - Main container
- `account-email` - Email display
- `account-id` - ID display
- `delete-account-button` - Delete account button
- `delete-account-dialog` - Delete dialog
- `delete-account-confirm-input` - Confirmation input
- `delete-account-cancel` - Cancel button
- `delete-account-confirm` - Confirm button

### AuthenticatedNavbar
- `authenticated-navbar` - Main navbar
- `logo-link` - Logo link
- `nav-my-flashcards` - My Flashcards nav link
- `nav-generate` - Generate nav link
- `theme-toggle` - Theme toggle button
- `user-menu-trigger` - User menu trigger
- `user-menu-content` - User menu dropdown
- `user-menu-email` - User email in menu
- `menu-my-flashcards` - My Flashcards menu item
- `menu-generate` - Generate menu item
- `menu-settings` - Settings menu item
- `menu-logout` - Logout menu item

## 📊 Visual Regression Testing

Screenshots are automatically captured for visual regression:

```typescript
await expect(page).toHaveScreenshot('login-page.png');
```

Snapshots are stored in `tests/e2e/*/screenshots/` directories.

## 🐛 Debugging

### Using Playwright Inspector

```bash
npm run test:e2e:debug
```

### Using Playwright UI Mode

```bash
npm run test:e2e:ui
```

### View Trace Files

When tests fail, trace files are generated automatically. View them with:

```bash
npx playwright show-trace test-results/trace.zip
```

## 📈 Best Practices

1. **Use Page Objects**: Always interact with pages through Page Object Models
2. **Use data-testid**: Select elements using `data-testid` attributes
3. **Avoid hardcoded waits**: Use Playwright's auto-waiting features
4. **Test isolation**: Each test should be independent
5. **Descriptive names**: Use clear, descriptive test names
6. **Arrange-Act-Assert**: Follow AAA pattern in tests
7. **Clean up**: Tests should clean up after themselves

## 🔍 Example Test Structure

```typescript
import { test, expect } from '../fixtures/test-fixtures';
import { getTestUser } from '../helpers/test-helpers';

test.describe('Feature Name', () => {
  
  test.beforeEach(async ({ loginPage }) => {
    // Setup - runs before each test
    await loginPage.goto();
  });

  test('should do something', async ({ loginPage, page }) => {
    // Arrange
    const testUser = getTestUser();
    
    // Act
    await loginPage.login(testUser.email, testUser.password);
    
    // Assert
    await expect(page).toHaveURL(/.*generate/);
  });
  
  test.afterEach(async ({ page }) => {
    // Cleanup - runs after each test
  });
});
```

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)
