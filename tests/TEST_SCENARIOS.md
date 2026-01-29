# Scenariusze testów jednostkowych

> Dokument definiuje scenariusze testów jednostkowych dla całej aplikacji zgodnie z wytycznymi Vitest i praktykami testowania.

## Spis treści

1. [Serwisy](#serwisy)
   - [AuthService](#authservice)
   - [FlashcardService](#flashcardservice)
   - [GenerationService](#generationservice)
   - [OpenRouterService](#openrouterservice)
2. [Hooki React](#hooki-react)
   - [useFlashcards](#useflashcards)
   - [useCreateFlashcard](#usecreateflashcard)
   - [useSaveFlashcards](#usesaveflashcards)
   - [useGenerateFlashcards](#usegenerateflashcards)
3. [Funkcje pomocnicze](#funkcje-pomocnicze)
   - [Walidacje](#walidacje)
   - [Utilities](#utilities)
4. [Komponenty React](#komponenty-react)
   - [Formularze](#formularze)
   - [Widoki](#widoki)
   - [Karty i listy](#karty-i-listy)

---

## 1. Serwisy

### AuthService

**Plik testowy**: `tests/unit/services/auth.service.test.ts`

#### Funkcja: `loginUser`

**Scenariusze pozytywne:**
- ✅ Powinien zwrócić sukces z danymi użytkownika przy poprawnych danych logowania
- ✅ Powinien wywołać `supabase.auth.signInWithPassword` z poprawnymi parametrami

**Scenariusze negatywne:**
- ❌ Powinien zwrócić błąd INVALID_CREDENTIALS przy nieprawidłowych danych
- ❌ Powinien zwrócić błąd EMAIL_NOT_VERIFIED gdy email nie jest potwierdzony
- ❌ Powinien zwrócić błąd SERVER_ERROR gdy Supabase nie zwraca użytkownika
- ❌ Powinien zwrócić błąd NETWORK_ERROR przy błędzie połączenia
- ❌ Powinien mapować różne błędy Supabase na odpowiednie kody błędów

**Mockowanie:**
- Mock Supabase client (`vi.mock`)
- Mock `supabase.auth.signInWithPassword` z różnymi odpowiedziami
- Test obsługi wyjątków

#### Funkcja: `registerUser`

**Scenariusze pozytywne:**
- ✅ Powinien zwrócić sukces z userId przy poprawnej rejestracji
- ✅ Powinien wywołać `supabase.auth.signUp` z emailRedirectUrl

**Scenariusze negatywne:**
- ❌ Powinien zwrócić błąd EMAIL_ALREADY_EXISTS gdy email jest już zajęty
- ❌ Powinien zwrócić błąd WEAK_PASSWORD przy słabym haśle
- ❌ Powinien zwrócić błąd INVALID_EMAIL przy nieprawidłowym formacie email
- ❌ Powinien zwrócić błąd SERVER_ERROR gdy nie utworzono użytkownika
- ❌ Powinien zwrócić błąd NETWORK_ERROR przy problemach z połączeniem

#### Funkcja: `logoutUser`

**Scenariusze pozytywne:**
- ✅ Powinien zwrócić sukces po pomyślnym wylogowaniu
- ✅ Powinien wywołać `supabase.auth.signOut`

**Scenariusze negatywne:**
- ❌ Powinien obsłużyć błędy Supabase
- ❌ Powinien obsłużyć błędy sieciowe

#### Funkcja: `requestPasswordReset`

**Scenariusze pozytywne:**
- ✅ Powinien zwrócić sukces po wysłaniu email resetującego
- ✅ Powinien przekazać redirectUrl do Supabase

**Scenariusze negatywne:**
- ❌ Powinien obsłużyć błąd przy nieprawidłowym email
- ❌ Powinien obsłużyć błędy sieciowe

#### Funkcja: `updatePassword`

**Scenariusze pozytywne:**
- ✅ Powinien zwrócić sukces po zmianie hasła
- ✅ Powinien wywołać `supabase.auth.updateUser`

**Scenariusze negatywne:**
- ❌ Powinien zwrócić błąd INVALID_RESET_TOKEN przy wygasłym tokenie
- ❌ Powinien zwrócić błąd WEAK_PASSWORD przy słabym haśle

#### Funkcja: `deleteUserAccount`

**Scenariusze pozytywne:**
- ✅ Powinien zwrócić sukces po usunięciu konta
- ✅ Powinien wywołać `supabase.auth.admin.deleteUser`

**Scenariusze negatywne:**
- ❌ Powinien zwrócić błąd ACCOUNT_DELETION_FAILED przy niepowodzeniu
- ❌ Powinien obsłużyć błędy sieciowe

#### Funkcja: `isValidEmail`

**Scenariusze pozytywne:**
- ✅ Powinien zwrócić true dla prawidłowych adresów email
  - `user@example.com`
  - `test.user+tag@domain.co.uk`
  - `numbers123@test.com`

**Scenariusze negatywne:**
- ❌ Powinien zwrócić false dla nieprawidłowych adresów
  - `invalid`
  - `@example.com`
  - `user@`
  - `user @example.com` (spacja)
  - `user@@example.com`

#### Funkcja: `isStrongPassword`

**Scenariusze pozytywne:**
- ✅ Powinien zwrócić {valid: true, errors: []} dla silnego hasła
  - `Pass123!`
  - `MySecure#Pass1`

**Scenariusze negatywne:**
- ❌ Powinien zwrócić błąd dla hasła krótszego niż 8 znaków
- ❌ Powinien zwrócić błąd dla hasła bez cyfr
- ❌ Powinien zwrócić błąd dla hasła bez znaków specjalnych
- ❌ Powinien zwrócić wszystkie błędy dla bardzo słabego hasła
- ❌ Powinien zwrócić {valid: false, errors: [...]} z odpowiednimi komunikatami

#### Funkcja: `mapSupabaseError`

**Scenariusze:**
- ✅ Powinien mapować "invalid login credentials" na INVALID_CREDENTIALS
- ✅ Powinien mapować "user already registered" na EMAIL_ALREADY_EXISTS
- ✅ Powinien mapować błędy hasła na WEAK_PASSWORD
- ✅ Powinien mapować "invalid email" na INVALID_EMAIL
- ✅ Powinien mapować "email not confirmed" na EMAIL_NOT_VERIFIED
- ✅ Powinien mapować "invalid token" na INVALID_RESET_TOKEN
- ✅ Powinien zwrócić SERVER_ERROR dla nieznanych błędów

---

### FlashcardService

**Plik testowy**: `tests/unit/services/flashcard.service.test.ts`

#### Konstruktor

**Scenariusze:**
- ✅ Powinien poprawnie zainicjalizować serwis z klientem Supabase

#### Funkcja: `createFlashcards`

**Scenariusze pozytywne:**
- ✅ Powinien utworzyć pojedynczą fiszkę z poprawnymi danymi
- ✅ Powinien utworzyć wiele fiszek jednocześnie
- ✅ Powinien przypisać userId do wszystkich fiszek
- ✅ Powinien trim whitespace z front i back
- ✅ Powinien utworzyć fiszkę z source "ai-full" i generation_id
- ✅ Powinien utworzyć fiszkę z source "ai-edited" i generation_id
- ✅ Powinien utworzyć fiszkę z source "manual" bez generation_id
- ✅ Powinien zwrócić tablicę utworzonych fiszek z ID i timestamps

**Scenariusze negatywne:**
- ❌ Powinien rzucić błąd gdy tablica fiszek jest pusta
- ❌ Powinien rzucić błąd gdy front jest pusty lub zawiera tylko spacje
- ❌ Powinien rzucić błąd gdy back jest pusty lub zawiera tylko spacje
- ❌ Powinien rzucić błąd gdy front przekracza 200 znaków
- ❌ Powinien rzucić błąd gdy back przekracza 500 znaków
- ❌ Powinien rzucić błąd dla nieprawidłowej wartości source
- ❌ Powinien rzucić błąd gdy source jest "ai-full" bez generation_id
- ❌ Powinien rzucić błąd gdy source jest "ai-edited" bez generation_id
- ❌ Powinien rzucić błąd gdy source jest "manual" z generation_id
- ❌ Powinien rzucić błąd przy błędzie bazy danych
- ❌ Powinien rzucić błąd gdy baza nie zwraca danych

**Edge cases:**
- 🔶 Front o długości dokładnie 200 znaków (granica)
- 🔶 Back o długości dokładnie 500 znaków (granica)
- 🔶 Tekst z emoji i znaki specjalne
- 🔶 generation_id jako null dla manual

**Mockowanie:**
- Mock `supabase.from().insert().select()`
- Różne scenariusze odpowiedzi (sukces, błąd, brak danych)

#### Funkcja: `getFlashcards`

**Scenariusze pozytywne:**
- ✅ Powinien pobrać fiszki z domyślnymi parametrami (page=1, limit=20)
- ✅ Powinien zastosować paginację (page, limit)
- ✅ Powinien posortować według created_at desc (domyślnie)
- ✅ Powinien posortować według updated_at asc
- ✅ Powinien posortować według front
- ✅ Powinien filtrować po source (ai-full, ai-edited, manual)
- ✅ Powinien zwrócić poprawne dane paginacji (page, limit, total)
- ✅ Powinien zwrócić pustą tablicę gdy brak fiszek
- ✅ Powinien poprawnie obliczyć range (from, to) dla różnych stron

**Scenariusze negatywne:**
- ❌ Powinien rzucić błąd gdy page < 1
- ❌ Powinien rzucić błąd gdy limit < 1
- ❌ Powinien rzucić błąd gdy limit > 100
- ❌ Powinien rzucić błąd przy błędzie bazy danych

**Edge cases:**
- 🔶 Ostatnia strona z niepełną liczbą elementów
- 🔶 Strona poza zakresem (zwraca pustą tablicę)
- 🔶 limit = 1 (minimalna wartość)
- 🔶 limit = 100 (maksymalna wartość)

#### Funkcja: `getFlashcard`

**Scenariusze pozytywne:**
- ✅ Powinien pobrać fiszkę po ID dla autoryzowanego użytkownika
- ✅ Powinien zwrócić wszystkie pola fiszki

**Scenariusze negatywne:**
- ❌ Powinien rzucić błąd "Flashcard not found" gdy brak fiszki (kod PGRST116)
- ❌ Powinien rzucić błąd gdy fiszka należy do innego użytkownika
- ❌ Powinien rzucić błąd przy błędzie bazy danych
- ❌ Powinien rzucić błąd gdy data jest null

#### Funkcja: `updateFlashcard`

**Scenariusze pozytywne:**
- ✅ Powinien zaktualizować front fiszki
- ✅ Powinien zaktualizować back fiszki
- ✅ Powinien zaktualizować zarówno front jak i back
- ✅ Powinien trim whitespace z aktualizowanych pól
- ✅ Powinien zmienić source z "ai-full" na "ai-edited" przy edycji
- ✅ Powinien zachować source "ai-edited" przy ponownej edycji
- ✅ Powinien zachować source "manual" przy edycji
- ✅ Powinien zwrócić obecną fiszkę gdy brak pól do aktualizacji
- ✅ Powinien zwrócić zaktualizowaną fiszkę z nowymi danymi

**Scenariusze negatywne:**
- ❌ Powinien rzucić błąd gdy front jest pusty lub tylko spacje
- ❌ Powinien rzucić błąd gdy back jest pusty lub tylko spacje
- ❌ Powinien rzucić błąd gdy front przekracza 200 znaków
- ❌ Powinien rzucić błąd gdy back przekracza 500 znaków
- ❌ Powinien rzucić błąd "Flashcard not found" gdy fiszka nie istnieje
- ❌ Powinien rzucić błąd gdy użytkownik nie ma uprawnień

**Edge cases:**
- 🔶 Aktualizacja tylko front (back undefined)
- 🔶 Aktualizacja tylko back (front undefined)
- 🔶 Przekazanie pustego obiektu updates {}

#### Funkcja: `deleteFlashcard`

**Scenariusze pozytywne:**
- ✅ Powinien usunąć fiszkę dla autoryzowanego użytkownika
- ✅ Nie powinien rzucać błędu gdy usunięcie się powiedzie

**Scenariusze negatywne:**
- ❌ Powinien rzucić błąd przy błędzie bazy danych
- ❌ Powinien sprawdzić user_id przy usuwaniu (security)

**Uwaga:** DELETE w Supabase nie rzuca błędu gdy rekord nie istnieje, więc nie testujemy tego przypadku.

---

### GenerationService

**Plik testowy**: `tests/unit/services/generation.service.test.ts`

#### Konstruktor

**Scenariusze:**
- ✅ Powinien zainicjalizować OpenRouterService gdy OPENROUTER_API_KEY jest ustawiony
- ✅ Powinien używać mock mode gdy brak OPENROUTER_API_KEY
- ✅ Powinien wczytać konfigurację z environment variables
- ✅ Powinien ustawić domyślne wartości gdy brak zmiennych env
- ✅ Powinien walidować temperature (0-2)
- ✅ Powinien walidować top_p (0-1)
- ✅ Powinien skonfigurować system prompt i response format

#### Funkcja: `generateSourceTextHash` (private)

**Scenariusze:**
- ✅ Powinien wygenerować MD5 hash dla tekstu
- ✅ Powinien zwracać ten sam hash dla identycznego tekstu
- ✅ Powinien zwracać różne hashe dla różnych tekstów
- ✅ Powinien obsługiwać polskie znaki i emoji

**Mockowanie:**
- Testowanie przez publiczne metody (generateFlashcards)

#### Funkcja: `callAIService` (private)

**Scenariusze pozytywne (OpenRouter mode):**
- ✅ Powinien wywołać OpenRouterService.sendChatMessage
- ✅ Powinien przekazać poprawny prompt z tekstem źródłowym
- ✅ Powinien zwrócić 3-7 fiszek
- ✅ Powinien przyciąć front do 200 znaków
- ✅ Powinien przyciąć back do 500 znaków
- ✅ Powinien ustawić source na "ai-full"
- ✅ Powinien trim whitespace z front i back

**Scenariusze negatywne (OpenRouter mode):**
- ❌ Powinien rzucić błąd gdy odpowiedź nie ma pola flashcards
- ❌ Powinien rzucić błąd gdy flashcards nie jest tablicą
- ❌ Powinien rzucić błąd gdy zwrócono < 3 fiszek
- ❌ Powinien przyciąć do 7 fiszek gdy AI zwróci więcej
- ❌ Powinien rzucić błąd gdy fiszka ma pusty front lub back
- ❌ Powinien propagować błędy OpenRouter API

**Scenariusze pozytywne (Mock mode):**
- ✅ Powinien wygenerować 3-7 mock fiszek
- ✅ Powinien symulować opóźnienie 200-500ms
- ✅ Powinien generować więcej fiszek dla dłuższego tekstu (+1 per 2000 chars)

**Scenariusze negatywne (Mock mode):**
- ❌ Powinien rzucić błąd timeout po przekroczeniu timeoutMs
- ❌ Powinien symulować sporadyczne błędy (5% chance)

**Mockowanie:**
- Mock OpenRouterService
- Mock dla crypto.createHash

#### Funkcja: `callAIServiceWithRetry` (private)

**Scenariusze pozytywne:**
- ✅ Powinien zwrócić wynik przy pierwszej próbie gdy się powiedzie
- ✅ Powinien ponowić próbę po błędzie i zwrócić wynik przy drugiej próbie
- ✅ Powinien czekać przed ponowieniem (exponential backoff)
- ✅ Powinien logować każdą próbę

**Scenariusze negatywne:**
- ❌ Powinien rzucić błąd po wyczerpaniu wszystkich prób (maxRetries)
- ❌ Nie powinien ponawiać przy błędzie timeout
- ❌ Powinien zawierać komunikat ostatniego błędu w rzuconym błędzie

**Edge cases:**
- 🔶 Sukces przy ostatniej próbie (attempt 3/3)
- 🔶 Różne opóźnienia między próbami (1s, 2s, 3s)

#### Funkcja: `generateFlashcards`

**Scenariusze pozytywne:**
- ✅ Powinien wygenerować fiszki i zapisać generation record
- ✅ Powinien zwrócić generation_id, flashcards_proposals, generated_count
- ✅ Powinien zapisać metadane (hash, length, duration, model)
- ✅ Powinien zmierzyć czas generowania
- ✅ Powinien użyć właściwego modelu ("mock-ai-v1" lub z config)
- ✅ Powinien logować metryki wydajności

**Scenariusze negatywne:**
- ❌ Powinien rzucić błąd gdy callAIServiceWithRetry nie powiedzie się
- ❌ Powinien rzucić błąd gdy zapis do bazy danych nie powiedzie się
- ❌ Powinien zapisać błąd do generation_error_logs przy niepowodzeniu
- ❌ Powinien zalogować error_code, error_message, duration
- ❌ Powinien propagować błąd nawet po zalogowaniu
- ❌ Nie powinien rzucać błędu gdy logowanie błędu się nie powiedzie

**Edge cases:**
- 🔶 Bardzo krótki tekst (minimum)
- 🔶 Bardzo długi tekst (maksimum)
- 🔶 Tekst z polskimi znakami
- 🔶 Generowanie trwa bardzo długo (close to timeout)

**Mockowanie:**
- Mock Supabase client
- Mock OpenRouterService
- Mock crypto.createHash
- Mock console.log/warn/error
- Spy na callAIServiceWithRetry

---

### OpenRouterService

**Plik testowy**: `tests/unit/services/openrouter.service.test.ts`

> Ten serwis ma już testy w `src/lib/openrouter.service.test.ts`. Należy je przenieść do `tests/unit/services/` i dostosować do struktury projektu testowego.

**Akcje do wykonania:**
1. Przenieść istniejące testy
2. Dostosować importy
3. Dodać brakujące scenariusze
4. Zaktualizować mockowanie zgodnie z setup files

---

## 2. Hooki React

### useFlashcards

**Plik testowy**: `tests/unit/hooks/useFlashcards.test.tsx`

**Setup testowy:**
- Użyj `renderHook` z `@testing-library/react`
- Mock `fetch` za pomocą `vi.stubGlobal('fetch', mockFetch)`
- Mock `console.log/error` dla czystych logów testowych

#### Stan początkowy

**Scenariusze:**
- ✅ Powinien zainicjalizować z pustą tablicą flashcards
- ✅ Powinien zainicjalizować z pagination = null
- ✅ Powinien zainicjalizować z isLoading = false
- ✅ Powinien zainicjalizować z error = null

#### Funkcja: `fetchFlashcards`

**Scenariusze pozytywne:**
- ✅ Powinien pobrać fiszki z domyślnymi parametrami
- ✅ Powinien ustawić isLoading na true podczas ładowania
- ✅ Powinien ustawić flashcards po pomyślnym pobraniu
- ✅ Powinien ustawić pagination po pomyślnym pobraniu
- ✅ Powinien ustawić isLoading na false po zakończeniu
- ✅ Powinien przekazać page, limit, source do query params
- ✅ Powinien dodać sort=created_at i order=desc do query
- ✅ Powinien wysłać request z credentials: same-origin

**Scenariusze negatywne:**
- ❌ Powinien ustawić error gdy response nie jest ok
- ❌ Powinien użyć message z errorData gdy dostępny
- ❌ Powinien użyć domyślnej wiadomości gdy brak message
- ❌ Powinien ustawić error przy błędzie sieci
- ❌ Powinien ustawić isLoading na false nawet przy błędzie
- ❌ Powinien wyczyścić poprzedni error przed nowym requestem

**Edge cases:**
- 🔶 Wywołanie bez source (nie dodaje do params)
- 🔶 Pobieranie drugiej strony (page=2)
- 🔶 Zmiana limitu (limit=50)

**Mockowanie:**
- Mock `fetch` z różnymi odpowiedziami
- Mock `console.log/error`

#### Funkcja: `deleteFlashcard`

**Scenariusze pozytywne:**
- ✅ Powinien wysłać DELETE request na `/api/flashcards/${id}`
- ✅ Powinien usunąć fiszkę z lokalnego stanu po sukcesie
- ✅ Powinien zaktualizować pagination.total (zmniejszyć o 1)
- ✅ Powinien wysłać request z credentials: same-origin

**Scenariusze negatywne:**
- ❌ Powinien ustawić error gdy response nie jest ok
- ❌ Powinien rzucić błąd (re-throw) aby caller mógł obsłużyć
- ❌ Powinien ustawić error przy błędzie sieci

**Edge cases:**
- 🔶 Usuwanie ostatniej fiszki (total = 1 -> 0)
- 🔶 Usuwanie gdy pagination jest null

#### Funkcja: `updateFlashcard`

**Scenariusze pozytywne:**
- ✅ Powinien wysłać PUT request na `/api/flashcards/${id}`
- ✅ Powinien wysłać JSON body z front i back
- ✅ Powinien zaktualizować fiszkę w lokalnym stanie po sukcesie
- ✅ Powinien zachować inne fiszki bez zmian
- ✅ Powinien wysłać request z credentials: same-origin

**Scenariusze negatywne:**
- ❌ Powinien ustawić error gdy response nie jest ok
- ❌ Powinien rzucić błąd (re-throw) aby caller mógł obsłużyć
- ❌ Powinien ustawić error przy błędzie sieci

**Edge cases:**
- 🔶 Aktualizacja pierwszej fiszki w liście
- 🔶 Aktualizacja ostatniej fiszki w liście
- 🔶 Aktualizacja nieistniejącej fiszki (błąd 404)

#### Funkcja: `refreshFlashcards`

**Scenariusze:**
- ✅ Powinien wywołać fetchFlashcards z obecnymi parametrami
- ✅ Powinien zachować currentPage, currentLimit, currentSource
- ✅ Powinien być stabilny (nie zmienia się między renderami)

**Mockowanie:**
- Mock `fetch`
- Spy na `fetchFlashcards`

---

### useCreateFlashcard

**Plik testowy**: `tests/unit/hooks/useCreateFlashcard.test.tsx`

#### Stan początkowy

**Scenariusze:**
- ✅ Powinien zainicjalizować z isCreating = false
- ✅ Powinien zainicjalizować z error = null

#### Funkcja: `createFlashcard`

**Scenariusze pozytywne:**
- ✅ Powinien wysłać POST request na `/api/flashcards`
- ✅ Powinien ustawić isCreating na true podczas tworzenia
- ✅ Powinien wysłać JSON body z tablicą flashcards
- ✅ Powinien wywołać onSuccess callback z danymi po sukcesie
- ✅ Powinien ustawić isCreating na false po zakończeniu
- ✅ Powinien wyczyścić error przed nowym requestem

**Scenariusze negatywne:**
- ❌ Powinien ustawić error gdy response nie jest ok
- ❌ Powinien wywołać onError callback z błędem
- ❌ Powinien ustawić error przy błędzie sieci
- ❌ Powinien ustawić isCreating na false nawet przy błędzie

**Edge cases:**
- 🔶 Tworzenie pojedynczej fiszki
- 🔶 Tworzenie wielu fiszek jednocześnie
- 🔶 Callback onSuccess jest opcjonalny
- 🔶 Callback onError jest opcjonalny

---

### useSaveFlashcards

**Plik testowy**: `tests/unit/hooks/useSaveFlashcards.test.tsx`

#### Stan początkowy

**Scenariusze:**
- ✅ Powinien zainicjalizować z isSaving = false
- ✅ Powinien zainicjalizować z error = null
- ✅ Powinien zainicjalizować z savedCount = 0

#### Funkcja: `saveFlashcards`

**Scenariusze pozytywne:**
- ✅ Powinien zapisać wiele fiszek jednocześnie
- ✅ Powinien ustawić isSaving na true podczas zapisu
- ✅ Powinien aktualizować savedCount podczas zapisu
- ✅ Powinien wywołać onSuccess po zapisaniu wszystkich
- ✅ Powinien ustawić isSaving na false po zakończeniu
- ✅ Powinien zwrócić liczbę zapisanych fiszek

**Scenariusze negatywne:**
- ❌ Powinien ustawić error gdy któryś zapis się nie powiedzie
- ❌ Powinien wywołać onError z błędem
- ❌ Powinien przerwać zapisywanie przy pierwszym błędzie
- ❌ Powinien ustawić isSaving na false nawet przy błędzie

**Edge cases:**
- 🔶 Zapisywanie pustej tablicy
- 🔶 Zapisywanie pojedynczej fiszki
- 🔶 Częściowy sukces (niektóre się zapiszą przed błędem)

---

### useGenerateFlashcards

**Plik testowy**: `tests/unit/hooks/useGenerateFlashcards.test.tsx`

#### Stan początkowy

**Scenariusze:**
- ✅ Powinien zainicjalizować z isGenerating = false
- ✅ Powinien zainicjalizować z error = null
- ✅ Powinien zainicjalizować z proposals = null
- ✅ Powinien zainicjalizować z generationId = null

#### Funkcja: `generateFlashcards`

**Scenariusze pozytywne:**
- ✅ Powinien wysłać POST request na `/api/generations`
- ✅ Powinien ustawić isGenerating na true podczas generowania
- ✅ Powinien wysłać sourceText w body
- ✅ Powinien ustawić proposals po sukcesie
- ✅ Powinien ustawić generationId po sukcesie
- ✅ Powinien wywołać onSuccess callback z danymi
- ✅ Powinien ustawić isGenerating na false po zakończeniu

**Scenariusze negatywne:**
- ❌ Powinien ustawić error gdy response nie jest ok
- ❌ Powinien wywołać onError callback z błędem
- ❌ Powinien ustawić error przy błędzie sieci
- ❌ Powinien obsłużyć timeout (długie generowanie)
- ❌ Powinien ustawić isGenerating na false nawet przy błędzie

**Edge cases:**
- 🔶 Generowanie z bardzo krótkim tekstem
- 🔶 Generowanie z bardzo długim tekstem
- 🔶 Wielokrotne wywołanie (poprzednie dane powinny być wyczyszczone)

#### Funkcja: `clearProposals`

**Scenariusze:**
- ✅ Powinien wyczyścić proposals
- ✅ Powinien wyczyścić generationId
- ✅ Powinien wyczyścić error

---

## 3. Funkcje pomocnicze

### Walidacje

**Plik testowy**: `tests/unit/utils/validation.test.ts`

Wszystkie funkcje walidacyjne zostały już pokryte w sekcji AuthService (isValidEmail, isStrongPassword).

### Utilities

**Plik testowy**: `tests/unit/utils/utils.test.ts`

#### Funkcja: `cn`

**Scenariusze:**
- ✅ Powinien łączyć klasy CSS
- ✅ Powinien obsługiwać Tailwind merge (deduplication)
- ✅ Powinien obsługiwać conditional classes z clsx
- ✅ Powinien usuwać duplikaty konfliktujących klas Tailwind
- ✅ Powinien obsługiwać undefined i null wartości
- ✅ Powinien obsługiwać tablice klas
- ✅ Powinien obsługiwać obiekty z boolean values

**Przykłady:**
```typescript
cn('px-2', 'py-1') // => 'px-2 py-1'
cn('px-2', 'px-4') // => 'px-4' (Tailwind merge)
cn('text-red-500', { 'text-blue-500': true }) // => 'text-blue-500'
cn('p-4', undefined, 'mt-2', null) // => 'p-4 mt-2'
```

---

## 4. Komponenty React

### Formularze

#### LoginForm

**Plik testowy**: `tests/unit/components/LoginForm.test.tsx`

**Setup:**
- Użyj `renderWithProviders` z test-utils
- Mock `window.location.href`
- Mock `fetch` dla API calls

**Rendering:**
- ✅ Powinien renderować formularz logowania
- ✅ Powinien renderować pole email
- ✅ Powinien renderować pole password
- ✅ Powinien renderować przycisk submit
- ✅ Powinien renderować link do rejestracji
- ✅ Powinien renderować link do reset password
- ✅ Powinien wyświetlić message prop gdy jest przekazany

**Walidacja:**
- ✅ Powinien wyświetlić błąd gdy email jest pusty
- ✅ Powinien wyświetlić błąd przy nieprawidłowym formacie email
- ✅ Powinien wyświetlić błąd gdy password jest pusty
- ✅ Powinien wyświetlić błąd gdy password jest krótsze niż 6 znaków
- ✅ Powinien wyczyścić poprzednie błędy przed walidacją

**Interakcje użytkownika:**
- ✅ Powinien aktualizować email przy wpisywaniu
- ✅ Powinien aktualizować password przy wpisywaniu
- ✅ Powinien wywołać fetch przy submit z poprawnymi danymi
- ✅ Powinien pokazać spinner podczas ładowania
- ✅ Powinien disabled inputs podczas ładowania
- ✅ Powinien disabled button podczas ładowania

**API Integration:**
- ✅ Powinien przekierować po pomyślnym logowaniu
- ✅ Powinien użyć redirectTo prop lub domyślny /generate
- ✅ Powinien wyświetlić błąd z API przy niepowodzeniu
- ✅ Powinien wyświetlić błąd sieci przy problemach z fetch
- ✅ Powinien przestać pokazywać loading po zakończeniu

**Accessibility:**
- ✅ Powinien mieć poprawne htmlFor na labels
- ✅ Powinien mieć autocomplete attributes
- ✅ Powinien mieć required attributes
- ✅ Powinien mieć type="email" na email input
- ✅ Powinien mieć type="password" na password input

#### RegisterForm

**Plik testowy**: `tests/unit/components/RegisterForm.test.tsx`

**Scenariusze podobne do LoginForm plus:**
- ✅ Powinien renderować pole confirm password
- ✅ Powinien walidować zgodność haseł
- ✅ Powinien walidować siłę hasła (min 8 znaków, cyfra, znak specjalny)
- ✅ Powinien wyświetlić wszystkie błędy walidacji hasła
- ✅ Powinien wyświetlić komunikat o wymaganiu potwierdzenia email
- ✅ Powinien przekierować na login po pomyślnej rejestracji

#### ResetPasswordForm

**Plik testowy**: `tests/unit/components/ResetPasswordForm.test.tsx`

**Scenariusze:**
- ✅ Powinien renderować pole email
- ✅ Powinien walidować format email
- ✅ Powinien wysłać request na `/api/auth/reset-password-request`
- ✅ Powinien wyświetlić komunikat sukcesu po wysłaniu
- ✅ Powinien wyświetlić błąd przy niepowodzeniu
- ✅ Powinien renderować link powrotny do login

---

### Widoki

#### FlashcardGenerationView

**Plik testowy**: `tests/unit/components/FlashcardGenerationView.test.tsx`

**Rendering:**
- ✅ Powinien renderować TextInputArea
- ✅ Powinien renderować przycisk "Generate"
- ✅ Powinien renderować listę proposals po wygenerowaniu
- ✅ Powinien renderować BulkSaveButton gdy są proposals
- ✅ Powinien pokazać SkeletonLoader podczas generowania

**Interakcje:**
- ✅ Powinien wywołać useGenerateFlashcards przy kliknięciu Generate
- ✅ Powinien umożliwić edycję proposals
- ✅ Powinien umożliwić usunięcie proposal
- ✅ Powinien wywołać useSaveFlashcards przy zapisie
- ✅ Powinien wyczyścić proposals po zapisie

**Walidacja:**
- ✅ Powinien disabled przycisk Generate gdy tekst jest za krótki
- ✅ Powinien wyświetlić licznik znaków
- ✅ Powinien wyświetlić błąd gdy tekst przekracza maksimum

**Edge cases:**
- 🔶 Anulowanie generowania
- 🔶 Błąd generowania
- 🔶 Częściowe zapisywanie proposals (niektóre się zapisały)

#### MyFlashcardsView

**Plik testowy**: `tests/unit/components/MyFlashcardsView.test.tsx`

**Rendering:**
- ✅ Powinien renderować listę fiszek
- ✅ Powinien renderować paginację gdy jest więcej niż 1 strona
- ✅ Powinien renderować filtr source
- ✅ Powinien pokazać SkeletonLoader podczas ładowania
- ✅ Powinien pokazać pusty stan gdy brak fiszek
- ✅ Powinien renderować licznik fiszek

**Interakcje:**
- ✅ Powinien załadować fiszki przy montowaniu
- ✅ Powinien zmienić stronę przy kliknięciu paginacji
- ✅ Powinien filtrować po source
- ✅ Powinien odświeżyć listę po usunięciu fiszki
- ✅ Powinien odświeżyć listę po edycji fiszki

**CRUD operations:**
- ✅ Powinien otworzyć EditFlashcardDialog przy kliknięciu edit
- ✅ Powinien otworzyć DeleteConfirmDialog przy kliknięciu delete
- ✅ Powinien otworzyć CreateFlashcardDialog przy kliknięciu create
- ✅ Powinien zaktualizować listę po pomyślnej operacji

---

### Karty i listy

#### FlashcardCard

**Plik testowy**: `tests/unit/components/FlashcardCard.test.tsx`

**Rendering:**
- ✅ Powinien renderować front i back
- ✅ Powinien renderować timestamp (created_at)
- ✅ Powinien renderować badge source
- ✅ Powinien renderować przyciski edit i delete
- ✅ Powinien wyświetlić różne kolory badge dla różnych source

**Interakcje:**
- ✅ Powinien wywołać onEdit przy kliknięciu edit
- ✅ Powinien wywołać onDelete przy kliknięciu delete
- ✅ Powinien pokazać front domyślnie
- ✅ Powinien pokazać back po kliknięciu (flip)
- ✅ Powinien wrócić do front po ponownym kliknięciu

**Accessibility:**
- ✅ Powinien mieć button role na elementach interaktywnych
- ✅ Powinien mieć aria-labels na przyciskach
- ✅ Powinien być dostępny z klawiatury

#### FlashcardList

**Plik testowy**: `tests/unit/components/FlashcardList.test.tsx`

**Rendering:**
- ✅ Powinien renderować wszystkie fiszki
- ✅ Powinien renderować FlashcardListItem dla każdej fiszki
- ✅ Powinien pokazać pusty stan gdy brak fiszek
- ✅ Powinien pokazać skeleton podczas ładowania

**List operations:**
- ✅ Powinien przekazać callbacks do każdego FlashcardListItem
- ✅ Powinien zachować key dla każdego elementu (id)
- ✅ Powinien obsługiwać długie listy (virtualization optional)

#### ErrorNotification

**Plik testowy**: `tests/unit/components/ErrorNotification.test.tsx`

**Rendering:**
- ✅ Powinien renderować komunikat błędu
- ✅ Powinien renderować komunikat info
- ✅ Powinien renderować komunikat sukcesu
- ✅ Powinien renderować odpowiednią ikonę dla typu
- ✅ Powinien mieć odpowiedni kolor dla typu

**Interakcje:**
- ✅ Powinien wywołać onDismiss przy kliknięciu zamknięcia (jeśli jest)
- ✅ Powinien auto-dismiss po określonym czasie (jeśli jest)
- ✅ Nie powinien pokazać przycisku zamknięcia jeśli onDismiss nie ma

#### SkeletonLoader

**Plik testowy**: `tests/unit/components/SkeletonLoader.test.tsx`

**Rendering:**
- ✅ Powinien renderować określoną liczbę szkieletów
- ✅ Powinien mieć animację pulse
- ✅ Powinien mieć odpowiednią wysokość
- ✅ Powinien być responsywny

---

## Priorytety implementacji

### Priorytet 1 - Krytyczne (Core Business Logic)
1. ✅ AuthService - wszystkie funkcje
2. ✅ FlashcardService - CRUD operations
3. ✅ GenerationService - generateFlashcards
4. ✅ useFlashcards - główny hook do zarządzania fiszkami

### Priorytet 2 - Ważne (User-facing Features)
5. ✅ LoginForm - główny punkt wejścia
6. ✅ RegisterForm - onboarding
7. ✅ FlashcardGenerationView - główna funkcjonalność
8. ✅ useGenerateFlashcards - generowanie fiszek
9. ✅ useSaveFlashcards - zapisywanie proposals

### Priorytet 3 - Pomocnicze (Supporting Features)
10. ✅ Funkcje walidacji (isValidEmail, isStrongPassword)
11. ✅ Funkcja cn (utils)
12. ✅ FlashcardCard - wyświetlanie fiszek
13. ✅ MyFlashcardsView - zarządzanie fiszkami
14. ✅ useCreateFlashcard - tworzenie manualnych fiszek

### Priorytet 4 - Nice-to-have (UI Components)
15. ✅ ErrorNotification
16. ✅ SkeletonLoader
17. ✅ FlashcardList
18. ✅ ResetPasswordForm

---

## Wzorce i dobre praktyki

### Ogólne zasady testowania

1. **AAA Pattern** - Arrange, Act, Assert
```typescript
it('should do something', () => {
  // Arrange - przygotuj dane i mocki
  const input = 'test';
  
  // Act - wykonaj akcję
  const result = myFunction(input);
  
  // Assert - sprawdź wynik
  expect(result).toBe('expected');
});
```

2. **Opisowe nazwy testów**
```typescript
// ✅ Dobrze
it('should return error when email is empty')

// ❌ Źle
it('test email')
```

3. **Grupowanie testów**
```typescript
describe('AuthService', () => {
  describe('loginUser', () => {
    describe('when credentials are valid', () => {
      it('should return success with user data')
    });
    
    describe('when credentials are invalid', () => {
      it('should return INVALID_CREDENTIALS error')
    });
  });
});
```

4. **Jeden koncept per test**
```typescript
// ✅ Dobrze - testuje jedną rzecz
it('should trim whitespace from flashcard front')

// ❌ Źle - testuje za dużo
it('should create flashcard, trim whitespace, validate length, and save to database')
```

### Mockowanie w Vitest

1. **Mock modułów**
```typescript
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}));
```

2. **Mock funkcji**
```typescript
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);
```

3. **Spy na funkcje**
```typescript
const spy = vi.spyOn(service, 'privateMethod');
expect(spy).toHaveBeenCalledWith('arg');
```

4. **Mock implementacji**
```typescript
const mockFn = vi.fn()
  .mockResolvedValueOnce({ success: true })
  .mockResolvedValueOnce({ success: false });
```

### Testowanie komponentów React

1. **Renderowanie z providers**
```typescript
import { renderWithProviders } from '../setup/test-utils';

it('should render component', () => {
  renderWithProviders(<MyComponent />);
  expect(screen.getByRole('button')).toBeInTheDocument();
});
```

2. **Interakcje użytkownika**
```typescript
import { userEvent } from '../setup/test-utils';

it('should handle click', async () => {
  const user = userEvent.setup();
  renderWithProviders(<MyComponent />);
  
  await user.click(screen.getByRole('button'));
  
  expect(mockFn).toHaveBeenCalled();
});
```

3. **Asynchroniczne operacje**
```typescript
it('should show loading state', async () => {
  renderWithProviders(<MyComponent />);
  
  const button = screen.getByRole('button');
  await user.click(button);
  
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.getByText(/success/i)).toBeInTheDocument();
  });
});
```

### Testowanie hooków

1. **Użyj renderHook**
```typescript
import { renderHook, waitFor } from '@testing-library/react';

it('should fetch data', async () => {
  const { result } = renderHook(() => useFlashcards());
  
  await act(async () => {
    await result.current.fetchFlashcards();
  });
  
  expect(result.current.flashcards).toHaveLength(5);
});
```

### Coverage i jakość testów

1. **Fokus na critical paths** - 100% coverage dla logiki biznesowej
2. **Edge cases** - testuj granice (0, 1, max, null, undefined)
3. **Error handling** - testuj wszystkie ścieżki błędów
4. **User interactions** - testuj rzeczywiste zachowania użytkownika
5. **Accessibility** - testuj dostępność (role, labels, keyboard)

---

## Checklist implementacji

Przed rozpoczęciem implementacji:
- [ ] Przeczytaj wytyczne Vitest (.cursor/rules/vitest-unit-testing.mdc)
- [ ] Zapoznaj się ze strukturą testów (tests/unit/example.test.tsx)
- [ ] Sprawdź setup files (tests/setup/)
- [ ] Zrozum mockowanie Supabase i fetch

Podczas implementacji:
- [ ] Twórz testy w odpowiedniej strukturze katalogów
- [ ] Używaj `describe` do grupowania testów
- [ ] Stosuj AAA pattern (Arrange-Act-Assert)
- [ ] Mockuj zewnętrzne zależności
- [ ] Testuj happy path i error cases
- [ ] Dodawaj edge cases
- [ ] Sprawdzaj coverage po każdej sekcji

Po implementacji:
- [ ] Uruchom testy: `npm run test:unit`
- [ ] Sprawdź coverage: `npm run test:unit:coverage`
- [ ] Upewnij się że wszystkie testy przechodzą
- [ ] Refaktoryzuj duplikujące się mocki do setup files
- [ ] Dodaj brakujące testy na podstawie coverage report

---

## Następne kroki

1. Rozpocznij od testów Priorytetu 1 (AuthService, FlashcardService)
2. Implementuj po jednym pliku testowym na raz
3. Uruchamiaj testy w watch mode: `npm run test:unit:watch`
4. Monitoruj coverage i dodawaj brakujące testy
5. Po zakończeniu każdego priorytetu - code review
6. Dokumentuj nietypowe przypadki testowe
7. Aktualizuj ten dokument o nowe scenariusze jeśli są potrzebne

---

**Powodzenia w pisaniu testów!** 🎯

Pamiętaj: dobre testy to inwestycja w przyszłość projektu. Im więcej czasu poświęcisz na testy teraz, tym mniej problemów będziesz mieć później.
