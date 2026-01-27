# Plan Testów - 10x-cards (Aplikacja do Generowania Fiszek Edukacyjnych)

## 1. Wprowadzenie i Cele Testowania

### 1.1 Cel dokumentu
Dokument określa strategię, zakres i metodologię testowania aplikacji 10x-cards - platformy umożliwiającej automatyczne generowanie fiszek edukacyjnych przy użyciu modeli AI oraz zarządzanie nimi.

### 1.2 Główne cele testowania
- Weryfikacja poprawności działania mechanizmu generowania fiszek przez AI (OpenRouter)
- Zapewnienie bezpieczeństwa danych użytkowników i prawidłowego działania mechanizmów autoryzacji (RLS)
- Potwierdzenie integralności operacji CRUD na fiszkach
- Weryfikacja zgodności z wymaganiami RODO
- Zapewnienie wysokiej jakości UX/UI i dostępności (accessibility)
- Ocena wydajności i skalowalności systemu
- Weryfikacja poprawności walidacji danych wejściowych

## 2. Zakres Testów

### 2.1 Obszary objęte testami

#### 2.1.1 Moduł Autentykacji i Autoryzacji
- Rejestracja użytkowników (email + hasło)
- Logowanie i wylogowanie
- Reset hasła (request + update)
- Usuwanie konta użytkownika
- Walidacja siły hasła i formatu email
- Sesje użytkownika i zarządzanie tokenami

#### 2.1.2 Moduł Generowania Fiszek (AI)
- Endpoint `/api/generations` (POST)
- Integracja z OpenRouter API
- Walidacja tekstu źródłowego (1000-10000 znaków)
- Mechanizm retry z exponential backoff (max 3 próby)
- Timeout handling (60s)
- Logowanie błędów generowania
- Zapisywanie metadanych generacji (hash, model, duration, count)

#### 2.1.3 Moduł Zarządzania Fiszkami
- Endpoint `/api/flashcards` (GET, POST, PUT, DELETE)
- Tworzenie fiszek (pojedyncze i bulk)
- Edycja fiszek
- Usuwanie fiszek
- Listowanie fiszek z paginacją
- Walidacja długości front (max 200) i back (max 500)
- Śledzenie źródła fiszki (ai-full, ai-edited, manual)

#### 2.1.4 Warstwa Bazodanowa
- Row-Level Security (RLS) policies
- Migracje bazy danych
- Triggery (updated_at)
- Foreign key constraints
- Indeksy i performance
- Cascading deletes

#### 2.1.5 Frontend
- Komponenty React (FlashcardGenerationView, FlashcardList, formularze auth)
- Custom hooks (useGenerateFlashcards, useSaveFlashcards)
- Komponenty UI (Shadcn/ui)
- Routing i middleware Astro
- Responsywność (mobile, tablet, desktop)
- Accessibility (WCAG 2.1 AA)

#### 2.1.6 Integracje Zewnętrzne
- Supabase Auth
- Supabase Database Client
- OpenRouter API
- Email service (reset hasła)

### 2.2 Obszary wyłączone z testów
- Zaawansowane algorytmy spaced repetition (MVP używa gotowej biblioteki)
- Funkcje gamifikacji (poza zakresem MVP)
- Import dokumentów PDF/DOCX
- Współdzielenie fiszek między użytkownikami
- Publiczne API dla zewnętrznych integracji

## 3. Typy Testów do Przeprowadzenia

### 3.1 Testy Jednostkowe (Unit Tests)

**Narzędzia:** Vitest, React Testing Library

**Zakres:**
- Wszystkie funkcje w `auth.service.ts` (loginUser, registerUser, mapSupabaseError, isValidEmail, isStrongPassword)
- Funkcje w `generation.service.ts` (generateSourceTextHash, callAIService, callAIServiceWithRetry)
- Klasa `OpenRouterService` i jej metody (buildRequestPayload, executeRequest, executeRequestWithRetry)
- Funkcje walidacji Zod schemas
- Custom hooks React (useGenerateFlashcards, useSaveFlashcards)
- Utility functions (`utils.ts`)

**Metryki:**
- Pokrycie kodu minimum 80%
- Pokrycie funkcji krytycznych 100%

### 3.2 Testy Integracyjne (Integration Tests)

**Narzędzia:** Vitest, Supabase Test Client, MSW (Mock Service Worker)

**Zakres:**
- Integracja API endpoints z serwisami
  - `/api/auth/*` + `auth.service.ts`
  - `/api/generations` + `generation.service.ts` + `OpenRouterService`
  - `/api/flashcards` + `flashcard.service.ts`
- Integracja z bazą danych (Supabase client + PostgreSQL)
- Testy RLS policies (scenariusze pozytywne i negatywne)
- Middleware Astro (auth check, routing)
- Integracja komponentów React z hooks i API

**Kluczowe scenariusze:**
```
Scenariusz: Generowanie fiszek z poprawnego tekstu
1. Użytkownik zalogowany
2. POST /api/generations z tekstem 5000 znaków
3. AI service zwraca 5 fiszek
4. Generation record zapisany w DB
5. Flashcard proposals zwrócone do klienta
Oczekiwany wynik: 201, poprawna struktura danych
```

```
Scenariusz: RLS Policy - Próba dostępu do cudzych fiszek
1. User A zalogowany
2. User B tworzy fiszkę
3. User A próbuje GET /api/flashcards/{id_user_b}
Oczekiwany wynik: 404 lub brak danych (RLS blokuje)
```

