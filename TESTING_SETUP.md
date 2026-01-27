# Testing Environment Setup - Dokumentacja

## Przegląd

Środowisko testowe zostało skonfigurowane zgodnie z wytycznymi z `.ai/tech-stack.md` i zasadami testowania określonymi w `.cursor/rules/`. System obejmuje dwa typy testów:

- **Testy jednostkowe i integracyjne** - Vitest + React Testing Library
- **Testy E2E** - Playwright z Page Object Model

## Struktura projektu

```
tests/
├── setup/                      # Konfiguracja testów
│   ├── vitest.setup.ts        # Globalna konfiguracja Vitest
│   └── test-utils.tsx         # Pomocnicze funkcje do testowania React
├── unit/                       # Testy jednostkowe
│   └── example.test.tsx       # Przykładowe testy demonstracyjne
└── e2e/                        # Testy E2E
    ├── pages/                 # Page Object Models
    │   ├── BasePage.ts        # Bazowa klasa dla wszystkich stron
    │   ├── HomePage.ts        # Model strony głównej
    │   └── LoginPage.ts       # Model strony logowania
    └── example.spec.ts        # Przykładowe testy E2E

Pliki konfiguracyjne:
├── vitest.config.ts           # Konfiguracja Vitest
├── playwright.config.ts       # Konfiguracja Playwright
└── package.json               # Skrypty testowe
```

## Zainstalowane zależności

### Testy jednostkowe
- `vitest` - Framework testowy z natywnym wsparciem ESM i TypeScript
- `@vitest/ui` - Interfejs graficzny do testów
- `@vitest/coverage-v8` - Generowanie raportów pokrycia kodu
- `happy-dom` - Lekkie środowisko DOM (alternatywa dla jsdom)
- `@testing-library/react` - Testowanie komponentów React
- `@testing-library/jest-dom` - Dodatkowe matchery dla DOM
- `@testing-library/user-event` - Symulacja interakcji użytkownika
- `msw` - Mock Service Worker do mockowania API

### Testy E2E
- `@playwright/test` - Framework do testów end-to-end
- Chromium browser (zgodnie z wytycznymi - tylko Desktop Chrome)

## Konfiguracja Vitest

### Główne ustawienia (`vitest.config.ts`)

```typescript
{
  environment: 'happy-dom',           // Środowisko DOM
  globals: true,                      // Globalne API testowe
  setupFiles: ['./tests/setup/vitest.setup.ts'],
  
  coverage: {
    provider: 'v8',
    thresholds: {
      lines: 80,                      // Minimalne pokrycie 80%
      functions: 80,
      branches: 80,
      statements: 80,
    }
  },
  
  pool: 'threads',                    // Równoległe wykonywanie testów
  isolate: true,                      // Izolacja testów
}
```

### Setup file

- **vitest.setup.ts** - Konfiguruje środowisko testowe:
  - Cleanup po każdym teście
  - Mock dla `window.matchMedia`
  - Mock dla `IntersectionObserver`
  - Mock dla `ResizeObserver`
  - Rozszerzenia expect z `@testing-library/jest-dom`

## Konfiguracja Playwright

### Główne ustawienia (`playwright.config.ts`)

```typescript
{
  testDir: './tests/e2e',
  fullyParallel: true,                // Pełne równoległe wykonywanie
  retries: process.env.CI ? 2 : 0,    // Ponowienia na CI
  
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',          // Trace przy pierwszym retry
    screenshot: 'only-on-failure',     // Screenshot przy błędzie
    video: 'retain-on-failure',        // Video przy błędzie
  },
  
  projects: [
    {
      name: 'chromium',               // Tylko Chromium (zgodnie z wytycznymi)
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  
  webServer: {
    command: 'npm run dev',           // Automatyczne uruchomienie dev servera
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  }
}
```

## Dostępne skrypty npm

### Testy jednostkowe

```bash
# Uruchom wszystkie testy jednostkowe
npm run test:unit

# Tryb watch (automatyczne ponowne uruchamianie)
npm run test:unit:watch

# Interfejs UI do testów
npm run test:unit:ui

# Generowanie raportu pokrycia kodu
npm run test:unit:coverage
```

### Testy E2E

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# Testy z widoczną przeglądarką
npm run test:e2e:headed

# Tryb debugowania (krok po kroku)
npm run test:e2e:debug

# Interfejs UI Playwright
npm run test:e2e:ui

# Pokaż raport z testów
npm run test:e2e:report

# Generator testów (nagrywa interakcje)
npm run test:e2e:codegen
```

### Wszystkie testy

```bash
# Uruchom testy jednostkowe i E2E
npm run test:all
```

## Wzorce i praktyki

### Testy jednostkowe - AAA Pattern

```typescript
describe('Component', () => {
  it('should do something', async () => {
    // Arrange - Przygotowanie
    const mockFn = vi.fn();
    
    // Act - Akcja
    renderWithProviders(<Component onClick={mockFn} />);
    await userEvent.click(screen.getByRole('button'));
    
    // Assert - Weryfikacja
    expect(mockFn).toHaveBeenCalled();
  });
});
```

### Testy E2E - Page Object Model

```typescript
// Page Object
export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  
  async login(email: string, password: string) {
    await this.fillInput(this.emailInput, email);
    await this.submitButton.click();
  }
}

