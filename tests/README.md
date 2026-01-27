# Testing Documentation

This directory contains all test files for the application, organized into unit tests and end-to-end (E2E) tests.

## Directory Structure

```
tests/
├── setup/              # Test configuration and utilities
│   ├── vitest.setup.ts    # Vitest global setup
│   └── test-utils.tsx     # Custom render utilities
├── unit/               # Unit and integration tests (Vitest)
│   └── example.test.tsx   # Example unit tests
└── e2e/                # End-to-end tests (Playwright)
    ├── pages/             # Page Object Models
    │   ├── BasePage.ts      # Base page class
    │   ├── HomePage.ts      # Home page model
    │   └── LoginPage.ts     # Login page model
    └── example.spec.ts    # Example E2E tests
```

## Unit Tests (Vitest)

### Running Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run tests in watch mode
npm run test:unit:watch

# Run tests with UI
npm run test:unit:ui

# Generate coverage report
npm run test:unit:coverage
```

### Writing Unit Tests

Unit tests are located in `tests/unit/` and use the following stack:
- **Vitest** - Fast unit test framework
- **React Testing Library** - Component testing
- **jsdom** - DOM environment for tests

#### Example Test Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent } from '../setup/test-utils';

describe('Component Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should do something', async () => {
    // Arrange - Set up test data and conditions
    const mockFn = vi.fn();
    
    // Act - Perform the action
    renderWithProviders(<Component prop={mockFn} />);
    
    // Assert - Verify the results
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

### Best Practices for Unit Tests

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **Use descriptive test names**: `it('should display error when email is invalid', ...)`
3. **Mock external dependencies**: Use `vi.mock()` and `vi.fn()`
4. **Test user interactions**: Use `userEvent` from Testing Library
5. **Use semantic queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
6. **Keep tests independent**: Each test should run in isolation
7. **Use setup files**: Place reusable mocks in `tests/setup/vitest.setup.ts`

### Coverage Thresholds

- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

Critical business logic should have 100% coverage.

## E2E Tests (Playwright)

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with headed browser
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug

# Open Playwright UI
npm run test:e2e:ui

# Show test report
npm run test:e2e:report

# Generate tests with codegen
npm run test:e2e:codegen
```

### Writing E2E Tests

E2E tests are located in `tests/e2e/` and follow the Page Object Model pattern.

#### Page Object Model (POM)

All page interactions are encapsulated in Page Object classes:

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class MyPage extends BasePage {
  readonly myButton: Locator;

  constructor(page: Page) {
    super(page);
    this.myButton = page.getByRole('button', { name: /click me/i });
  }

  async navigate() {
    await this.goto('/my-page');
    await this.waitForPageLoad();
  }

  async clickMyButton() {
    await this.clickButton(this.myButton);
  }
}
```

#### Example E2E Test

```typescript
import { test, expect } from '@playwright/test';
import { MyPage } from './pages/MyPage';

test.describe('My Feature', () => {
  test('should perform user action', async ({ page }) => {
    // Arrange
    const myPage = new MyPage(page);
    await myPage.navigate();

    // Act
    await myPage.clickMyButton();

    // Assert
    await expect(page).toHaveURL(/success/);
  });
});
```

### Best Practices for E2E Tests

1. **Use Page Object Model**: Encapsulate page logic in dedicated classes
2. **Use semantic locators**: Prefer `getByRole`, `getByLabel` over CSS selectors
3. **Wait for stability**: Use `waitForLoadState('networkidle')` when needed
4. **Isolate tests**: Use browser contexts for test isolation
5. **Visual testing**: Use `toHaveScreenshot()` for visual regression
6. **API testing**: Leverage Playwright's `request` fixture for API validation
7. **Debugging**: Use traces (`--trace on`), screenshots, and videos
8. **Parallel execution**: Tests run in parallel by default
9. **Avoid hard waits**: Use `waitFor` methods instead of `page.waitForTimeout()`
10. **Test hooks**: Use `beforeEach`/`afterEach` for setup/cleanup

### Browser Configuration

Tests run on **Chromium (Desktop Chrome)** only, as specified in the testing guidelines.

## CI/CD Integration

Tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run unit tests
  run: npm run test:unit

- name: Run E2E tests
  run: npm run test:e2e
```

## Debugging Tests

### Debugging Unit Tests

1. Use VS Code debugger with Vitest extension
2. Add `console.log()` statements
3. Use `screen.debug()` to print component tree
4. Run tests in watch mode: `npm run test:unit:watch`

### Debugging E2E Tests

1. **Debug mode**: `npm run test:e2e:debug` - Step through tests
2. **Headed mode**: `npm run test:e2e:headed` - See browser actions
3. **Playwright UI**: `npm run test:e2e:ui` - Visual test runner
4. **Traces**: Enable traces in config, view with `playwright show-trace`
5. **Screenshots/Videos**: Automatically captured on failure

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