### 3.3 Testy End-to-End (E2E)

**Narzędzia:** Playwright

**Zakres pełnych flow użytkownika:**

**E2E-1: Rejestracja i pierwsze generowanie fiszek**
1. Wejście na stronę główną
2. Kliknięcie "Zarejestruj się"
3. Wypełnienie formularza (email, hasło)
4. Potwierdzenie email (mock)
5. Logowanie
6. Wklejenie tekstu źródłowego (2000 znaków)
7. Kliknięcie "Generuj fiszki"
8. Oczekiwanie na wyniki (loader)
9. Przegląd wygenerowanych fiszek
10. Edycja jednej fiszki
11. Zatwierdzenie i zapis
12. Weryfikacja w "Moje fiszki"

**E2E-2: Reset hasła**
1. Kliknięcie "Nie pamiętam hasła"
2. Podanie email
3. Oczekiwanie na email (mock)
4. Kliknięcie linku resetującego
5. Ustawienie nowego hasła
6. Logowanie z nowym hasłem

**E2E-3: Zarządzanie fiszkami**
1. Logowanie
2. Przejście do "Moje fiszki"
3. Ręczne utworzenie fiszki
4. Edycja istniejącej fiszki
5. Usunięcie fiszki (z potwierdzeniem)
6. Weryfikacja zmian

**E2E-4: Usunięcie konta**
1. Logowanie
2. Przejście do ustawień konta
3. Kliknięcie "Usuń konto"
4. Potwierdzenie
5. Weryfikacja wylogowania
6. Próba ponownego logowania (fail)

### 3.4 Testy Bezpieczeństwa (Security Tests)

**Zakres:**

**SEC-1: Row-Level Security Policies**
- Weryfikacja, że użytkownik nie może odczytać fiszek innych użytkowników
- Weryfikacja, że użytkownik nie może modyfikować/usuwać cudzych fiszek
- Weryfikacja, że niezalogowany użytkownik nie ma dostępu do żadnych danych
- Test dla każdej tabeli: flashcards, generations, generation_error_logs

**SEC-2: Input Validation & SQL Injection**
- Próby SQL injection w polach tekstowych
- XSS attacks w treści fiszek
- Testy granic walidacji (boundary testing)

**SEC-3: Authentication & Authorization**
- Próba dostępu do chronionych endpoints bez tokenu
- Próba użycia wygasłego tokenu
- Próba użycia zmanipulowanego tokenu
- CSRF protection

**SEC-4: Sensitive Data Exposure**
- Weryfikacja, że hasła są hashowane
- Weryfikacja, że tokeny nie są logowane
- Weryfikacja, że error messages nie ujawniają szczegółów implementacji

### 3.5 Testy Wydajnościowe (Performance Tests)

**Narzędzia:** k6, Lighthouse

**Zakres:**

**PERF-1: Load Testing**
- Symulacja 50 równoczesnych użytkowników generujących fiszki
- Pomiar czasu odpowiedzi API endpoints
- Monitorowanie zużycia CPU/RAM
- Target: 95% requestów < 2s (poza AI generowaniem)

**PERF-2: Stress Testing**
- Stopniowe zwiększanie obciążenia do punktu załamania
- Identyfikacja bottlenecks
- Test recovery po przeciążeniu

**PERF-3: AI Service Performance**
- Pomiar czasu generowania dla różnych długości tekstu
- Test timeout (60s limit)
- Test retry mechanism pod obciążeniem

**PERF-4: Database Performance**
- Query performance dla list fiszek (1000+ fiszek na użytkownika)
- Index effectiveness
- Pagination performance

**PERF-5: Frontend Performance**
- Lighthouse scores (Performance, Accessibility, Best Practices, SEO)
- Target: wszystkie metryki > 90
- Core Web Vitals (LCP, FID, CLS)

### 3.6 Testy Dostępności (Accessibility Tests)

**Narzędzia:** axe-core, Pa11y, manual testing

**Zakres:**
- Nawigacja klawiaturą (Tab, Enter, Esc)
- Screen reader compatibility (NVDA, JAWS)
- Kontrast kolorów (WCAG AA: minimum 4.5:1)
- ARIA labels i semantic HTML
- Focus management
- Error messages accessibility

**Kryteria:** WCAG 2.1 Level AA compliance

### 3.7 Testy Kompatybilności (Compatibility Tests)

**Przeglądarki:**
- Chrome (latest, latest-1)
- Firefox (latest, latest-1)
- Safari (latest, latest-1)
- Edge (latest)

**Urządzenia:**
- Desktop (1920x1080, 1366x768)
- Tablet (iPad, Android tablet)
- Mobile (iPhone, Android phones)

**Systemy operacyjne:**
- Windows 10/11
- macOS (latest, latest-1)
- iOS (latest, latest-1)
- Android (latest, latest-1)

### 3.8 Testy API (API Tests)

**Narzędzia:** Vitest, Postman/Insomnia (manualne)

**Zakres każdego endpoint:**

**GET /api/flashcards**
- Status 200 dla zalogowanego użytkownika z danymi
- Paginacja (page, limit)
- Sortowanie (created_at DESC)
- Status 401 dla niezalogowanego
- Test RLS (tylko własne fiszki)

**POST /api/flashcards**
- Status 201 dla poprawnych danych
- Status 400 dla niepoprawnej walidacji
- Status 401 dla niezalogowanego
- Test bulk insert
- Test walidacji source + generation_id

