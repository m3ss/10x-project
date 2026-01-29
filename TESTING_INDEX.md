# 📚 Dokumentacja testowa - Indeks

> Centralny punkt dostępu do wszystkich zasobów dotyczących testowania w projekcie.

## 🎯 Szybki start

**Nowy w testowaniu?** Zacznij tutaj:
1. [TESTING_SETUP.md](./TESTING_SETUP.md) - Przegląd środowiska testowego
2. [tests/QUICK_START.md](./tests/QUICK_START.md) - Komendy i podstawowe przykłady
3. [tests/TEST_TEMPLATES.md](./tests/TEST_TEMPLATES.md) - Szablony do kopiowania

**Gotowy do pisania testów?** Przejdź do:
- [tests/TEST_SCENARIOS.md](./tests/TEST_SCENARIOS.md) - Szczegółowe scenariusze testowe

---

## 📖 Dokumenty

### 1. TESTING_SETUP.md
**Co znajdziesz:** Kompleksowy przegląd środowiska testowego
- Zainstalowane zależności
- Struktura projektu
- Pliki konfiguracyjne
- Dostępne skrypty npm
- Zgodność z wytycznymi Vitest i Playwright
- Progi pokrycia kodu
- Integracja CI/CD

**Kiedy czytać:** Na początku, aby zrozumieć całe środowisko testowe

📄 [Otwórz TESTING_SETUP.md](./TESTING_SETUP.md)

---

### 2. tests/QUICK_START.md
**Co znajdziesz:** Szybki przewodnik i cheat sheet
- Najważniejsze komendy
- Pisanie pierwszego testu jednostkowego
- Pisanie pierwszego testu E2E
- Najczęściej używane queries i locators
- Powszechne asercje
- Mockowanie (funkcje, moduły, API)
- Wskazówki debugowania
- Best practices

**Kiedy czytać:** Gdy potrzebujesz szybkiej referencji podczas pisania testów

📄 [Otwórz tests/QUICK_START.md](./tests/QUICK_START.md)

---

### 3. tests/TEST_SCENARIOS.md
**Co znajdziesz:** Szczegółowe scenariusze testów jednostkowych
- **Serwisy** (AuthService, FlashcardService, GenerationService, OpenRouterService)
  - Scenariusze pozytywne ✅
  - Scenariusze negatywne ❌
  - Edge cases 🔶
  - Strategie mockowania
- **Hooki React** (useFlashcards, useCreateFlashcard, useSaveFlashcards, useGenerateFlashcards)
- **Funkcje pomocnicze** (walidacje, utilities)
- **Komponenty React** (formularze, widoki, karty i listy)
- Priorytety implementacji
- Wzorce i dobre praktyki
- Checklist implementacji

**Kiedy czytać:** Przed implementacją testów dla konkretnej części aplikacji

📄 [Otwórz tests/TEST_SCENARIOS.md](./tests/TEST_SCENARIOS.md)

---

### 4. tests/TEST_TEMPLATES.md
**Co znajdziesz:** Gotowe do użycia szablony
- Szablon testu serwisu
- Szablon testu hooka React
- Szablon testu komponentu React
- Szablon testu funkcji pomocniczej
- Mockowanie Supabase (SELECT, INSERT, UPDATE, DELETE, Auth)
- Mockowanie Fetch (sukces, błędy, wielokrotne wywołania)
- Mockowanie innych zależności (window, console, Date, crypto)
- Wzorce testowania (timeout, retry, debounce)
- Best practices
- Debugowanie testów

**Kiedy używać:** Kopiuj i dostosuj szablony podczas pisania nowych testów

📄 [Otwórz tests/TEST_TEMPLATES.md](./tests/TEST_TEMPLATES.md)

---

### 5. tests/README.md
**Co znajdziesz:** Szczegółowa dokumentacja struktury testów
- Organizacja katalogów
- Uruchamianie testów jednostkowych (Vitest)
- Uruchamianie testów E2E (Playwright)
- Pisanie testów jednostkowych
- Pisanie testów E2E
- Best practices
- Integracja CI/CD
- Debugowanie testów

**Kiedy czytać:** Gdy potrzebujesz głębszej wiedzy o strukturze i organizacji testów

