# Testing Quick Start Guide

## 🚀 Quick Commands

### Unit Tests (Vitest)
```bash
npm run test:unit              # Run once
npm run test:unit:watch        # Watch mode (recommended for development)
npm run test:unit:ui           # Visual interface
npm run test:unit:coverage     # With coverage report
```

### E2E Tests (Playwright)
```bash
npm run test:e2e               # Run all E2E tests
npm run test:e2e:headed        # See browser (useful for debugging)
npm run test:e2e:debug         # Step-by-step debugging
npm run test:e2e:ui            # Playwright UI (recommended)
npm run test:e2e:codegen       # Record new tests
```

### All Tests
```bash
npm run test:all               # Run unit + E2E tests
```

## 📝 Writing Your First Unit Test

**Location**: `tests/unit/my-feature.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '../setup/test-utils';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    // Arrange
    renderWithProviders(<MyComponent />);
    
    // Act
    const button = screen.getByRole('button', { name: /click me/i });
    
    // Assert
    expect(button).toBeInTheDocument();
  });
  
  it('should handle user interaction', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockFn = vi.fn();
    renderWithProviders(<MyComponent onClick={mockFn} />);
    
    // Act
    await user.click(screen.getByRole('button'));
    
    // Assert
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
```

## 🎭 Writing Your First E2E Test

**Step 1**: Create Page Object (`tests/e2e/pages/MyPage.ts`)

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class MyPage extends BasePage {
  readonly myButton: Locator;

  constructor(page: Page) {
    super(page);
    this.myButton = page.getByRole('button', { name: /submit/i });
  }

  async navigate() {
    await this.goto('/my-page');
    await this.waitForPageLoad();
  }

  async clickSubmit() {
    await this.clickButton(this.myButton);
  }
}
```

**Step 2**: Write test (`tests/e2e/my-feature.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';
import { MyPage } from './pages/MyPage';

test.describe('My Feature', () => {
  test('should complete user flow', async ({ page }) => {
    // Arrange
    const myPage = new MyPage(page);
    await myPage.navigate();

    // Act
    await myPage.clickSubmit();

    // Assert
    await expect(page).toHaveURL(/success/);
  });
});
```

## 🔍 Common Queries (Testing Library)

```typescript
// By role (preferred - accessible)
screen.getByRole('button', { name: /submit/i })
screen.getByRole('textbox', { name: /email/i })

// By label text
screen.getByLabelText(/password/i)

// By text content
screen.getByText(/welcome back/i)

// By placeholder
screen.getByPlaceholderText(/enter email/i)

// Async queries (for elements that appear later)
await screen.findByRole('alert')
```

## 🎯 Common Locators (Playwright)

```typescript
// By role (preferred - accessible)
page.getByRole('button', { name: /submit/i })
page.getByRole('link', { name: /login/i })

// By label
page.getByLabel(/email/i)

// By placeholder
page.getByPlaceholder(/search/i)

// By text
page.getByText(/welcome/i)

// By test id (last resort)
page.getByTestId('submit-button')
```

## ✅ Common Assertions

### Unit Tests (Vitest + Testing Library)

```typescript
// Element presence
expect(element).toBeInTheDocument()
expect(element).toBeVisible()
expect(element).not.toBeInTheDocument()

// Text content
expect(element).toHaveTextContent(/hello/i)

// Attributes
expect(element).toHaveAttribute('disabled')
expect(element).toHaveClass('active')

// Values
expect(input).toHaveValue('test@example.com')

// Mocks
expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
expect(mockFn).toHaveBeenCalledTimes(2)
```

### E2E Tests (Playwright)

```typescript
// Page
await expect(page).toHaveURL(/dashboard/)
await expect(page).toHaveTitle(/welcome/i)

// Elements
await expect(locator).toBeVisible()
await expect(locator).toBeHidden()
await expect(locator).toBeEnabled()
await expect(locator).toBeDisabled()

// Text
await expect(locator).toHaveText(/hello/i)
await expect(locator).toContainText('world')

// Count
await expect(page.getByRole('listitem')).toHaveCount(5)

// Screenshots
await expect(page).toHaveScreenshot('page.png')
```

## 🛠️ Mocking

### Mock Functions (Vitest)

```typescript
// Simple mock
const mockFn = vi.fn()
mockFn.mockReturnValue('result')

// Mock implementation
const mockFn = vi.fn((x) => x * 2)

// Spy on existing function
const spy = vi.spyOn(obj, 'method')
spy.mockImplementation(() => 'mocked')
```

### Mock Modules (Vitest)

```typescript
// Mock entire module
vi.mock('@/lib/api', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: 'test' })
}))

// Partial mock (keep some real implementations)
vi.mock('@/lib/utils', async () => {
  const actual = await vi.importActual('@/lib/utils')
  return {
    ...actual,
    specificFn: vi.fn()
  }
})
```

### Mock API (Playwright)

```typescript
test('should handle API response', async ({ page }) => {
  // Mock API call
  await page.route('**/api/users', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ users: [] })
    })
  })
  
  await page.goto('/users')
  // Test continues...
})
```

## 🐛 Debugging Tips

### Unit Tests
```bash
# Add debug output
screen.debug()              # Print component tree
screen.logTestingPlaygroundURL()  # Get query suggestions

# Use UI mode for visual debugging
npm run test:unit:ui
```

### E2E Tests
```bash
# Debug mode - step through tests
npm run test:e2e:debug

# Headed mode - see browser
npm run test:e2e:headed

# Playwright UI - best visual experience
npm run test:e2e:ui

# Generate tests by recording
npm run test:e2e:codegen
```

## 📊 Coverage

Generate coverage report:
```bash
npm run test:unit:coverage
```

View HTML report:
```bash
open coverage/index.html
```

## 📚 More Resources

- [Full Testing Documentation](./README.md)
- [Testing Setup Details](../TESTING_SETUP.md)
- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [Testing Library Docs](https://testing-library.com/)

## 💡 Best Practices

1. ✅ **Write tests in watch mode** - `npm run test:unit:watch`
2. ✅ **Follow AAA pattern** - Arrange, Act, Assert
3. ✅ **Use semantic queries** - `getByRole` over `getByTestId`
4. ✅ **Test user behavior** - not implementation details
5. ✅ **Use Page Object Model** - for E2E tests
6. ✅ **Isolate tests** - each test should be independent
7. ✅ **Mock external dependencies** - for unit tests
8. ✅ **Use descriptive test names** - describe what the test does
9. ✅ **Keep tests simple** - one concept per test
10. ✅ **Debug visually** - use UI modes when stuck