**PUT /api/flashcards/{id}**
- Status 200 dla poprawnej aktualizacji
- Status 400 dla błędnych danych
- Status 404 dla nieistniejącej fiszki
- Status 403 dla cudzej fiszki (RLS)

**DELETE /api/flashcards/{id}**
- Status 204 dla poprawnego usunięcia
- Status 404 dla nieistniejącej fiszki
- Status 403 dla cudzej fiszki (RLS)

**POST /api/generations**
- Status 201 dla poprawnego generowania
- Status 400 dla tekstu < 1000 lub > 10000 znaków
- Status 401 dla niezalogowanego
- Status 500 dla timeout AI
- Test retry logic (mock failures)

**Endpoints Auth** (login, register, logout, reset-password-request, reset-password-update, delete-account)
- Szczegółowe testy każdego scenariusza pozytywnego i negatywnego

### 3.9 Testy Regresyjne (Regression Tests)

**Zakres:**
- Automatyczne uruchomienie po każdym merge do main
- Pełen zestaw testów jednostkowych
- Smoke tests E2E (kluczowe flow)
- Visual regression testing (Percy.io lub Chromatic)

### 3.10 Testy Eksploracyjne (Exploratory Tests)

**Sesje testowe (60-90 min każda):**
- Sesja 1: Flow generowania fiszek
- Sesja 2: Flow zarządzania kontem
- Sesja 3: Edge cases w formularzach
- Sesja 4: UX/UI inconsistencies

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

### 4.1 Moduł Autentykacji

#### TC-AUTH-001: Rejestracja z poprawnymi danymi
**Priorytet:** Krytyczny  
**Prekondycje:** Użytkownik nie ma konta  
**Kroki:**
1. Przejdź do /register
2. Wprowadź email: `test@example.com`
3. Wprowadź hasło: `Test123!@#`
4. Kliknij "Zarejestruj się"

**Oczekiwany rezultat:**
- Status 201
- Użytkownik otrzymuje email weryfikacyjny
- Przekierowanie do strony potwierdzenia
- Użytkownik zapisany w auth.users

#### TC-AUTH-002: Rejestracja ze słabym hasłem
**Priorytet:** Wysoki  
**Kroki:**
1. Przejdź do /register
2. Wprowadź email: `test@example.com`
3. Wprowadź hasło: `test` (za krótkie)
4. Kliknij "Zarejestruj się"

**Oczekiwany rezultat:**
- Status 400
- Komunikat: "Hasło musi zawierać minimum 8 znaków, cyfrę i znak specjalny"
- Użytkownik pozostaje na stronie rejestracji

#### TC-AUTH-003: Logowanie z poprawnymi danymi
**Priorytet:** Krytyczny  
**Prekondycje:** Użytkownik ma zweryfikowane konto  
**Kroki:**
1. Przejdź do /login
2. Wprowadź email: `test@example.com`
3. Wprowadź hasło: `Test123!@#`
4. Kliknij "Zaloguj się"

**Oczekiwany rezultat:**
- Status 200
- Sesja użytkownika utworzona
- Przekierowanie do /generate
- Token zapisany w cookies

#### TC-AUTH-004: Logowanie z nieprawidłowym hasłem
**Priorytet:** Wysoki  
**Kroki:**
1. Przejdź do /login
2. Wprowadź email: `test@example.com`
3. Wprowadź hasło: `wrongpassword`
4. Kliknij "Zaloguj się"

**Oczekiwany rezultat:**
- Status 401
- Komunikat: "Nieprawidłowy email lub hasło"
- Użytkownik pozostaje na stronie logowania

#### TC-AUTH-005: Reset hasła - request
**Priorytet:** Wysoki  
**Kroki:**
1. Przejdź do /reset-password
2. Wprowadź email: `test@example.com`
3. Kliknij "Wyślij link resetujący"

**Oczekiwany rezultat:**
- Status 200
- Email z linkiem resetującym wysłany
- Komunikat: "Sprawdź swoją skrzynkę email"

#### TC-AUTH-006: Usunięcie konta
**Priorytet:** Krytyczny (RODO)  
**Prekondycje:** Użytkownik zalogowany, ma fiszki  
**Kroki:**
1. Przejdź do /settings
2. Kliknij "Usuń konto"
3. Potwierdź w dialog
4. Wprowadź hasło dla potwierdzenia

**Oczekiwany rezultat:**
- Status 200
- Użytkownik usunięty z auth.users
- Wszystkie fiszki użytkownika usunięte (CASCADE)
- Wylogowanie i przekierowanie do /

### 4.2 Moduł Generowania Fiszek

#### TC-GEN-001: Generowanie z poprawnego tekstu (3000 znaków)
**Priorytet:** Krytyczny  
**Prekondycje:** Użytkownik zalogowany, OpenRouter API działa  
**Kroki:**
1. Przejdź do /generate
2. Wklej tekst o długości 3000 znaków
3. Kliknij "Generuj fiszki"
4. Poczekaj na wynik

**Oczekiwany rezultat:**
- Status 201
- Loader wyświetlany podczas generowania
- 3-7 fiszek wygenerowanych
- Generation record w DB (hash, model, duration, count)
- Fiszki wyświetlone do akceptacji
- Każda fiszka ma front i back