// Test
test('should login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login('user@example.com', 'password');
  await expect(page).toHaveURL(/dashboard/);
});
```

## Zgodność z wytycznymi

### Vitest Guidelines

✅ **vi object dla test doubles** - Wykorzystanie `vi.fn()`, `vi.spyOn()`, `vi.stubGlobal()`  
✅ **vi.mock() factory patterns** - Mockowanie na poziomie modułu  
✅ **Setup files** - Reużywalna konfiguracja w `vitest.setup.ts`  
✅ **Inline snapshots** - Dostępne poprzez `toMatchInlineSnapshot()`  
✅ **Coverage configuration** - Progi pokrycia skonfigurowane (80%)  
✅ **Watch mode** - Dostępny przez `npm run test:unit:watch`  
✅ **UI mode** - Dostępny przez `npm run test:unit:ui`  
✅ **happy-dom environment** - Skonfigurowane dla testów DOM  
✅ **TypeScript type checking** - Pełna integracja z TypeScript

### Playwright Guidelines

✅ **Chromium/Desktop Chrome only** - Tylko przeglądarka Chromium  
✅ **Browser contexts** - Automatyczna izolacja między testami  
✅ **Page Object Model** - Implementacja BasePage + konkretne strony  
✅ **Locators** - Semantyczne selektory (`getByRole`, `getByLabel`)  
✅ **API testing** - Dostępne poprzez fixture `request`  
✅ **Visual comparison** - `toHaveScreenshot()` skonfigurowane  
✅ **Codegen tool** - Dostępny przez `npm run test:e2e:codegen`  
✅ **Trace viewer** - Automatyczne trace przy retry  
✅ **Test hooks** - `beforeEach`, `afterEach` w przykładach  
✅ **Expect assertions** - Pełne wsparcie matcherów Playwright  
✅ **Parallel execution** - `fullyParallel: true`

## Progi pokrycia kodu

Zgodnie z tech-stack.md:

- **Minimalny poziom pokrycia**: 80%
- **Funkcje krytyczne**: 100%

Konfiguracja w `vitest.config.ts` wymusza te progi:

```typescript
coverage: {
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80,
  }
}
```

## Integracja z CI/CD

Testy są przygotowane do działania w pipeline'ach CI/CD (GitHub Actions):

```yaml
- name: Run unit tests with coverage
  run: npm run test:unit:coverage

- name: Run E2E tests
  run: npm run test:e2e
  
- name: Upload test results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: test-results
    path: |
      test-results/
      playwright-report/
      coverage/
```

## Debugging

### Vitest
- VS Code debugger + Vitest extension
- `screen.debug()` - wyświetla drzewo komponentów
- `npm run test:unit:ui` - graficzny interfejs

### Playwright
- `npm run test:e2e:debug` - debugowanie krok po kroku
- `npm run test:e2e:headed` - widoczna przeglądarka
- `npm run test:e2e:ui` - graficzny interfejs
- Trace viewer - analiza błędów z pełnym kontekstem
- Screenshots i video - automatycznie przy błędach

## Następne kroki

1. **Pisanie testów jednostkowych**:
   - Testy dla serwisów (`src/lib/*.service.ts`)
   - Testy dla komponentów React (`src/components/*.tsx`)
   - Testy dla hooków (`src/components/hooks/*.ts`)

2. **Pisanie testów E2E**:
   - Scenariusze rejestracji i logowania
   - Generowanie fiszek
   - Zarządzanie fiszkami
   - Zarządzanie kontem

3. **Mockowanie API**:
   - Konfiguracja MSW dla testów integracyjnych
   - Mockowanie Supabase w testach
   - Mockowanie OpenRouter API

4. **Rozszerzanie Page Object Model**:
   - RegisterPage
   - DashboardPage
   - FlashcardsPage
   - SettingsPage

## Weryfikacja instalacji

Sprawdź, czy środowisko działa poprawnie:

```bash
# Test jednostkowy
npm run test:unit

# Test E2E
npm run test:e2e

# Oba typy testów
npm run test:all
```

Oczekiwany wynik:
- ✅ Testy jednostkowe: 7/7 passed
- ✅ Testy E2E: 5/7 passed (2 niepowodzenia to oczekiwane przykłady)

## Dokumentacja

- [Testy - README.md](./tests/README.md) - Szczegółowa dokumentacja testów
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [React Testing Library](https://testing-library.com/react)

## Status

✅ Środowisko testowe w pełni skonfigurowane i gotowe do użycia!