📄 [Otwórz tests/README.md](./tests/README.md)

---

## 🔧 Narzędzia i komendy

### Testy jednostkowe (Vitest)

```bash
# Podstawowe
npm run test:unit              # Uruchom wszystkie testy
npm run test:unit:watch        # Tryb watch (polecane)
npm run test:unit:ui           # Interfejs graficzny
npm run test:unit:coverage     # Z raportem pokrycia kodu

# Filtrowanie
npm run test:unit -- auth      # Tylko testy z "auth" w nazwie
npm run test:unit -- src/lib   # Tylko testy w src/lib
```

### Testy E2E (Playwright)

```bash
# Podstawowe
npm run test:e2e               # Uruchom wszystkie testy E2E
npm run test:e2e:headed        # Z widoczną przeglądarką
npm run test:e2e:debug         # Tryb debugowania
npm run test:e2e:ui            # Interfejs UI (polecane)

# Narzędzia
npm run test:e2e:report        # Pokaż raport
npm run test:e2e:codegen       # Nagraj nowy test
```

### Wszystkie testy

```bash
npm run test:all               # Unit + E2E
```

---

## 🎓 Ścieżka nauki

### Poziom 1: Początkujący
1. Przeczytaj [TESTING_SETUP.md](./TESTING_SETUP.md) - zrozum środowisko
2. Przejrzyj [tests/QUICK_START.md](./tests/QUICK_START.md) - poznaj podstawy
3. Uruchom przykładowe testy: `npm run test:unit`
4. Obejrzyj testy w `tests/unit/example.test.tsx`
5. Skopiuj szablon z [tests/TEST_TEMPLATES.md](./tests/TEST_TEMPLATES.md)
6. Napisz swój pierwszy test dla prostej funkcji

### Poziom 2: Średniozaawansowany
1. Przeczytaj scenariusze dla funkcji pomocniczych w [tests/TEST_SCENARIOS.md](./tests/TEST_SCENARIOS.md)
2. Napisz testy dla `isValidEmail` i `isStrongPassword`
3. Uruchom w trybie watch: `npm run test:unit:watch`
4. Napisz testy dla prostego hooka (np. `useCreateFlashcard`)
5. Naucz się mockować fetch
6. Sprawdź coverage: `npm run test:unit:coverage`

### Poziom 3: Zaawansowany
1. Napisz testy dla `AuthService` (wszystkie funkcje)
2. Napisz testy dla `FlashcardService` (CRUD operations)
3. Naucz się mockować Supabase
4. Napisz testy dla komponentu z formularzem (np. `LoginForm`)
5. Napisz testy dla złożonego hooka (np. `useFlashcards`)
6. Zaimplementuj scenariusze z [tests/TEST_SCENARIOS.md](./tests/TEST_SCENARIOS.md)

### Poziom 4: Ekspert
1. Napisz testy dla `GenerationService` (z retry logic)
2. Napisz testy dla wszystkich widoków
3. Zaimplementuj wszystkie scenariusze z Priorytetu 1 i 2
4. Osiągnij 80%+ coverage dla services
5. Napisz testy E2E dla głównych user flows
6. Zoptymalizuj suite testów (szybkość, maintainability)

---

## 📊 Struktura katalogów

```
10x-project/
├── tests/
│   ├── setup/
│   │   ├── vitest.setup.ts        # Globalna konfiguracja Vitest
│   │   └── test-utils.tsx         # Utilities do testowania
│   ├── unit/                      # Testy jednostkowe
│   │   ├── services/              # Testy serwisów
│   │   ├── hooks/                 # Testy hooków
│   │   ├── components/            # Testy komponentów
│   │   └── utils/                 # Testy funkcji pomocniczych
│   ├── e2e/                       # Testy E2E
│   │   ├── pages/                 # Page Object Models
│   │   └── *.spec.ts              # Testy E2E
│   ├── README.md                  # Dokumentacja testów
│   ├── QUICK_START.md             # Szybki start
│   ├── TEST_SCENARIOS.md          # Scenariusze testowe
│   └── TEST_TEMPLATES.md          # Szablony testów
├── vitest.config.ts               # Konfiguracja Vitest
├── playwright.config.ts           # Konfiguracja Playwright
├── TESTING_SETUP.md               # Setup środowiska testowego
└── TESTING_INDEX.md               # Ten plik
```