#### TC-GEN-002: Generowanie z tekstu za krótkiego (500 znaków)
**Priorytet:** Wysoki  
**Kroki:**
1. Przejdź do /generate
2. Wklej tekst o długości 500 znaków
3. Kliknij "Generuj fiszki"

**Oczekiwany rezultat:**
- Status 400 (walidacja po stronie klienta i serwera)
- Komunikat: "Source text must be at least 1000 characters long"
- Przycisk "Generuj" disabled lub error message

#### TC-GEN-003: Generowanie z tekstu za długiego (15000 znaków)
**Priorytet:** Wysoki  
**Kroki:**
1. Przejdź do /generate
2. Wklej tekst o długości 15000 znaków
3. Kliknij "Generuj fiszki"

**Oczekiwany rezultat:**
- Status 400
- Komunikat: "Source text must not exceed 10000 characters"
- Counter pokazuje 15000/10000 (czerwony)

#### TC-GEN-004: Timeout AI service (>60s)
**Priorytet:** Wysoki  
**Prekondycje:** Mock delay >60s lub very slow API  
**Kroki:**
1. Przejdź do /generate
2. Wklej tekst 5000 znaków
3. Kliknij "Generuj fiszki"
4. Czekaj >60s

**Oczekiwany rezultat:**
- Status 500
- Komunikat: "Request timeout after 60000ms"
- Error log zapisany w generation_error_logs
- Użytkownik może spróbować ponownie

#### TC-GEN-005: Retry mechanism (transient failure)
**Priorytet:** Średni  
**Prekondycje:** Mock AI service z 2 failures + 1 success  
**Kroki:**
1. POST /api/generations z tekstem 3000 znaków
2. Obserwuj logi retry

**Oczekiwany rezultat:**
- Attempt 1: Failed
- Wait 1s
- Attempt 2: Failed
- Wait 2s
- Attempt 3: Success
- Status 201
- Generation zapisane

#### TC-GEN-006: Generowanie bez autentykacji
**Priorytet:** Krytyczny (security)  
**Kroki:**
1. Wyloguj się
2. POST /api/generations z tekstem

**Oczekiwany rezultat:**
- Status 401
- Komunikat: "Musisz być zalogowany aby generować fiszki"

### 4.3 Moduł Zarządzania Fiszkami

#### TC-FLASH-001: Tworzenie pojedynczej fiszki manualnie
**Priorytet:** Wysoki  
**Prekondycje:** Użytkownik zalogowany  
**Kroki:**
1. Przejdź do "Moje fiszki"
2. Kliknij "Dodaj fiszkę"
3. Wprowadź front: "Co to jest TypeScript?"
4. Wprowadź back: "Superset JavaScript z typowaniem statycznym"
5. Kliknij "Zapisz"

**Oczekiwany rezultat:**
- Status 201
- Fiszka zapisana w DB
- source = "manual"
- generation_id = null
- Fiszka wyświetlona na liście

#### TC-FLASH-002: Bulk save po generowaniu
**Priorytet:** Krytyczny  
**Prekondycje:** Użytkownik wygenerował 5 fiszek  
**Kroki:**
1. Zaznacz 3 fiszki do akceptacji
2. Edytuj 1 fiszkę (zmień back)
3. Kliknij "Zapisz zaznaczone"

**Oczekiwany rezultat:**
- Status 201
- 3 fiszki zapisane w DB
- 2 fiszki: source = "ai-full"
- 1 fiszka: source = "ai-edited"
- generation_id ustawione dla wszystkich 3

#### TC-FLASH-003: Edycja istniejącej fiszki
**Priorytet:** Wysoki  
**Prekondycje:** Użytkownik ma fiszkę  
**Kroki:**
1. Przejdź do "Moje fiszki"
2. Kliknij "Edytuj" na fiszce
3. Zmień back: "Nowa odpowiedź"
4. Kliknij "Zapisz"

**Oczekiwany rezultat:**
- Status 200
- Fiszka zaktualizowana w DB
- updated_at zaktualizowane (trigger)
- Zmiany widoczne na liście

#### TC-FLASH-004: Usunięcie fiszki
**Priorytet:** Wysoki  
**Kroki:**
1. Przejdź do "Moje fiszki"
2. Kliknij "Usuń" na fiszce
3. Potwierdź w dialog

**Oczekiwany rezultat:**
- Status 204
- Fiszka usunięta z DB
- Fiszka znika z listy
- Alert: "Fiszka usunięta pomyślnie"

#### TC-FLASH-005: Listowanie z paginacją (100 fiszek)
**Priorytet:** Średni  
**Prekondycje:** Użytkownik ma 100 fiszek  
**Kroki:**
1. Przejdź do "Moje fiszki"
2. Domyślnie page=1, limit=20
3. Kliknij "Następna strona"

**Oczekiwany rezultat:**
- Status 200
- Strona 1: 20 fiszek (1-20)
- Strona 2: 20 fiszek (21-40)
- Pagination controls działają
- Query performance < 200ms

#### TC-FLASH-006: Walidacja długości front (>200 znaków)
**Priorytet:** Średni  
**Kroki:**
1. Utwórz fiszkę
2. Wprowadź front: 250 znaków
3. Kliknij "Zapisz"

**Oczekiwany rezultat:**
- Status 400
- Komunikat: "Front text must not exceed 200 characters"
- Counter: 250/200 (czerwony)