---

## 🎯 Cele pokrycia kodu

### Minimalne wymagania
- **Ogólne**: 80% lines, functions, branches, statements
- **Funkcje krytyczne**: 100% (auth, flashcard CRUD, generation)

### Sprawdź pokrycie
```bash
npm run test:unit:coverage
open coverage/index.html
```

---

## 🐛 Troubleshooting

### Problem: Testy nie uruchamiają się
**Rozwiązanie:**
1. Sprawdź czy wszystkie zależności są zainstalowane: `npm install`
2. Sprawdź konfigurację w `vitest.config.ts`
3. Uruchom z verbose: `npm run test:unit -- --reporter=verbose`

### Problem: Mock nie działa
**Rozwiązanie:**
1. Sprawdź czy mock jest zdefiniowany przed importem modułu
2. Użyj `vi.clearAllMocks()` w `beforeEach`
3. Zobacz przykłady w [tests/TEST_TEMPLATES.md](./tests/TEST_TEMPLATES.md)

### Problem: Test timeout
**Rozwiązanie:**
1. Zwiększ timeout: `it('test', async () => {...}, 10000)`
2. Sprawdź czy `await` jest używany poprawnie
3. Sprawdź czy mocki zwracają promises

### Problem: Komponent się nie renderuje
**Rozwiązanie:**
1. Użyj `screen.debug()` aby zobaczyć DOM
2. Sprawdź czy używasz `renderWithProviders`
3. Sprawdź czy wszystkie zależności są zmockowane

---

## 📚 Dodatkowe zasoby

### Oficjalna dokumentacja
- [Vitest](https://vitest.dev/) - Framework testowy
- [React Testing Library](https://testing-library.com/react) - Testowanie React
- [Playwright](https://playwright.dev/) - Testy E2E
- [Testing Library Queries](https://testing-library.com/docs/queries/about) - Przewodnik po queries

### Artykuły i przewodniki
- [Common mistakes with React Testing Library](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Effective Snapshot Testing](https://kentcdodds.com/blog/effective-snapshot-testing)
- [Testing Implementation Details](https://kentcdodds.com/blog/testing-implementation-details)

### Reguły projektu
- [.cursor/rules/vitest-unit-testing.mdc](./.cursor/rules/vitest-unit-testing.mdc) - Wytyczne Vitest
- [.cursor/rules/playwright-e2e-testing.mdc](./.cursor/rules/playwright-e2e-testing.mdc) - Wytyczne Playwright

---

## ✅ Checklist przed rozpoczęciem

- [ ] Przeczytałem [TESTING_SETUP.md](./TESTING_SETUP.md)
- [ ] Przejrzałem [tests/QUICK_START.md](./tests/QUICK_START.md)
- [ ] Uruchomiłem przykładowe testy: `npm run test:unit`
- [ ] Zrozumiałem strukturę katalogów testowych
- [ ] Wiem jak mockować Supabase i fetch
- [ ] Mam pod ręką [tests/TEST_TEMPLATES.md](./tests/TEST_TEMPLATES.md)
- [ ] Wiem gdzie szukać scenariuszy testowych ([tests/TEST_SCENARIOS.md](./tests/TEST_SCENARIOS.md))

---

## 🚀 Rozpocznij testowanie!

Wybierz punkt startowy:

1. **Chcę szybko rozpocząć** → [tests/QUICK_START.md](./tests/QUICK_START.md)
2. **Chcę zrozumieć środowisko** → [TESTING_SETUP.md](./TESTING_SETUP.md)
3. **Chcę pisać testy** → [tests/TEST_TEMPLATES.md](./tests/TEST_TEMPLATES.md)
4. **Chcę poznać scenariusze** → [tests/TEST_SCENARIOS.md](./tests/TEST_SCENARIOS.md)
5. **Chcę głębszą wiedzę** → [tests/README.md](./tests/README.md)

---

**Powodzenia w testowaniu!** 🎉

Pamiętaj: Dobre testy to inwestycja w przyszłość projektu. Im więcej czasu poświęcisz na testy teraz, tym mniej problemów będziesz mieć później.