#### TC-FLASH-007: RLS - próba odczytu cudzej fiszki
**Priorytet:** Krytyczny (security)  
**Prekondycje:** User A i User B mają fiszki  
**Kroki:**
1. Zaloguj jako User A
2. GET /api/flashcards (note id fiszki User B)
3. GET /api/flashcards/{id_user_b}

**Oczekiwany rezultat:**
- Status 404 lub 403
- RLS policy blokuje dostęp
- Brak danych w odpowiedzi

### 4.4 Scenariusze Boundary Testing (Walidacja)

#### TC-BOUND-001: Source text - dokładnie 1000 znaków
**Oczekiwany wynik:** Akceptowane

#### TC-BOUND-002: Source text - 999 znaków
**Oczekiwany wynik:** Odrzucone (400)

#### TC-BOUND-003: Source text - dokładnie 10000 znaków
**Oczekiwany wynik:** Akceptowane

#### TC-BOUND-004: Source text - 10001 znaków
**Oczekiwany wynik:** Odrzucone (400)

#### TC-BOUND-005: Front - dokładnie 200 znaków
**Oczekiwany wynik:** Akceptowane

#### TC-BOUND-006: Front - 201 znaków
**Oczekiwany wynik:** Odrzucone (400)

#### TC-BOUND-007: Back - dokładnie 500 znaków
**Oczekiwany wynik:** Akceptowane

#### TC-BOUND-008: Back - 501 znaków
**Oczekiwany wynik:** Odrzucone (400)

## 5. Środowisko Testowe

### 5.1 Środowiska

#### 5.1.1 Development (Local)
- **Adres:** http://localhost:4321
- **Baza danych:** Supabase Local (Docker)
- **AI Service:** Mock implementation
- **Cel:** Development i testy jednostkowe

#### 5.1.2 Staging
- **Adres:** https://staging.10x-cards.com
- **Baza danych:** Supabase Cloud (staging project)
- **AI Service:** OpenRouter API (test key, limit quota)
- **Cel:** Testy integracyjne, E2E, security, performance

#### 5.1.3 Production
- **Adres:** https://10x-cards.com
- **Baza danych:** Supabase Cloud (production)
- **AI Service:** OpenRouter API (production key)
- **Cel:** Smoke tests, monitoring, regression tests

### 5.2 Dane Testowe

#### 5.2.1 Użytkownicy testowi
```
Dev:
- tester1@test.com / Test123!@#
- tester2@test.com / Test123!@#
- admin@test.com / Admin123!@#

Staging:
- qa-user-1@10xcards.test / Qa123!@#
- qa-user-2@10xcards.test / Qa123!@#
```

#### 5.2.2 Teksty źródłowe testowe
- `test-text-1000.txt` - dokładnie 1000 znaków
- `test-text-5000.txt` - 5000 znaków (optimal)
- `test-text-10000.txt` - dokładnie 10000 znaków
- `test-text-special-chars.txt` - znaki specjalne, emoji
- `test-text-polish.txt` - Polski tekst z polskimi znakami

#### 5.2.3 Fiszki testowe
- 10 fiszek manualnych (różne długości)
- 20 fiszek ai-full
- 15 fiszek ai-edited
- Dataset do load testing: 1000+ fiszek na użytkownika

### 5.3 Konfiguracja Środowiska

#### 5.3.1 Zmienne środowiskowe
```bash
# Supabase
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_SERVICE_ROLE_KEY= (tylko backend tests)

# OpenRouter
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-4-turbo
OPENROUTER_TEMPERATURE=0.7
OPENROUTER_TOP_P=0.9

# AI Service Config
AI_SERVICE_TIMEOUT=60000
AI_SERVICE_PROVIDER=openrouter (lub mock dla dev)
```

#### 5.3.2 Database Seeding
```bash
# Reset i seed bazy testowej
npm run db:reset-test
npm run db:seed-test
```

## 6. Narzędzia do Testowania

### 6.1 Testy Automatyczne

#### 6.1.1 Framework testowy
- **Vitest** - testy jednostkowe i integracyjne
  - Fast, ESM-native
  - TypeScript support out of the box
  - Compatible with Jest API

#### 6.1.2 E2E Testing
- **Playwright** - testy E2E
  - Cross-browser support
  - Auto-waiting i retry
  - Screenshots i video recording

#### 6.1.3 Component Testing
- **React Testing Library** - testy komponentów React
  - User-centric testing
  - Accessibility queries
- **Astro Testing** - testy komponentów Astro

#### 6.1.4 API Testing
- **Supertest** (via Vitest) - testy API endpoints
- **MSW (Mock Service Worker)** - mockowanie API calls

#### 6.1.5 Database Testing
- **Supabase Test Client** - izolowane testy DB
- **pg-mem** - in-memory PostgreSQL (opcjonalnie)

### 6.2 Testy Manualne

#### 6.2.1 API Testing
- **Postman** lub **Insomnia**
  - Collections dla każdego endpoint
  - Environment variables (dev, staging, prod)

#### 6.2.2 Browser DevTools
- Chrome DevTools
- Firefox Developer Tools
- React DevTools
- Network inspection

### 6.3 Performance Testing

- **k6** - load testing i stress testing
  - Scenario-based testing
  - Metrics collection
- **Lighthouse** - frontend performance
  - CI integration
  - Performance budgets

### 6.4 Security Testing

- **OWASP ZAP** - automated security scanning
- **Burp Suite** - manual penetration testing (opcjonalnie)
- **npm audit** - dependency vulnerabilities

### 6.5 Accessibility Testing

- **axe DevTools** - browser extension
- **Pa11y** - automated a11y testing
- **NVDA / JAWS** - screen reader testing (manual)

### 6.6 Visual Regression Testing

- **Percy.io** lub **Chromatic** - visual diffs
  - Integration z CI/CD
  - Cross-browser screenshots

### 6.7 CI/CD

- **GitHub Actions**
  - Automated test runs
  - PR checks
  - Deployment pipelines

### 6.8 Monitoring & Logging

- **Sentry** - error tracking (produkcja)
- **Supabase Dashboard** - database monitoring
- **OpenRouter Dashboard** - API usage tracking

### 6.9 Test Management

- **GitHub Issues** - bug tracking
- **GitHub Projects** - test planning
- **Allure** (opcjonalnie) - test reporting

## 7. Harmonogram Testów

### 7.1 Faza 1: Przygotowanie (Sprint 0) - 1 tydzień
- Setup środowisk testowych (dev, staging)
- Konfiguracja narzędzi testowych
- Przygotowanie danych testowych
- Utworzenie test collections (Postman)
- **Deliverables:** Środowiska gotowe, dokumentacja setup

### 7.2 Faza 2: Testy Jednostkowe - 2 tygodnie (równolegle z dev)
- Pisanie testów jednostkowych dla services
- Pokrycie minimum 80%
- Testy utility functions
- Testy walidacji (Zod schemas)
- **Deliverables:** Test suites, coverage report

### 7.3 Faza 3: Testy Integracyjne - 2 tygodnie
- Testy API endpoints
- Testy integracji z Supabase
- Testy RLS policies
- Testy middleware
- **Deliverables:** Integration test suite, RLS audit report

### 7.4 Faza 4: Testy E2E - 1.5 tygodnia
- Implementacja kluczowych flow (Playwright)
- Smoke tests
- Cross-browser testing
- **Deliverables:** E2E test suite, browser compatibility matrix

### 7.5 Faza 5: Testy Bezpieczeństwa - 1 tydzień
- Security audit (OWASP ZAP)
- Penetration testing (manual)
- RLS policies review
- Dependency audit
- **Deliverables:** Security report, vulnerability list

### 7.6 Faza 6: Testy Wydajnościowe - 1 tydzień
- Load testing (k6)
- Stress testing
- Frontend performance (Lighthouse)
- Database query optimization
- **Deliverables:** Performance report, optimization recommendations

### 7.7 Faza 7: Testy Dostępności - 3 dni
- Automated a11y tests (axe, Pa11y)
- Manual screen reader testing
- Keyboard navigation testing
- **Deliverables:** Accessibility report, WCAG compliance matrix

### 7.8 Faza 8: Testy Akceptacyjne (UAT) - 1 tydzień
- Weryfikacja z Product Owner
- Smoke tests na produkcji
- User acceptance testing
- **Deliverables:** UAT sign-off

### 7.9 Faza 9: Testy Regresyjne (Ciągłe)
- Automatyczne uruchomienie po każdym PR
- Weekly full regression suite
- **Deliverables:** Regression test results

**Całkowity czas:** ~9 tygodni (z nakładaniem się faz)

### 7.10 Harmonogram Iteracyjny (Agile)

W przypadku pracy w sprintach 2-tygodniowych:

**Każdy Sprint:**
- Day 1-2: Planning + unit tests dla nowych features
- Day 3-7: Development + integration tests
- Day 8-9: E2E tests + bug fixes
- Day 10: Regression tests + demo

**Co 2 Sprinty:**
- Performance testing
- Security audit

**Co 4 Sprinty:**
- Accessibility audit
- UAT

## 8. Kryteria Akceptacji Testów

### 8.1 Kryteria Wejścia (Entry Criteria)

**Do rozpoczęcia testów wymagane jest:**
- Środowisko testowe skonfigurowane i dostępne
- Build aplikacji deployowany na staging
- Dane testowe przygotowane i załadowane
- Dokumentacja API aktualna
- Test plan zatwierdzony
- Narzędzia testowe skonfigurowane

### 8.2 Kryteria Wyjścia (Exit Criteria)

**Testy mogą zostać zakończone gdy:**

#### 8.2.1 Pokrycie testów
- Pokrycie kodu testami jednostkowymi ≥ 80%
- Pokrycie funkcji krytycznych = 100%
- Wszystkie API endpoints przetestowane (pozytywne + negatywne)
- Wszystkie user stories pokryte testami E2E

#### 8.2.2 Jakość kodu
- Zero błędów krytycznych (Severity: Critical)
- ≤ 5 błędów wysokiej wagi (Severity: High)
- ≤ 20 błędów średniej wagi (Severity: Medium)
- Wszystkie błędy low/trivial zadokumentowane

#### 8.2.3 Performance
- 95% API requests < 2s (poza AI generowaniem)
- AI generation < 60s (with timeout protection)
- Lighthouse Performance Score ≥ 90
- Core Web Vitals w zielonych strefach (LCP < 2.5s, FID < 100ms, CLS < 0.1)

#### 8.2.4 Security
- Zero krytycznych luk bezpieczeństwa
- RLS policies zweryfikowane i działają poprawnie
- OWASP Top 10 vulnerabilities sprawdzone
- Dependency vulnerabilities resolved (Critical + High)

#### 8.2.5 Accessibility
- WCAG 2.1 Level AA compliance ≥ 95%
- Zero błędów a11y na kluczowych stronach
- Screen reader testing passed

#### 8.2.6 Compatibility
- Aplikacja działa poprawnie na wszystkich wspieranych przeglądarkach
- Responsive design verified (desktop, tablet, mobile)

#### 8.2.7 Dokumentacja
- Test execution report completed
- Bug report delivered
- Known issues documented
- Test metrics collected (pass rate, coverage, etc.)

### 8.3 Definicja "Done" dla Testów

**Feature jest "Done" gdy:**
- Unit tests napisane i passing
- Integration tests passing
- E2E test dla głównego flow passing
- Code review completed
- No critical or high bugs
- Documentation updated
- Performance acceptable
- Accessibility checked (jeśli dotyczy UI)

### 8.4 Metryki Sukcesu

#### 8.4.1 Wskaźniki jakości
- **Test Pass Rate:** ≥ 95%
- **Defect Density:** ≤ 2 defects per 1000 LOC
- **Code Coverage:** ≥ 80%
- **Automated Test Coverage:** ≥ 70% all test cases

#### 8.4.2 Wskaźniki wydajności
- **Test Execution Time:** Full suite < 30 min
- **CI/CD Build Time:** < 15 min
- **Mean Time To Detect (MTTD):** < 24h
- **Mean Time To Repair (MTTR):** < 48h for high severity

#### 8.4.3 Wskaźniki biznesowe (post-release)
- **AI Acceptance Rate:** ≥ 75% wygenerowanych fiszek zaakceptowanych
- **User Churn Rate:** ≤ 10% monthly
- **API Error Rate:** ≤ 1%
- **Uptime:** ≥ 99.5%

## 9. Role i Odpowiedzialności w Procesie Testowania

### 9.1 QA Lead / Test Manager
**Odpowiedzialności:**
- Koordynacja całego procesu testowania
- Zarządzanie harmonogramem testów
- Alokacja zasobów i zadań
- Review test planów i strategii
- Raportowanie statusu testów do stakeholders
- Zarządzanie ryzykiem jakościowym
- Nadzór nad metrykami i KPI

### 9.2 QA Engineers / Testers
**Odpowiedzialności:**
- Projektowanie test cases
- Wykonywanie testów manualnych
- Pisanie testów automatycznych (E2E, integration)
- Raportowanie błędów
- Weryfikacja bug fixes
- Testy regresyjne
- Udział w sprint planning i retrospectives

### 9.3 Automation Engineers
**Odpowiedzialności:**
- Implementacja frameworków testowych
- Pisanie testów jednostkowych (wsparcie dla devs)
- Integracja testów z CI/CD
- Maintenance test automation codebase
- Performance testing (k6 scripts)
- Security testing automation

### 9.4 Developers
**Odpowiedzialności:**
- Pisanie testów jednostkowych dla własnego kodu
- Fix bugs zgłoszonych przez QA
- Code review (w tym review test code)
- Wsparcie dla QA w debugowaniu
- Testowanie lokalne przed push
- Udział w bug triage

### 9.5 DevOps Engineer
**Odpowiedzialności:**
- Setup i maintenance środowisk testowych
- Konfiguracja CI/CD pipelines
- Monitoring aplikacji (staging, production)
- Database management (migrations, backups)
- Infrastructure as Code dla test environments

### 9.6 Product Owner / Product Manager
**Odpowiedzialności:**
- Definiowanie kryteriów akceptacji
- Priorytetyzacja bug fixes
- UAT (User Acceptance Testing)
- Sign-off na releases
- Decyzje go/no-go
- Feedback na user stories

### 9.7 Security Specialist (opcjonalnie lub outsourced)
**Odpowiedzialności:**
- Security audits
- Penetration testing
- RLS policies review
- Compliance verification (RODO)
- Security training dla zespołu

### 9.8 Accessibility Specialist (opcjonalnie lub outsourced)
**Odpowiedzialności:**
- Accessibility audits
- WCAG compliance verification
- Screen reader testing
- Recommendations for a11y improvements

### 9.9 End Users / Beta Testers
**Odpowiedzialności:**
- UAT
- Exploratory testing
- Feedback na UX/UI
- Real-world usage scenarios

## 10. Procedury Raportowania Błędów

### 10.1 Platforma Raportowania

**Główne narzędzie:** GitHub Issues

**Labels do kategoryzacji:**
- `bug` - ogólny label dla błędów
- `severity: critical` - aplikacja nie działa, brak workaround
- `severity: high` - funkcja nie działa, istnieje workaround
- `severity: medium` - funkcja działa niepoprawnie, minor impact
- `severity: low` - kosmetyczne, typo, sugestie
- `type: security` - luki bezpieczeństwa
- `type: performance` - problemy wydajnościowe
- `type: a11y` - problemy z dostępnością
- `area: frontend` - błędy UI/UX
- `area: backend` - błędy API/services
- `area: database` - błędy DB
- `area: ai-integration` - błędy OpenRouter/generowanie
- `needs-reproduction` - wymaga dodatkowych kroków do reprodukcji
- `wontfix` - nie będzie poprawiane (z uzasadnieniem)

### 10.2 Szablon Raportu Błędu

```markdown
## Tytuł
[Krótki, opisowy tytuł błędu]

## Środowisko
- **Wersja aplikacji:** [np. v1.2.3 lub commit hash]
- **Środowisko:** [Dev / Staging / Production]
- **Przeglądarka:** [np. Chrome 120.0.6099.109]
- **OS:** [np. Windows 11, macOS 14.1]
- **Urządzenie:** [Desktop / Mobile / Tablet]

## Krytyczność (Severity)
- [ ] Critical - Blocker, aplikacja nie działa
- [ ] High - Funkcja nie działa, istnieje workaround
- [ ] Medium - Funkcja działa niepoprawnie, minor impact
- [ ] Low - Kosmetyczne, minor UX issue

## Priorytet (Priority)
- [ ] P0 - Natychmiastowa naprawa (hotfix)
- [ ] P1 - Do naprawy w bieżącym sprincie
- [ ] P2 - Do naprawy w kolejnym sprincie
- [ ] P3 - Backlog

## Opis problemu
[Jasny opis tego, co nie działa]

## Kroki do reprodukcji
1. 
2. 
3. 

## Oczekiwane zachowanie
[Co powinno się stać]

## Rzeczywiste zachowanie
[Co się dzieje]

## Screenshoty / Logi
[Załącz screenshoty, console logs, network traces]

## Możliwy workaround
[Jeśli istnieje sposób na obejście problemu]

## Dodatkowe informacje
[Dodatkowy kontekst, frequency, impacted users]

## Test case reference
[Link do test case który wykrył błąd]
```

### 10.3 Workflow Zarządzania Błędami

#### 10.3.1 Statusy Issues

1. **Open / New** - Nowo zgłoszony błąd
2. **Triaged** - Przeanalizowany i zapriorytezowany
3. **In Progress** - Developer pracuje nad fixem
4. **Ready for Testing** - Fix zaimplementowany, czeka na weryfikację QA
5. **Testing** - QA weryfikuje fix
6. **Closed / Fixed** - Błąd naprawiony i zweryfikowany
7. **Closed / Won't Fix** - Świadoma decyzja o nie-naprawianiu
8. **Closed / Duplicate** - Duplikat innego issue
9. **Closed / Cannot Reproduce** - Nie udało się odtworzyć

#### 10.3.2 Bug Triage Process

**Frequency:** Daily (dla Critical/High), Weekly (dla Medium/Low)

**Uczestnicy:** QA Lead, Tech Lead, Product Owner

**Proces:**
1. Review nowych bugs
2. Weryfikacja severity i priority
3. Przypisanie do właściwego developera
4. Określenie target sprint/release
5. Identyfikacja blocker dependencies

#### 10.3.3 Eskalacja

**Critical bugs (P0):**
- Natychmiastowe powiadomienie Tech Lead + Product Owner
- Rozpoczęcie pracy w ciągu 1h
- Hotfix process jeśli dotyczy produkcji
- Status updates co 2-4h

**High priority bugs (P1):**
- Powiadomienie Tech Lead
- Rozpoczęcie pracy w ciągu 24h
- Inclusion w bieżącym sprincie

### 10.4 Weryfikacja Poprawek (Fix Verification)

**Proces:**
1. Developer implementuje fix
2. Developer przeprowadza self-testing
3. Developer przesuwa issue do "Ready for Testing"
4. QA wykonuje:
   - Test original bug scenario
   - Regression testing (related areas)
   - Exploratory testing around fix
5. QA zatwierdza lub reopenuje issue z komentarzem

**Kryteria zatwierdzenia:**
- Original bug nie występuje
- No new bugs introduced (regression)
- Fix zgodny z acceptance criteria
- Tests passing (automated + manual)

### 10.5 Metryki i Reporting

**Weekly Test Report zawiera:**
- Test execution summary (passed/failed/blocked)
- New bugs discovered (breakdown by severity)
- Bugs fixed and verified
- Open bugs aging (>7 days, >14 days, >30 days)
- Test coverage progress
- Blocker issues and risks
- Next week plan

**Monthly Quality Report zawiera:**
- Overall quality metrics (defect density, pass rate)
- Trend analysis (bugs over time)
- Top bug categories
- Performance and security highlights
- Lessons learned and improvements

### 10.6 Komunikacja

**Daily:**
- Slack channel #qa-bugs dla quick updates
- Critical bugs → direct message + @channel mention

**Weekly:**
- Test status email do stakeholders
- Bug review meeting (30 min)

**Monthly:**
- Quality report presentation
- Retrospective on testing process

---

## Podsumowanie

Plan testów dla projektu 10x-cards został zaprojektowany z uwzględnieniem specyfiki aplikacji opartej na AI, wymagań bezpieczeństwa (RLS, RODO) oraz nowoczesnego stosu technologicznego (Astro, React, Supabase, OpenRouter). 

**Kluczowe obszary uwagi:**
1. **Bezpieczeństwo** - RLS policies, autoryzacja, ochrona danych użytkowników
2. **Integracja AI** - timeout handling, retry logic, walidacja odpowiedzi
3. **Performance** - długie czasy generowania AI, optymalizacja DB
4. **Accessibility** - WCAG 2.1 AA compliance
5. **Jakość kodu** - 80%+ coverage, automated testing

Plan zapewnia systematyczne podejście do testowania na wszystkich poziomach (jednostkowe, integracyjne, E2E, bezpieczeństwa, wydajności) z jasno określonymi kryteriami akceptacji i harmonogramem realizacji.

**Wymagane zasoby:**
- 2-3 QA Engineers
- 1 Automation Engineer
- DevOps support
- Developer support (bug fixes)
