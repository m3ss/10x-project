# Specyfikacja techniczna modułu autentykacji - 10x-cards

## 1. WSTĘP

### 1.1 Cel dokumentu
Niniejsza specyfikacja określa architekturę i implementację modułu autentykacji użytkowników dla aplikacji 10x-cards, obejmującą funkcjonalności rejestracji, logowania, wylogowania oraz odzyskiwania hasła. Rozwiązanie oparte jest na Supabase Auth zintegrowanym z architekturą Astro 5 w trybie SSR (Server-Side Rendering).

### 1.2 Zakres funkcjonalny
- **US-001**: Rejestracja konta użytkownika (z opcjonalną weryfikacją e-mail)
- **US-002**: Logowanie do aplikacji z obsługą sesji
- Wylogowanie użytkownika
- Odzyskiwanie hasła (reset password)
- Usunięcie konta użytkownika wraz z powiązanymi danymi (RODO)
- Ochrona zasobów wymagających autentykacji
- Zarządzanie stanem sesji w aplikacji

### 1.3 Wymagania niefunkcjonalne
- Zgodność z RODO w zakresie przetwarzania danych osobowych
- Wykorzystanie istniejących polityk RLS (Row-Level Security) w bazie danych
- Zachowanie kompatybilności z obecną funkcjonalnością aplikacji
- Bezpieczne przechowywanie tokenów sesji
- Obsługa błędów walidacji po stronie klienta i serwera

---

## 2. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 2.1 Przegląd architektury frontendu

Architektura interfejsu opiera się na połączeniu statycznych stron Astro z dynamicznymi komponentami React. Podział odpowiedzialności:

- **Strony Astro (.astro)**: Renderowanie server-side, obsługa routingu, weryfikacja sesji, decyzje o przekierowaniach
- **Komponenty React (.tsx)**: Interaktywne formularze, walidacja client-side, komunikaty błędów, zarządzanie stanem lokalnym

### 2.2 Nowe strony Astro

#### 2.2.1 `/login` - Strona logowania
**Plik**: `src/pages/login.astro`

**Odpowiedzialność**:
- Sprawdzenie aktywnej sesji przed renderowaniem (server-side)
- Przekierowanie do `/generate` jeśli użytkownik jest zalogowany
- Renderowanie komponentu `LoginForm` dla użytkowników niezalogowanych
- Obsługa query params (np. `?redirect=/generate`, `?verified=true`)

**Struktura**:
```astro
---
// Server-side logic
- Pobranie sesji z Supabase przez middleware
- Warunek przekierowania: if (session) return redirect('/generate')
- Obsługa parametrów URL (redirect path, wiadomości weryfikacyjne)
---

<Layout title="Logowanie">
  <LoginForm client:load redirectTo={redirectPath} message={message} />
</Layout>
```

#### 2.2.2 `/register` - Strona rejestracji
**Plik**: `src/pages/register.astro`

**Odpowiedzialność**:
- Sprawdzenie aktywnej sesji przed renderowaniem
- Przekierowanie do `/generate` jeśli użytkownik jest już zalogowany
- Renderowanie komponentu `RegisterForm`
- Wyświetlenie komunikatu o weryfikacji po udanej rejestracji

**Struktura**:
```astro
---
// Server-side logic
- Pobranie sesji z Supabase przez middleware
- Warunek przekierowania: if (session) return redirect('/generate')
---

<Layout title="Rejestracja">
  <RegisterForm client:load />
</Layout>
```

#### 2.2.3 `/reset-password` - Strona resetowania hasła
**Plik**: `src/pages/reset-password.astro`

**Odpowiedzialność**:
- Renderowanie formularza żądania resetowania hasła (request reset)
- Obsługa tokenów z linków e-mail (dla ustawiania nowego hasła)
- Rozróżnienie między trybem "request" a trybem "update"

**Struktura**:
```astro
---
// Server-side logic
- Sprawdzenie czy jest access_token w URL (tryb update hasła)
- Pobranie hash fragments z URL
---

<Layout title="Reset hasła">
  <ResetPasswordForm client:load mode={mode} />
</Layout>
```

#### 2.2.4 `/settings` - Strona ustawień konta (nowa - dla usunięcia konta)
**Plik**: `src/pages/settings.astro`

**Odpowiedzialność**:
- Wyświetlanie ustawień konta użytkownika
- Opcja usunięcia konta (wymaganie RODO z PRD)
- Wymaga autentykacji

**Struktura**:
```astro
---
// Server-side logic
- Auth guard - sprawdzenie sesji
- Przekierowanie do /login jeśli niezalogowany
- Pobranie danych użytkownika
---

<Layout title="Ustawienia konta">
  <AuthenticatedNavbar client:load user={user} />
  <AccountSettings client:load user={user} />
</Layout>
```

### 2.3 Modyfikacje istniejących stron

#### 2.3.1 `/` (index.astro) - Strona główna/powitalna
**Zmiany**:
- Sprawdzenie sesji server-side
- Jeśli użytkownik zalogowany → przekierowanie do `/generate`
- Jeśli niezalogowany → wyświetlenie strony powitalnej z linkami do `/login` i `/register`

**Komponenty**:
- Modyfikacja `Welcome.astro` o dodanie przycisków CTA:
  - "Zaloguj się" → `/login`
  - "Zarejestruj się" → `/register`

#### 2.3.2 `/generate` - Widok generowania fiszek
**Zmiany**:
- Dodanie ochrony dostępu (authentication guard)
- Sprawdzenie sesji server-side
- Jeśli brak sesji → przekierowanie do `/login?redirect=/generate`
- Dodanie komponentu nawigacji z informacją o zalogowanym użytkowniku i opcją wylogowania

**Struktura zabezpieczeń**:
```astro
---
// Authentication guard
const session = await Astro.locals.supabase.auth.getSession()
if (!session.data.session) {
  return Astro.redirect('/login?redirect=/generate')
}
const user = session.data.session.user
---

<Layout title="Generowanie Fiszek">
  <AuthenticatedNavbar client:load user={user} />
  <FlashcardGenerationView client:load />
</Layout>
```

### 2.4 Nowe komponenty React

#### 2.4.1 `LoginForm.tsx`
**Lokalizacja**: `src/components/LoginForm.tsx`

**Odpowiedzialność**:
- Formularz logowania z polami email i hasło
- Walidacja client-side (format email, wymagane pola)
- Obsługa submitu formularza przez endpoint API
- Wyświetlanie komunikatów błędów (nieprawidłowe dane, błąd serwera)
- Link do strony rejestracji i resetowania hasła
- Obsługa stanu ładowania (loading state)

**Struktura**:
- **Stan lokalny**:
  - `email: string`
  - `password: string`
  - `error: string | null`
  - `isLoading: boolean`
  
- **Walidacja**:
  - Email: regex validation, wymagany
  - Hasło: minimum 6 znaków, wymagane
  
- **Obsługa submitu**:
  - POST do `/api/auth/login`
  - Przy sukcesie: redirect do `redirectTo` lub `/generate`
  - Przy błędzie: wyświetlenie komunikatu

**Komponenty UI z Shadcn**:
- `Input` (email, password)
- `Button` (submit)
- `Label`
- `Card` (wrapper formularza)
- Custom `ErrorNotification` (dla błędów)

#### 2.4.2 `RegisterForm.tsx`
**Lokalizacja**: `src/components/RegisterForm.tsx`

**Odpowiedzialność**:
- Formularz rejestracji z polami email, hasło, potwierdzenie hasła
- Walidacja client-side (zgodność haseł, siła hasła)
- Obsługa submitu formularza przez endpoint API
- Wyświetlanie komunikatu o konieczności weryfikacji email
- Link do strony logowania

**Struktura**:
- **Stan lokalny**:
  - `email: string`
  - `password: string`
  - `confirmPassword: string`
  - `error: string | null`
  - `isLoading: boolean`
  - `registrationSuccess: boolean`
  
- **Walidacja**:
  - Email: format email, wymagany
  - Hasło: minimum 8 znaków, wymagana cyfra i znak specjalny
  - Potwierdzenie hasła: musi być identyczne z hasłem
  
- **Obsługa submitu**:
  - POST do `/api/auth/register`
  - Przy sukcesie: `registrationSuccess = true`, wyświetlenie komunikatu o weryfikacji
  - Przy błędzie: wyświetlenie komunikatu (email zajęty, słabe hasło)

**Komponenty UI**:
- `Input` (email, password, confirmPassword)
- `Button` (submit)
- `Label`
- `Card`
- `Alert` (komunikat sukcesu)
- Custom `ErrorNotification`

#### 2.4.3 `ResetPasswordForm.tsx`
**Lokalizacja**: `src/components/ResetPasswordForm.tsx`

**Odpowiedzialność**:
- Dwa tryby działania:
  1. **Request mode**: formularz z email do wysłania linku resetującego
  2. **Update mode**: formularz z nowym hasłem (gdy użytkownik kliknął link z email)
- Walidacja zgodnie z trybem
- Komunikaty o sukcesie operacji

**Struktura - Request Mode**:
- **Stan lokalny**:
  - `email: string`
  - `error: string | null`
  - `isLoading: boolean`
  - `emailSent: boolean`
  
- **Obsługa submitu**:
  - POST do `/api/auth/reset-password-request`
  - Przy sukcesie: wyświetlenie komunikatu o wysłaniu linku
  
**Struktura - Update Mode**:
- **Stan lokalny**:
  - `newPassword: string`
  - `confirmPassword: string`
  - `error: string | null`
  - `isLoading: boolean`
  - `passwordUpdated: boolean`
  
- **Obsługa submitu**:
  - POST do `/api/auth/reset-password-update`
  - Przy sukcesie: redirect do `/login` z komunikatem

#### 2.4.4 `AuthenticatedNavbar.tsx`
**Lokalizacja**: `src/components/AuthenticatedNavbar.tsx`

**Odpowiedzialność**:
- Wyświetlanie informacji o zalogowanym użytkowniku (email)
- Nawigacja do stron: `/generate`, `/settings`
- Przycisk wylogowania
- Integracja z istniejącym `ThemeToggle`

**Struktura**:
- **Props**:
  - `user: { email: string, id: string }`
  
- **Funkcjonalność**:
  - Wyświetlenie email użytkownika w dropdown
  - Link "Generowanie fiszek" → `/generate`
  - Link "Ustawienia" → `/settings`
  - Separator
  - Przycisk "Wyloguj" → POST do `/api/auth/logout` → redirect do `/`
  
**Komponenty UI**:
- `DropdownMenu` (menu użytkownika)
- `Button`
- `Avatar` (inicjały z email)
- `DropdownMenuItem` (dla opcji menu)

#### 2.4.5 `AccountSettings.tsx` (nowy)
**Lokalizacja**: `src/components/AccountSettings.tsx`

**Odpowiedzialność**:
- Wyświetlanie informacji o koncie użytkownika
- Sekcja "Niebezpieczna strefa" z opcją usunięcia konta
- Potwierdzenie usunięcia konta (dialog z ostrzeżeniem)
- Obsługa procesu usuwania konta przez API

**Struktura**:
- **Props**:
  - `user: { email: string, id: string }`
  
- **Stan lokalny**:
  - `showDeleteDialog: boolean`
  - `confirmText: string`
  - `isDeleting: boolean`
  - `error: string | null`
  
- **Funkcjonalność usuwania konta**:
  - Przycisk "Usuń konto" w sekcji "Danger Zone"
  - Kliknięcie otwiera dialog z ostrzeżeniem
  - Użytkownik musi wpisać "USUŃ KONTO" aby potwierdzić
  - POST do `/api/auth/delete-account`
  - Po sukcesie: wylogowanie i redirect do `/` z komunikatem

**Komponenty UI**:
- `Card` (wrapper dla sekcji)
- `AlertDialog` (potwierdzenie usunięcia)
- `Input` (pole potwierdzające)
- `Button` (danger variant dla usunięcia)

#### 2.4.6 Rozszerzenie `ErrorNotification.tsx`
**Modyfikacje**: Rozszerzenie istniejącego komponentu o obsługę różnych typów błędów autentykacji

**Nowe typy błędów**:
- `INVALID_CREDENTIALS`: "Nieprawidłowy email lub hasło"
- `EMAIL_ALREADY_EXISTS`: "Konto z tym adresem email już istnieje"
- `WEAK_PASSWORD`: "Hasło musi zawierać minimum 8 znaków, cyfrę i znak specjalny"
- `EMAIL_NOT_VERIFIED`: "Potwierdź swój adres email aby się zalogować" (dla przyszłości)
- `INVALID_RESET_TOKEN`: "Link resetujący hasło wygasł lub jest nieprawidłowy"
- `NETWORK_ERROR`: "Błąd połączenia. Sprawdź swoje połączenie internetowe"
- `ACCOUNT_DELETION_FAILED`: "Nie udało się usunąć konta. Spróbuj ponownie później"

### 2.5 Walidacja i komunikaty błędów

#### 2.5.1 Walidacja client-side

**LoginForm**:
- Email: walidacja formatu (regex), komunikat natychmiastowy przy blur
- Hasło: sprawdzenie czy niepuste
- Ogólny błąd logowania: wyświetlany pod formularzem po błędzie API

**RegisterForm**:
- Email: walidacja formatu
- Hasło: 
  - Minimum 8 znaków
  - Zawiera co najmniej jedną cyfrę
  - Zawiera co najmniej jeden znak specjalny
  - Komunikaty real-time przy wpisywaniu
- Potwierdzenie hasła: zgodność z hasłem, komunikat przy blur

**ResetPasswordForm**:
- Request mode: walidacja email
- Update mode: walidacja nowego hasła jak przy rejestracji

#### 2.5.2 Walidacja server-side

Wszystkie endpointy API wykonują dodatkową walidację:
- Sprawdzenie obecności wymaganych pól
- Walidacja formatu email (dodatkowa weryfikacja)
- Sprawdzenie długości hasła
- Sanityzacja inputów (ochrona przed injection)

Błędy zwracane są w formacie:
```typescript
{
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'User-friendly message'
  }
}
```

### 2.6 Scenariusze użycia UI

#### 2.6.1 Scenariusz: Rejestracja nowego użytkownika

1. Użytkownik wchodzi na `/` → widzi Welcome z CTA "Zarejestruj się"
2. Klik na "Zarejestruj się" → redirect do `/register`
3. Wypełnienie formularza:
   - Wpisanie email
   - Wpisanie hasła (walidacja real-time siły hasła)
   - Potwierdzenie hasła
4. Kliknięcie "Zarejestruj się":
   - Pokazanie loadera na przycisku
   - Wysłanie żądania do API
5. Scenariusz sukcesu:
   - **Konto zostaje utworzone i użytkownik jest automatycznie zalogowany (zgodnie z US-001)**
   - Email weryfikacyjny jest wysyłany w tle (dla przyszłych funkcji wymagających zweryfikowanego konta)
   - Redirect do `/generate` z komunikatem powitalnym
   - **Uwaga**: W MVP weryfikacja email NIE jest wymagana do korzystania z aplikacji
6. Scenariusz błędu (email zajęty):
   - Wyświetlenie ErrorNotification: "Konto z tym adresem email już istnieje"
   - Link do strony logowania

#### 2.6.2 Scenariusz: Logowanie

1. Użytkownik wchodzi na `/login` (bezpośrednio lub z redirect)
2. Wypełnienie formularza (email, hasło)
3. Kliknięcie "Zaloguj się":
   - Walidacja client-side
   - Pokazanie loadera
   - Wysłanie do API
4. Scenariusz sukcesu:
   - Ustawienie sesji (cookie)
   - Redirect do `/generate` (lub do `redirectTo` z query param)
5. Scenariusz błędu:
   - "Nieprawidłowy email lub hasło"
   - (EMAIL_NOT_VERIFIED nie występuje w MVP, ponieważ weryfikacja nie jest wymagana)

#### 2.6.3 Scenariusz: Resetowanie hasła

**Część 1 - Żądanie resetu**:
1. Użytkownik na `/login` klika "Zapomniałeś hasła?"
2. Redirect do `/reset-password`
3. Wpisanie email
4. Kliknięcie "Wyślij link resetujący":
   - Wysłanie żądania do API
   - Komunikat sukcesu: "Link do resetowania hasła został wysłany na podany adres email"

**Część 2 - Ustawienie nowego hasła**:
1. Użytkownik klika link z email
2. Redirect do `/reset-password?access_token=...&type=recovery`
3. Strona wykrywa token i pokazuje formularz nowego hasła
4. Wpisanie i potwierdzenie nowego hasła
5. Kliknięcie "Ustaw nowe hasło":
   - Wysłanie do API z tokenem
   - Redirect do `/login` z komunikatem: "Hasło zostało zmienione. Możesz się teraz zalogować"

#### 2.6.4 Scenariusz: Wylogowanie

1. Użytkownik zalogowany na `/generate`
2. Kliknięcie na swój avatar/email w navbar
3. Wybranie "Wyloguj się" z dropdown
4. Wysłanie żądania do `/api/auth/logout`
5. Wyczyszczenie sesji
6. Redirect do `/` (strona powitalna)

#### 2.6.5 Scenariusz: Próba dostępu do chronionego zasobu

1. Niezalogowany użytkownik próbuje wejść na `/generate`
2. Server-side sprawdzenie sesji (w komponencie Astro)
3. Brak sesji → redirect do `/login?redirect=/generate`
4. Po zalogowaniu → automatyczny powrót do `/generate`

#### 2.6.6 Scenariusz: Usunięcie konta (RODO)

1. Zalogowany użytkownik klika na swój avatar/email w navbar
2. Wybiera "Ustawienia" z dropdown menu
3. Redirect do `/settings`
4. Przewija do sekcji "Danger Zone" (Niebezpieczna strefa)
5. Widzi ostrzeżenie: "Usunięcie konta jest trwałe i nie można go cofnąć. Wszystkie Twoje fiszki i dane zostaną usunięte."
6. Klika przycisk "Usuń konto"
7. Otwiera się dialog potwierdzający z kolejnym ostrzeżeniem
8. Użytkownik musi wpisać "USUŃ KONTO" w polu tekstowym
9. Kliknięcie "Potwierdź usunięcie":
   - Walidacja tekstu potwierdzającego
   - Wysłanie żądania do `/api/auth/delete-account`
   - Pokazanie loadera
10. Scenariusz sukcesu:
    - Konto i wszystkie powiązane dane zostają usunięte
    - Automatyczne wylogowanie
    - Redirect do `/` z komunikatem: "Twoje konto zostało trwale usunięte"
11. Scenariusz błędu:
    - Wyświetlenie komunikatu błędu
    - Dialog pozostaje otwarty
    - Użytkownik może spróbować ponownie lub anulować

---

## 3. LOGIKA BACKENDOWA

### 3.1 Architektura API

Wszystkie endpointy autentykacji znajdują się w katalogu `src/pages/api/auth/` i korzystają z Astro API Routes w trybie server-side.

**Struktura katalogów**:
```
src/pages/api/auth/
  ├── register.ts                 # POST - rejestracja
  ├── login.ts                    # POST - logowanie
  ├── logout.ts                   # POST - wylogowanie
  ├── reset-password-request.ts   # POST - żądanie resetu hasła
  ├── reset-password-update.ts    # POST - aktualizacja hasła
  └── delete-account.ts           # POST - usunięcie konta (RODO)
```

### 3.2 Endpointy API

#### 3.2.1 POST `/api/auth/register`

**Odpowiedzialność**:
- Rejestracja nowego użytkownika w Supabase Auth
- Wysłanie email weryfikacyjnego
- Zwrócenie odpowiedzi o sukcesie/błędzie

**Kontrakt żądania**:
```typescript
interface RegisterRequest {
  email: string;
  password: string;
}
```

**Walidacja**:
- Email: format email, wymagany, max 254 znaki
- Hasło: minimum 8 znaków, wymagany

**Proces**:
1. Walidacja danych wejściowych
2. Wywołanie `supabase.auth.signUp({ email, password, options })`
3. Konfiguracja opcji:
   - `emailRedirectTo`: URL do przekierowania po weryfikacji (`/login?verified=true`)
4. Obsługa odpowiedzi Supabase
5. Logowanie błędów (bez danych wrażliwych)

**Kontrakt odpowiedzi - Sukces**:
```typescript
{
  success: true,
  message: 'Konto zostało utworzone pomyślnie',
  user: {
    id: string,
    email: string
  },
  redirectTo: '/generate'
}
```

**Kontrakt odpowiedzi - Błąd**:
```typescript
{
  success: false,
  error: {
    code: 'EMAIL_ALREADY_EXISTS' | 'WEAK_PASSWORD' | 'INVALID_EMAIL' | 'SERVER_ERROR',
    message: string
  }
}
```

**Kody błędów**:
- `EMAIL_ALREADY_EXISTS`: Email już zarejestrowany
- `WEAK_PASSWORD`: Hasło nie spełnia wymagań
- `INVALID_EMAIL`: Nieprawidłowy format email
- `SERVER_ERROR`: Błąd serwera Supabase

**Implementacja**:
```typescript
export async function POST({ request, locals }: APIContext) {
  // 1. Parse i walidacja
  const body = await request.json()
  const validation = validateRegisterRequest(body)
  
  // 2. Wywołanie Supabase Auth
  const { data, error } = await locals.supabase.auth.signUp({
    email: body.email,
    password: body.password,
    options: {
      emailRedirectTo: `${siteUrl}/login?verified=true`
    }
  })
  
  // 3. Obsługa odpowiedzi
  if (error) {
    return handleSupabaseAuthError(error)
  }
  
  return new Response(JSON.stringify({ success: true, ... }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
```

#### 3.2.2 POST `/api/auth/login`

**Odpowiedzialność**:
- Uwierzytelnienie użytkownika
- Utworzenie sesji
- Ustawienie cookies sesyjnych

**Kontrakt żądania**:
```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

**Walidacja**:
- Email: wymagany, format email
- Hasło: wymagany

**Proces**:
1. Walidacja danych wejściowych
2. Wywołanie `supabase.auth.signInWithPassword({ email, password })`
3. Przy sukcesie: sesja automatycznie zarządzana przez Supabase SDK
4. Zwrócenie informacji o użytkowniku i sesji

**Kontrakt odpowiedzi - Sukces**:
```typescript
{
  success: true,
  user: {
    id: string,
    email: string
  },
  redirectTo: '/generate'
}
```

**Kontrakt odpowiedzi - Błąd**:
```typescript
{
  success: false,
  error: {
    code: 'INVALID_CREDENTIALS' | 'SERVER_ERROR',
    message: string
  }
}
```

**Kody błędów**:
- `INVALID_CREDENTIALS`: Nieprawidłowy email lub hasło
- `SERVER_ERROR`: Błąd serwera
- **Uwaga**: `EMAIL_NOT_VERIFIED` nie występuje w MVP, ponieważ weryfikacja email nie jest wymagana

#### 3.2.3 POST `/api/auth/logout`

**Odpowiedzialność**:
- Zakończenie sesji użytkownika
- Wyczyszczenie cookies

**Kontrakt żądania**: Brak body (może być pusty)

**Proces**:
1. Wywołanie `supabase.auth.signOut()`
2. Wyczyszczenie sesji po stronie Supabase
3. Zwrócenie potwierdzenia

**Kontrakt odpowiedzi**:
```typescript
{
  success: true,
  redirectTo: '/'
}
```

#### 3.2.4 POST `/api/auth/reset-password-request`

**Odpowiedzialność**:
- Wysłanie email z linkiem do resetowania hasła

**Kontrakt żądania**:
```typescript
interface ResetPasswordRequestRequest {
  email: string;
}
```

**Proces**:
1. Walidacja email
2. Wywołanie `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
3. Konfiguracja `redirectTo` na `/reset-password`
4. Zwrócenie sukcesu (nawet jeśli email nie istnieje - security best practice)

**Kontrakt odpowiedzi**:
```typescript
{
  success: true,
  message: 'Jeśli konto z tym adresem email istnieje, otrzymasz link do resetowania hasła'
}
```

#### 3.2.5 POST `/api/auth/reset-password-update`

**Odpowiedzialność**:
- Aktualizacja hasła użytkownika po kliknięciu linku z email

**Kontrakt żądania**:
```typescript
interface ResetPasswordUpdateRequest {
  newPassword: string;
  accessToken: string; // z URL
}
```

**Proces**:
1. Walidacja nowego hasła
2. Wywołanie `supabase.auth.updateUser({ password: newPassword })`
3. Token jest automatycznie weryfikowany przez Supabase
4. Zwrócenie sukcesu lub błędu

**Kontrakt odpowiedzi - Sukces**:
```typescript
{
  success: true,
  message: 'Hasło zostało zmienione pomyślnie',
  redirectTo: '/login'
}
```

**Kontrakt odpowiedzi - Błąd**:
```typescript
{
  success: false,
  error: {
    code: 'INVALID_RESET_TOKEN' | 'WEAK_PASSWORD' | 'SERVER_ERROR',
    message: string
  }
}
```

#### 3.2.6 POST `/api/auth/delete-account`

**Odpowiedzialność**:
- Usunięcie konta użytkownika wraz z wszystkimi powiązanymi danymi (RODO)
- Wymaga autentykacji
- Używa Supabase Admin API do usunięcia użytkownika
- Automatyczne usunięcie powiązanych danych dzięki CASCADE w bazie

**Kontrakt żądania**:
```typescript
interface DeleteAccountRequest {
  confirmText: string; // Użytkownik musi wpisać "USUŃ KONTO"
}
```

**Walidacja**:
- Użytkownik musi być zalogowany (sprawdzenie sesji)
- confirmText musi być równy "USUŃ KONTO"

**Proces**:
1. Sprawdzenie autentykacji (z locals.user)
2. Walidacja tekstu potwierdzającego
3. Wywołanie `supabaseServiceClient.auth.admin.deleteUser(userId)`
   - **Uwaga**: Wymaga SUPABASE_SERVICE_KEY (nie anon key)
4. Cascade delete automatycznie usunie:
   - Wszystkie fiszki użytkownika (flashcards)
   - Wszystkie generacje użytkownika (generations)
   - Wszystkie logi błędów użytkownika (generation_error_logs)
5. Wylogowanie użytkownika
6. Zwrócenie sukcesu

**Kontrakt odpowiedzi - Sukces**:
```typescript
{
  success: true,
  message: 'Twoje konto zostało trwale usunięte',
  redirectTo: '/'
}
```

**Kontrakt odpowiedzi - Błąd**:
```typescript
{
  success: false,
  error: {
    code: 'UNAUTHORIZED' | 'INVALID_CONFIRMATION' | 'SERVER_ERROR',
    message: string
  }
}
```

**Kody błędów**:
- `UNAUTHORIZED`: Użytkownik nie jest zalogowany
- `INVALID_CONFIRMATION`: Nieprawidłowy tekst potwierdzający
- `SERVER_ERROR`: Błąd podczas usuwania konta

**Implementacja**:
```typescript
export async function POST({ request, locals }: APIContext) {
  // 1. Auth check
  if (!locals.user) {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Musisz być zalogowany' }
    }), { status: 401 });
  }
  
  // 2. Walidacja
  const body = await request.json();
  if (body.confirmText !== 'USUŃ KONTO') {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'INVALID_CONFIRMATION', message: 'Nieprawidłowy tekst potwierdzający' }
    }), { status: 400 });
  }
  
  // 3. Usunięcie przez Admin API
  const supabaseAdmin = createClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false } }
  );
  
  const { error } = await supabaseAdmin.auth.admin.deleteUser(locals.user.id);
  
  if (error) {
    console.error('Account deletion error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Nie udało się usunąć konta' }
    }), { status: 500 });
  }
  
  // 4. Wylogowanie
  await locals.supabase.auth.signOut();
  
  return new Response(JSON.stringify({
    success: true,
    message: 'Twoje konto zostało trwale usunięte',
    redirectTo: '/'
  }), { status: 200 });
}
```

### 3.3 Warstwa serwisowa

#### 3.3.1 `auth.service.ts`

**Lokalizacja**: `src/lib/auth.service.ts`

**Odpowiedzialność**:
- Abstrakcja logiki autentykacji od implementacji Supabase
- Pomocnicze funkcje do zarządzania sesjami
- Walidacja danych autentykacji
- Mapowanie błędów Supabase na kody aplikacji

**Eksportowane funkcje**:

```typescript
// Typ dla wyników operacji autentykacji
type AuthResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: AuthError;
};

type AuthError = {
  code: AuthErrorCode;
  message: string;
};

type AuthErrorCode = 
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_ALREADY_EXISTS'
  | 'WEAK_PASSWORD'
  | 'INVALID_EMAIL'
  | 'EMAIL_NOT_VERIFIED'
  | 'INVALID_RESET_TOKEN'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR';

// Rejestracja
async function registerUser(
  supabase: SupabaseClient,
  email: string,
  password: string,
  emailRedirectUrl: string
): Promise<AuthResult<{ userId: string }>>

// Logowanie
async function loginUser(
  supabase: SupabaseClient,
  email: string,
  password: string
): Promise<AuthResult<{ user: User; session: Session }>>

// Wylogowanie
async function logoutUser(
  supabase: SupabaseClient
): Promise<AuthResult<void>>

// Żądanie resetu hasła
async function requestPasswordReset(
  supabase: SupabaseClient,
  email: string,
  redirectUrl: string
): Promise<AuthResult<void>>

// Aktualizacja hasła
async function updatePassword(
  supabase: SupabaseClient,
  newPassword: string
): Promise<AuthResult<void>>

// Usunięcie konta użytkownika (wymaga Admin Client)
async function deleteUserAccount(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<AuthResult<void>>

// Pobranie aktualnej sesji
async function getCurrentSession(
  supabase: SupabaseClient
): Promise<Session | null>

// Pobranie aktualnego użytkownika
async function getCurrentUser(
  supabase: SupabaseClient
): Promise<User | null>

// Walidacja formatu email
function isValidEmail(email: string): boolean

// Walidacja siły hasła
function isStrongPassword(password: string): {
  valid: boolean;
  errors: string[];
}

// Mapowanie błędów Supabase na kody aplikacji
function mapSupabaseError(error: AuthError): AuthError
```

**Logika walidacji hasła**:
```typescript
function isStrongPassword(password: string) {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Hasło musi mieć minimum 8 znaków');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Hasło musi zawierać co najmniej jedną cyfrę');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Hasło musi zawierać co najmniej jeden znak specjalny');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

### 3.4 Aktualizacja middleware

#### 3.4.1 Rozszerzenie `src/middleware/index.ts`

**Obecna funkcjonalność**: Udostępnianie klienta Supabase w `context.locals`

**Nowa funkcjonalność**:
- Obsługa sesji użytkownika
- Udostępnianie informacji o sesji wszystkim stronom
- Automatyczne odświeżanie tokenów sesji
- Ustawienie kontekstu użytkownika dla RLS

**Modyfikacje**:

```typescript
export const onRequest = defineMiddleware(async (context, next) => {
  // 1. Tworzenie klienta Supabase z obsługą cookies
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get: (key) => context.cookies.get(key)?.value,
        set: (key, value, options) => {
          context.cookies.set(key, value, options);
        },
        remove: (key, options) => {
          context.cookies.delete(key, options);
        },
      },
    }
  );
  
  // 2. Pobranie sesji
  const { data: { session } } = await supabase.auth.getSession();
  
  // 3. Odświeżenie sesji jeśli wygasa
  if (session) {
    await supabase.auth.refreshSession();
  }
  
  // 4. Udostępnienie w locals
  context.locals.supabase = supabase;
  context.locals.session = session;
  context.locals.user = session?.user ?? null;
  
  // 5. Kontynuacja do następnego middleware/route
  return next();
});
```

**Rozszerzenie typów `Astro.locals`**:

Plik: `src/env.d.ts`

```typescript
declare namespace App {
  interface Locals {
    supabase: SupabaseClient<Database>;
    session: Session | null;
    user: User | null;
  }
}
```

### 3.5 Obsługa wyjątków

#### 3.5.1 Strategia obsługi błędów

**Poziom API Endpoint**:
- Try-catch bloki dla wszystkich operacji asynchronicznych
- Logowanie błędów serwera (bez wrażliwych danych)
- Zwracanie przyjaznych komunikatów użytkownikowi
- Odpowiednie kody HTTP (400 dla błędów walidacji, 401 dla auth, 500 dla serwera)

**Poziom serwisu**:
- Mapowanie błędów Supabase na kody aplikacji
- Normalizacja struktury błędów
- Dodatkowa walidacja przed wywołaniem Supabase

**Poziom komponentów React**:
- Obsługa błędów sieciowych (timeout, brak połączenia)
- Wyświetlanie komunikatów użytkownikowi
- Retry dla błędów przejściowych (opcjonalnie)

#### 3.5.2 Przykładowa obsługa błędów w endpoincie

```typescript
export async function POST({ request, locals }: APIContext) {
  try {
    // Walidacja danych wejściowych
    const body = await request.json();
    
    if (!body.email || !body.password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Email i hasło są wymagane'
          }
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Wywołanie serwisu
    const result = await loginUser(
      locals.supabase,
      body.email,
      body.password
    );
    
    if (!result.success) {
      const statusCode = result.error.code === 'INVALID_CREDENTIALS' ? 401 : 400;
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { status: statusCode, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ success: true, user: result.data.user }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    // Logowanie błędu (bez wrażliwych danych)
    console.error('Login error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Wystąpił błąd serwera. Spróbuj ponownie później.'
        }
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

### 3.6 Aktualizacja renderowania server-side

#### 3.6.1 Pattern dla chronionych stron

Wszystkie strony wymagające autentykacji (np. `/generate`, przyszłe `/flashcards`, `/study`) będą implementować ten pattern:

```astro
---
// src/pages/generate.astro (po aktualizacji)

import Layout from "../layouts/Layout.astro";
import { FlashcardGenerationView } from "../components/FlashcardGenerationView";
import { AuthenticatedNavbar } from "../components/AuthenticatedNavbar";

// Authentication Guard
const session = Astro.locals.session;
const user = Astro.locals.user;

if (!session || !user) {
  const currentPath = Astro.url.pathname;
  return Astro.redirect(`/login?redirect=${encodeURIComponent(currentPath)}`);
}
---

<Layout title="Generowanie Fiszek">
  <AuthenticatedNavbar client:load user={user} />
  <FlashcardGenerationView client:load />
</Layout>
```

#### 3.6.2 Pattern dla stron publicznych z przekierowaniem zalogowanych

Strony jak `/login`, `/register` będą przekierowywać zalogowanych użytkowników:

```astro
---
// src/pages/login.astro

import Layout from "../layouts/Layout.astro";
import { LoginForm } from "../components/LoginForm";

const session = Astro.locals.session;

if (session) {
  return Astro.redirect('/generate');
}

// Obsługa query params
const url = new URL(Astro.request.url);
const redirectTo = url.searchParams.get('redirect') || '/generate';
const verified = url.searchParams.get('verified') === 'true';
const message = verified ? 'Email zweryfikowany pomyślnie. Możesz się teraz zalogować.' : null;
---

<Layout title="Logowanie">
  <LoginForm client:load redirectTo={redirectTo} message={message} />
</Layout>
```

---

## 4. SYSTEM AUTENTYKACJI Z SUPABASE AUTH

### 4.1 Architektura Supabase Auth

#### 4.1.1 Przegląd

Supabase Auth zapewnia kompletny system autentykacji oparty na PostgreSQL i JWT (JSON Web Tokens). Kluczowe komponenty:

- **auth.users**: Tabela użytkowników zarządzana przez Supabase
- **JWT Tokens**: Access token i refresh token do zarządzania sesjami
- **Email Service**: Wysyłanie maili weryfikacyjnych i resetujących hasło
- **Row-Level Security**: Automatyczna integracja z RLS w PostgreSQL

#### 4.1.2 Przepływ autentykacji

**Rejestracja**:
1. Użytkownik wypełnia formularz → POST do `/api/auth/register`
2. Endpoint wywołuje `supabase.auth.signUp({ email, password, options: { emailRedirectTo, data: { email_confirm_autoconfirm: true } } })`
3. Supabase tworzy użytkownika w `auth.users`
4. **W MVP**: Użytkownik jest automatycznie zalogowany (auto-confirm włączone w konfiguracji Supabase)
5. Email weryfikacyjny jest wysyłany w tle (opcjonalnie, dla przyszłych funkcji)
6. Użytkownik przekierowywany do `/generate` z aktywną sesją
7. **Uwaga**: Weryfikacja email może być włączona w przyszłości dla dodatkowych funkcji bezpieczeństwa

**Logowanie**:
1. Użytkownik wypełnia formularz → POST do `/api/auth/login`
2. Endpoint wywołuje `supabase.auth.signInWithPassword()`
3. Supabase weryfikuje credentials
4. Przy sukcesie: generowanie access token (JWT) i refresh token
5. Tokeny zapisywane w HTTP-only cookies przez middleware
6. Sesja aktywna

**Sesja**:
- Access token (JWT) ważny przez 1 godzinę
- Refresh token ważny przez 7 dni (konfigurowalny)
- Middleware automatycznie odświeża tokeny przed wygaśnięciem
- Tokeny przechowywane w HTTP-only cookies (bezpieczne przed XSS)

**Wylogowanie**:
1. Użytkownik klika "Wyloguj" → POST do `/api/auth/logout`
2. Endpoint wywołuje `supabase.auth.signOut()`
3. Supabase unieważnia refresh token
4. Middleware usuwa cookies
5. Redirect do `/`

### 4.2 Konfiguracja Supabase Auth

#### 4.2.1 Wymagane zmienne środowiskowe

Plik: `.env` (lokalnie) i secrets w środowisku produkcyjnym

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# Application
PUBLIC_SITE_URL=http://localhost:4321  # lub https://yourdomain.com w produkcji
```

#### 4.2.2 Konfiguracja w Supabase Dashboard

**Authentication Settings** (w Supabase Dashboard):

1. **Email Auth**: Włączone
2. **Email Confirmations**: **Wyłączone w MVP** (użytkownicy mogą korzystać z aplikacji bez weryfikacji email)
   - Może być włączone w przyszłości dla dodatkowych funkcji bezpieczeństwa
3. **Email Template - Confirm Signup** (opcjonalne, przygotowane na przyszłość):
   ```html
   <h2>Witaj w 10x-cards!</h2>
   <p>Kliknij poniższy link aby potwierdzić swój adres email:</p>
   <p><a href="{{ .ConfirmationURL }}">Potwierdź email</a></p>
   ```

4. **Email Template - Reset Password**:
   ```html
   <h2>Reset hasła</h2>
   <p>Kliknij poniższy link aby zresetować hasło:</p>
   <p><a href="{{ .ConfirmationURL }}">Resetuj hasło</a></p>
   <p>Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.</p>
   ```

5. **Redirect URLs**: 
   - Development: `http://localhost:4321/**`
   - Production: `https://yourdomain.com/**`

6. **Password Requirements**:
   - Minimum length: 8 characters
   - (Dodatkowe wymagania implementowane w walidacji aplikacji)

### 4.3 Integracja z Row-Level Security (RLS)

#### 4.3.1 Obecne polityki RLS

Aplikacja już posiada polityki RLS dla tabel `flashcards`, `generations`, `generation_error_logs`. Wszystkie polityki sprawdzają:

```sql
auth.uid() = user_id
```

Gdzie:
- `auth.uid()` - funkcja Supabase zwracająca ID zalogowanego użytkownika z JWT
- `user_id` - kolumna w tabeli przechowująca UUID użytkownika

#### 4.3.2 Automatyczne działanie RLS po uwierzytelnieniu

Po zalogowaniu:
1. Access token (JWT) zawiera `sub` claim z UUID użytkownika
2. Przy każdym zapytaniu do bazy, Supabase ustawia kontekst `auth.uid()` na podstawie JWT
3. Polityki RLS automatycznie filtrują/ograniczają dostęp do danych

**Przykład działania**:
```typescript
// Użytkownik zalogowany jako user_id = 'abc-123'
const { data } = await supabase
  .from('flashcards')
  .select('*')

// RLS automatycznie doda warunek: WHERE user_id = 'abc-123'
// Zwróci tylko fiszki tego użytkownika
```

#### 4.3.3 Brak konieczności zmian w RLS

Istniejące polityki są już kompatybilne z Supabase Auth:
- ✅ Blokują dostęp dla użytkowników `anon` (niezalogowanych)
- ✅ Zezwalają na operacje tylko dla `authenticated` z dopasowanym `user_id`
- ✅ Używają `auth.uid()` który jest automatycznie ustawiany po autentykacji

**Nie są wymagane żadne zmiany w migracji SQL.**

### 4.4 Zarządzanie sesjami

#### 4.4.1 Przechowywanie sesji

**Server-side (preferowane)**:
- Tokeny w HTTP-only cookies (ustawiane przez middleware)
- Cookie names (standardowe Supabase):
  - `sb-access-token`
  - `sb-refresh-token`
- Flags: `HttpOnly`, `Secure` (w produkcji), `SameSite=Lax`

**Client-side**:
- Brak przechowywania tokenów w localStorage (bezpieczeństwo)
- Stan sesji dostępny przez API Supabase (`supabase.auth.getSession()`)

#### 4.4.2 Odświeżanie tokenów

**Automatyczne odświeżanie w middleware**:
```typescript
// W middleware/index.ts
const { data: { session } } = await supabase.auth.getSession();

if (session) {
  // Automatyczne odświeżenie jeśli token bliski wygaśnięcia
  const { data: refreshedSession } = await supabase.auth.refreshSession();
  
  if (refreshedSession.session) {
    context.locals.session = refreshedSession.session;
  }
}
```

**Supabase SDK** automatycznie:
- Sprawdza ważność access token
- Odświeża używając refresh token gdy potrzeba
- Aktualizuje cookies

#### 4.4.3 Wygasanie sesji

- **Access Token**: 1 godzina (domyślnie)
- **Refresh Token**: 7 dni (domyślnie, konfigurowalny w Supabase)

Po wygaśnięciu refresh token:
- Użytkownik musi się ponownie zalogować
- Middleware wykryje brak sesji
- Przekierowanie do `/login`

### 4.5 Email i weryfikacja

#### 4.5.1 Proces weryfikacji email (opcjonalny w MVP)

**W MVP (zgodnie z US-001 z PRD):**
- Weryfikacja email **NIE jest wymagana**
- Użytkownicy mogą korzystać z aplikacji natychmiast po rejestracji
- Email weryfikacyjny może być wysyłany w tle dla przyszłych funkcji

**Proces weryfikacji (przygotowany na przyszłość):**

1. **Podczas rejestracji**:
   - Supabase tworzy użytkownika z automatycznym potwierdzeniem
   - Opcjonalnie: wysyła email z tokenem weryfikacyjnym (do wykorzystania w przyszłości)
   - Użytkownik może się zalogować natychmiast

2. **Link weryfikacyjny** (jeśli zostanie włączone w przyszłości):
   - Format: `https://yourdomain.com/auth/confirm?token=...&type=signup`
   - Supabase automatycznie obsługuje endpoint `/auth/confirm`
   - Może być używany do odblokowywania premium features

3. **Korzyści z weryfikacji email w przyszłości**:
   - Dodatkowa warstwa bezpieczeństwa
   - Możliwość odzyskania konta
   - Wymaganie dla premium features

#### 4.5.2 Konfiguracja SMTP (produkcja)

W środowisku lokalnym: Supabase używa wbudowanego testowego SMTP (InBucket)

W produkcji należy skonfigurować własny SMTP w Supabase Dashboard:
- **SMTP Settings** → Add custom SMTP
- Rekomendowane serwisy: SendGrid, AWS SES, Mailgun
- Dodanie własnej domeny dla lepszej deliverability

#### 4.5.3 Rate limiting na email

Supabase Auth automatycznie limituje:
- Liczba prób logowania: 6 prób / godzinę na IP
- Liczba emaili weryfikacyjnych: 3 emaile / godzinę na adres
- Liczba emaili resetujących hasło: 3 emaile / godzinę na adres

### 4.6 Bezpieczeństwo

#### 4.6.1 Zabezpieczenia implementowane przez Supabase Auth

- **Hashing haseł**: bcrypt z saltem
- **JWT Signing**: HS256 z secret key
- **Rate limiting**: automatyczny na endpointy auth
- **CSRF Protection**: via SameSite cookies
- **XSS Protection**: HTTP-only cookies (tokeny niedostępne dla JS)

#### 4.6.2 Dodatkowe zabezpieczenia w aplikacji

**Walidacja**:
- Client-side i server-side walidacja wszystkich inputów
- Sanityzacja danych przed wysłaniem do API
- Sprawdzenie siły hasła

**Logging**:
- Logowanie błędów autentykacji (bez haseł!)
- Monitoring prób nieautoryzowanego dostępu
- Logowanie w `generation_error_logs` jeśli operacja wymaga auth

**Headers bezpieczeństwa**:
Dodanie do `astro.config.mjs` (opcjonalnie przez middleware):
```typescript
// Security headers
context.response.headers.set('X-Content-Type-Options', 'nosniff');
context.response.headers.set('X-Frame-Options', 'DENY');
context.response.headers.set('X-XSS-Protection', '1; mode=block');
```

#### 4.6.3 RODO i prywatność

**Przechowywane dane użytkownika**:
- Email (w `auth.users`, wymagany)
- ID użytkownika UUID (w `auth.users` i jako `user_id` w tabelach aplikacji)
- Timestamps (created_at, last_sign_in_at)

**Prawo do usunięcia** (zgodnie z wymaganiami RODO z PRD):
- Supabase Auth API: `supabase.auth.admin.deleteUser(userId)`
- Cascade delete: usunięcie użytkownika automatycznie usuwa wszystkie powiązane dane (fiszki, generacje, logi) dzięki `ON DELETE CASCADE` w schemacie bazy

**Implementacja usunięcia konta** (część MVP):
- Endpoint: `POST /api/auth/delete-account`
- Strona: `/settings` z komponentem `AccountSettings`
- Wymaga autentykacji i potwierdzenia przez użytkownika (wpisanie "USUŃ KONTO")
- Wywołuje `supabaseServiceClient.auth.admin.deleteUser(user.id)`
- Po usunięciu: wylogowanie i redirect do strony głównej
- **Zgodność z RODO**: Prawo do usunięcia danych osobowych (Art. 17)

### 4.7 Migracja użytkownika tymczasowego

#### 4.7.1 Problem

Obecna implementacja używa `DEFAULT_USER_ID` dla operacji przed wdrożeniem autentykacji:

```typescript
// src/db/supabase.client.ts
export const DEFAULT_USER_ID = "0e0fdd5b-b395-4862-9451-9c7da0e1a895";
```

Ten UUID jest obecnie używany w `generation.service.ts` i `flashcard.service.ts`.

#### 4.7.2 Rozwiązanie

**Po wdrożeniu autentykacji**:

1. **Usunięcie DEFAULT_USER_ID**:
   - Wszystkie serwisy będą przyjmować `userId` jako parametr
   - Parametr będzie pochodził z `Astro.locals.user.id` (weryfikowany przez auth guard)

2. **Aktualizacja serwisów**:

```typescript
// generation.service.ts - PRZED
export async function createGeneration(data: CreateGenerationDTO) {
  const generationData: TablesInsert<"generations"> = {
    user_id: DEFAULT_USER_ID,  // ❌ Usunąć
    // ...
  };
}

// generation.service.ts - PO
export async function createGeneration(
  userId: string,  // ✅ Dodać parametr
  data: CreateGenerationDTO
) {
  const generationData: TablesInsert<"generations"> = {
    user_id: userId,  // ✅ Użyć przekazanego ID
    // ...
  };
}
```

3. **Aktualizacja endpointów API**:

```typescript
// src/pages/api/generations.ts - PO
export async function POST({ request, locals }: APIContext) {
  // Authentication check
  if (!locals.user) {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Musisz być zalogowany' }
    }), { status: 401 });
  }
  
  const userId = locals.user.id;  // ✅ Z sesji
  
  // ... walidacja ...
  
  const generation = await createGeneration(userId, generationData);  // ✅ Przekazać userId
}
```

4. **Dane testowe**:
   - W rozwoju lokalnym: tworzenie testowego użytkownika przez `supabase.auth.signUp()`
   - Usunięcie twardego DEFAULT_USER_ID z kodu

---

## 5. SZCZEGÓŁY IMPLEMENTACYJNE

### 5.1 Zależności npm

**Wymagane pakiety** (prawdopodobnie już zainstalowane):
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x.x",
    "@supabase/auth-helpers-astro": "^0.x.x"  // Opcjonalnie, dla helpers
  }
}
```

**Weryfikacja**: Sprawdzić `package.json`, jeśli brakuje - dodać przez `npm install`.

### 5.2 Konfiguracja TypeScript

**Rozszerzenie typów w `src/env.d.ts`**:

```typescript
/// <reference types="astro/client" />

import type { SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { Database } from './db/database.types';

declare namespace App {
  interface Locals {
    supabase: SupabaseClient<Database>;
    session: Session | null;
    user: User | null;
  }
}
```

**Typy dla komponentów**:

```typescript
// src/types.ts - dodać sekcję Auth
export interface AuthUser {
  id: string;
  email: string;
}

export interface LoginFormProps {
  redirectTo?: string;
  message?: string | null;
}

export interface RegisterFormProps {}

export interface ResetPasswordFormProps {
  mode: 'request' | 'update';
  accessToken?: string;
}

export interface AuthenticatedNavbarProps {
  user: AuthUser;
}

export interface AccountSettingsProps {
  user: AuthUser;
}
```

### 5.3 Struktura plików do utworzenia

```
src/
├── pages/
│   ├── login.astro                          # NOWY
│   ├── register.astro                       # NOWY
│   ├── reset-password.astro                 # NOWY
│   ├── settings.astro                       # NOWY (usuwanie konta)
│   ├── index.astro                          # MODYFIKACJA
│   ├── generate.astro                       # MODYFIKACJA
│   └── api/
│       └── auth/
│           ├── register.ts                  # NOWY
│           ├── login.ts                     # NOWY
│           ├── logout.ts                    # NOWY
│           ├── reset-password-request.ts    # NOWY
│           ├── reset-password-update.ts     # NOWY
│           └── delete-account.ts            # NOWY (RODO)
├── components/
│   ├── LoginForm.tsx                        # NOWY
│   ├── RegisterForm.tsx                     # NOWY
│   ├── ResetPasswordForm.tsx                # NOWY
│   ├── AuthenticatedNavbar.tsx              # NOWY
│   ├── AccountSettings.tsx                  # NOWY (usuwanie konta)
│   ├── Welcome.astro                        # MODYFIKACJA
│   └── ErrorNotification.tsx                # MODYFIKACJA (rozszerzenie)
├── lib/
│   ├── auth.service.ts                      # NOWY
│   ├── generation.service.ts                # MODYFIKACJA (userId param)
│   └── flashcard.service.ts                 # MODYFIKACJA (userId param)
├── middleware/
│   └── index.ts                             # MODYFIKACJA
├── db/
│   └── supabase.client.ts                   # MODYFIKACJA (usunąć DEFAULT_USER_ID)
├── types.ts                                 # MODYFIKACJA (dodać typy auth)
└── env.d.ts                                 # MODYFIKACJA (Locals types)
```

### 5.4 Kolejność implementacji (rekomendowana)

1. **Faza 1 - Fundament**:
   - Aktualizacja `src/middleware/index.ts` (obsługa sesji)
   - Utworzenie `src/lib/auth.service.ts` (funkcje pomocnicze)
   - Rozszerzenie typów w `src/env.d.ts` i `src/types.ts`

2. **Faza 2 - Rejestracja i logowanie**:
   - Endpoint `POST /api/auth/register`
   - Endpoint `POST /api/auth/login`
   - Endpoint `POST /api/auth/logout`
   - Komponent `LoginForm.tsx`
   - Komponent `RegisterForm.tsx`
   - Strona `src/pages/login.astro`
   - Strona `src/pages/register.astro`

3. **Faza 3 - Reset hasła**:
   - Endpoint `POST /api/auth/reset-password-request`
   - Endpoint `POST /api/auth/reset-password-update`
   - Komponent `ResetPasswordForm.tsx`
   - Strona `src/pages/reset-password.astro`

4. **Faza 4 - Integracja z istniejącymi stronami**:
   - Aktualizacja `src/pages/index.astro` (przekierowania)
   - Aktualizacja `src/components/Welcome.astro` (CTA buttons)
   - Aktualizacja `src/pages/generate.astro` (auth guard)
   - Komponent `AuthenticatedNavbar.tsx`

5. **Faza 5 - Usuwanie konta (RODO)**:
   - Endpoint `POST /api/auth/delete-account`
   - Komponent `AccountSettings.tsx`
   - Strona `src/pages/settings.astro`
   - Aktualizacja `AuthenticatedNavbar` o link do ustawień
   - Dodanie funkcji `deleteUserAccount` w `auth.service.ts`

6. **Faza 6 - Migracja userId**:
   - Aktualizacja `src/lib/generation.service.ts` (userId param)
   - Aktualizacja `src/lib/flashcard.service.ts` (userId param)
   - Aktualizacja `src/pages/api/generations.ts` (auth check)
   - Aktualizacja `src/pages/api/flashcards.ts` (auth check)
   - Usunięcie `DEFAULT_USER_ID` z `src/db/supabase.client.ts`

7. **Faza 7 - Testy i poprawki**:
   - Testy manualne wszystkich przepływów
   - Weryfikacja komunikatów błędów
   - Sprawdzenie responsywności formularzy
   - Testy RLS (próba dostępu do cudzych danych)

### 5.5 Konfiguracja Supabase (kroki)

1. **W Supabase Dashboard**:
   - Authentication → Settings → Enable Email provider
   - Authentication → Email Templates → Dostosować szablony (język polski)
   - Authentication → URL Configuration → Dodać redirect URLs
   - Authentication → Password Requirements → Minimum 8 characters

2. **Zmienne środowiskowe**:
   - Skopiować `.env.example` do `.env`
   - Wypełnić `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_KEY`
   - Dodać `PUBLIC_SITE_URL`

3. **Produkcja**:
   - Skonfigurować SMTP w Supabase
   - Dodać zmienne środowiskowe w platformie hostingowej (DigitalOcean)
   - Zaktualizować Redirect URLs na produkcyjne

---

## 6. ZGODNOŚĆ Z ISTNIEJĄCĄ APLIKACJĄ

### 6.1 Zachowanie obecnej funkcjonalności

**Generowanie fiszek** (US-003):
- ✅ Funkcjonalność pozostaje bez zmian
- ✅ Endpoint `/api/generations` będzie działał jak dotychczas
- ✅ Jedyna zmiana: `userId` z sesji zamiast `DEFAULT_USER_ID`
- ✅ Komponenty `FlashcardGenerationView`, `FlashcardList` bez zmian

**Zapisywanie fiszek** (US-004):
- ✅ Endpoint `/api/flashcards` bez zmian funkcjonalnych
- ✅ Zmiana tylko w źródle `userId`

**RLS policies**:
- ✅ Istniejące polityki są kompatybilne z Supabase Auth
- ✅ Nie wymagają modyfikacji

**Middleware**:
- ✅ Rozszerzenie o sesję, ale kompatybilność wsteczna
- ✅ `context.locals.supabase` nadal dostępny

### 6.2 Nowe wymagania dla istniejących stron

**`/generate`**:
- ➕ Dodanie auth guard (sprawdzenie sesji)
- ➕ Przekierowanie do `/login` jeśli niezalogowany
- ➕ Dodanie `AuthenticatedNavbar`

**`/`** (index):
- ➕ Sprawdzenie sesji
- ➕ Przekierowanie do `/generate` jeśli zalogowany
- ➕ Modyfikacja `Welcome.astro` o CTA do rejestracji/logowania

### 6.3 Polityka dostępu

**Strony publiczne** (dostępne bez logowania):
- `/` - strona główna
- `/login` - logowanie
- `/register` - rejestracja
- `/reset-password` - reset hasła

**Strony chronione** (wymagają autentykacji):
- `/generate` - generowanie fiszek
- `/settings` - ustawienia konta i usuwanie konta
- Przyszłe: `/flashcards`, `/study`

**API publiczne** (bez autentykacji):
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/reset-password-request`
- `POST /api/auth/reset-password-update`

**API chronione** (wymagają autentykacji):
- `POST /api/auth/logout`
- `POST /api/auth/delete-account`
- `POST /api/generations`
- `POST /api/flashcards`
- `GET /api/flashcards` (jeśli będzie)
- `PUT /api/flashcards/:id` (przyszłe)
- `DELETE /api/flashcards/:id` (przyszłe)

---

## 7. TESTOWANIE

### 7.1 Scenariusze testowe

#### 7.1.1 Rejestracja
1. ✅ Poprawna rejestracja z prawidłowymi danymi
2. ✅ Automatyczne zalogowanie po rejestracji (zgodnie z US-001)
3. ✅ Przekierowanie do `/generate` po pomyślnej rejestracji
4. ✅ Błąd przy istniejącym emailu
5. ✅ Błąd przy słabym haśle
6. ✅ Błąd przy niezgodnych hasłach (confirmPassword)
7. ✅ Walidacja formatu email
8. ✅ Email weryfikacyjny jest wysyłany w tle (opcjonalnie, dla przyszłych funkcji)

#### 7.1.2 Logowanie
1. ✅ Poprawne logowanie z istniejącym kontem
2. ✅ Błąd przy nieprawidłowym haśle
3. ✅ Błąd przy nieistniejącym emailu
4. ✅ Przekierowanie do `/generate` po sukcesie
5. ✅ Przekierowanie do `redirectTo` jeśli podany w query param
6. ✅ Przekierowanie do `/generate` jeśli już zalogowany (przy próbie dostępu do /login)

#### 7.1.3 Resetowanie hasła
1. ✅ Wysłanie linku resetującego dla istniejącego konta
2. ✅ Brak błędu dla nieistniejącego emaila (security)
3. ✅ Otrzymanie emaila z linkiem
4. ✅ Kliknięcie linku i otwarcie formularza nowego hasła
5. ✅ Ustawienie nowego hasła
6. ✅ Błąd przy słabym nowym haśle
7. ✅ Logowanie z nowym hasłem

#### 7.1.4 Sesja i wylogowanie
1. ✅ Sesja utrzymuje się po odświeżeniu strony
2. ✅ Sesja utrzymuje się między zakładkami
3. ✅ Wylogowanie usuwa sesję
4. ✅ Próba dostępu do `/generate` po wylogowaniu → redirect do `/login`
5. ✅ Automatyczne odświeżanie tokenu przed wygaśnięciem

#### 7.1.5 Ochrona zasobów
1. ✅ Niezalogowany użytkownik nie może wywołać `POST /api/generations`
2. ✅ Niezalogowany użytkownik nie może wywołać `POST /api/flashcards`
3. ✅ Użytkownik A nie widzi fiszek użytkownika B (RLS)
4. ✅ Użytkownik A nie widzi generacji użytkownika B (RLS)

#### 7.1.6 Usuwanie konta (RODO)
1. ✅ Dostęp do strony `/settings` wymaga zalogowania
2. ✅ Kliknięcie "Usuń konto" otwiera dialog z ostrzeżeniem
3. ✅ Użytkownik musi wpisać "USUŃ KONTO" aby potwierdzić
4. ✅ Błąd przy nieprawidłowym tekście potwierdzającym
5. ✅ Pomyślne usunięcie konta usuwa:
   - Konto użytkownika z auth.users
   - Wszystkie fiszki użytkownika (cascade)
   - Wszystkie generacje użytkownika (cascade)
   - Wszystkie logi błędów użytkownika (cascade)
6. ✅ Po usunięciu: automatyczne wylogowanie
7. ✅ Po usunięciu: redirect do `/` z komunikatem
8. ✅ Próba zalogowania usuniętym kontem → błąd INVALID_CREDENTIALS

### 7.2 Testy manualne UI

1. ✅ Responsywność formularzy (mobile, tablet, desktop)
2. ✅ Walidacja real-time w formularzach
3. ✅ Poprawne wyświetlanie komunikatów błędów
4. ✅ Loading states na przyciskach
5. ✅ Disabled states na formularzach podczas submitu
6. ✅ Dostępność (keyboard navigation, screen readers)
7. ✅ Dark mode w formularzach autentykacji

### 7.3 Testy integracyjne

Opcjonalnie (poza MVP, ale rekomendowane):
- Testy E2E z Playwright/Cypress
- Testy jednostkowe dla `auth.service.ts`
- Testy API dla endpointów autentykacji

---

## 8. MONITORING I LOGOWANIE

### 8.1 Logi aplikacyjne

**Co logować**:
- ✅ Próby logowania (timestamp, email, sukces/błąd)
- ✅ Rejestracje (timestamp, email, sukces)
- ✅ Resety haseł (timestamp, email)
- ✅ Błędy serwera (bez danych wrażliwych)
- ❌ **NIE LOGOWAĆ**: Haseł, tokenów, PII (dane osobowe)

**Format logów**:
```typescript
{
  timestamp: '2026-01-21T10:30:00Z',
  level: 'INFO' | 'WARNING' | 'ERROR',
  event: 'USER_LOGIN' | 'USER_REGISTER' | 'PASSWORD_RESET',
  userId?: string,
  email?: string,  // opcjonalnie, zanonimizowany w produkcji
  success: boolean,
  errorCode?: string,
  message: string
}
```

**Implementacja**:
```typescript
// Przykład w auth.service.ts
function logAuthEvent(event: AuthEvent) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: event.success ? 'INFO' : 'WARNING',
    event: event.type,
    success: event.success,
    errorCode: event.errorCode,
    // W produkcji: hash email zamiast plain text
  }));
}
```

### 8.2 Metryki

**Do śledzenia** (opcjonalnie, w przyszłości):
- Liczba rejestracji dziennie/tygodniowo
- Liczba logowań dziennie
- Liczba nieudanych prób logowania (detection brute force)
- Liczba resetów haseł
- Retention rate (użytkownicy aktywni po X dniach)

**Narzędzia**:
- Supabase Dashboard → Authentication → Users (podstawowe statystyki)
- Opcjonalnie: Google Analytics, Plausible, Posthog dla zaawansowanych metryk

---

## 9. DOKUMENTACJA DLA UŻYTKOWNIKA KOŃCOWEGO

### 9.1 Komunikaty i help text

**Formularz rejestracji**:
- Label email: "Adres email"
- Placeholder: "twoj@email.com"
- Help text: "Użyjemy tego adresu do weryfikacji konta"
- Label hasło: "Hasło"
- Help text: "Minimum 8 znaków, zawierające cyfrę i znak specjalny"

**Formularz logowania**:
- Label email: "Adres email"
- Label hasło: "Hasło"
- Link: "Zapomniałeś hasła?"

**Formularz reset hasła (request)**:
- Label email: "Adres email"
- Help text: "Wyślemy link do resetowania hasła na podany adres"

**Formularz reset hasła (update)**:
- Label: "Nowe hasło"
- Help text: "Minimum 8 znaków, zawierające cyfrę i znak specjalny"
- Label: "Potwierdź nowe hasło"

### 9.2 FAQ (do umieszczenia w dokumentacji/help)

**Q: Nie otrzymałem emaila weryfikacyjnego**
A: Sprawdź folder spam. Jeśli nadal nie ma, skontaktuj się z wsparciem.

**Q: Link weryfikacyjny wygasł**
A: Zaloguj się ponownie - system automatycznie wyśle nowy link.

**Q: Zapomniałem hasła**
A: Na stronie logowania kliknij "Zapomniałeś hasła?" i postępuj zgodnie z instrukcjami w emailu.

**Q: Czy moje dane są bezpieczne?**
A: Tak, hasła są szyfrowane, a dane przechowywane zgodnie z RODO. Więcej w Polityce Prywatności.

---

## 10. PODSUMOWANIE

### 10.1 Kluczowe komponenty

**Frontend**:
- 4 nowe strony Astro: `/login`, `/register`, `/reset-password`, `/settings`
- 5 nowych komponentów React: `LoginForm`, `RegisterForm`, `ResetPasswordForm`, `AuthenticatedNavbar`, `AccountSettings`
- Modyfikacje 2 istniejących stron: `/`, `/generate`
- Rozszerzenie 1 komponentu: `ErrorNotification`

**Backend**:
- 6 nowych endpointów API w `/api/auth/*`: register, login, logout, reset-password-request, reset-password-update, delete-account
- 1 nowy serwis: `auth.service.ts`
- Modyfikacja middleware: obsługa sesji
- Aktualizacja 2 serwisów: `generation.service`, `flashcard.service` (userId)

**Infrastruktura**:
- Integracja z Supabase Auth
- Konfiguracja SMTP dla emaili
- Rozszerzenie typów TypeScript
- Zmienne środowiskowe

### 10.2 Zgodność z wymaganiami

✅ **US-001 - Rejestracja konta**:
- Formularz z email i hasłem
- Weryfikacja email
- Automatyczne zalogowanie po weryfikacji
- Komunikaty sukcesu i błędów

✅ **US-002 - Logowanie do aplikacji**:
- Formularz logowania
- Przekierowanie do `/generate` po sukcesie
- Komunikaty błędów dla nieprawidłowych danych
- Bezpieczne przechowywanie danych (JWT w HTTP-only cookies)

✅ **Dodatkowe funkcjonalności**:
- Wylogowanie
- Reset hasła
- Usunięcie konta (zgodnie z wymaganiami RODO z PRD)
- Ochrona zasobów wymagających autentykacji

### 10.3 Bezpieczeństwo i RODO

✅ Zgodność z RODO:
- Minimalizacja danych (tylko email i ID)
- Bezpieczne przechowywanie haseł (bcrypt)
- Prawo do usunięcia (cascade delete w bazie)

✅ Bezpieczeństwo:
- HTTP-only cookies
- CSRF protection
- Rate limiting (Supabase)
- Walidacja client i server-side
- RLS dla izolacji danych użytkowników

### 10.4 Kompatybilność

✅ Brak naruszenia istniejącej funkcjonalności:
- Istniejące endpointy działają po dodaniu auth check
- RLS policies kompatybilne bez zmian
- Middleware rozszerzony, ale kompatybilny wstecz
- Komponenty UI zachowują działanie

### 10.5 Następne kroki po implementacji

1. **Testowanie** (zgodnie z sekcją 7)
2. **Dokumentacja użytkownika** (help, FAQ)
3. **Monitoring** (logi, metryki)
4. **Opcjonalne rozszerzenia** (poza MVP):
   - Weryfikacja email (jeśli wymagana dla premium features)
   - 2FA (dwuskładnikowa autentykacja)
   - OAuth providers (Google, GitHub)
   - Remember me (dłuższe sesje)
   - Zmiana hasła (change password bez reset)

---

## 11. ZAŁĄCZNIKI

### 11.1 Przykładowy flow diagram autentykacji

```
[Użytkownik] → [Strona /register]
                    ↓
            [Wypełnia formularz]
                    ↓
            [POST /api/auth/register]
                    ↓
            [Supabase Auth - signUp]
                    ↓
            [Email weryfikacyjny]
                    ↓
    [Użytkownik klika link] → [Supabase weryfikuje]
                    ↓
            [Redirect /login?verified=true]
                    ↓
            [Użytkownik się loguje]
                    ↓
            [POST /api/auth/login]
                    ↓
            [Supabase Auth - signIn]
                    ↓
            [Sesja utworzona (JWT)]
                    ↓
            [Redirect /generate]
                    ↓
    [Auth Guard sprawdza sesję] → [OK] → [Renderowanie strony]
                    ↓ [BRAK]
            [Redirect /login]
```

### 11.2 Przykładowa struktura JWT (informacyjnie)

```json
{
  "aud": "authenticated",
  "exp": 1674400000,
  "sub": "0e0fdd5b-b395-4862-9451-9c7da0e1a895",
  "email": "user@example.com",
  "phone": "",
  "app_metadata": {},
  "user_metadata": {},
  "role": "authenticated"
}
```

**Kluczowe pola**:
- `sub`: UUID użytkownika (używane w RLS jako `auth.uid()`)
- `email`: Email użytkownika
- `exp`: Timestamp wygaśnięcia tokenu
- `role`: Rola użytkownika (`authenticated` vs `anon`)

### 11.3 Glossary

- **JWT**: JSON Web Token - format tokenu używany do autentykacji
- **RLS**: Row-Level Security - zabezpieczenia na poziomie wierszy w PostgreSQL
- **SSR**: Server-Side Rendering - renderowanie po stronie serwera
- **Supabase Auth**: Moduł autentykacji w Supabase
- **Access Token**: Token krótkoterminowy do autoryzacji zapytań API
- **Refresh Token**: Token długoterminowy do odnawiania access token
- **HTTP-only Cookie**: Cookie niedostępny dla JavaScript (bezpieczniejszy)
- **CSRF**: Cross-Site Request Forgery - typ ataku webowego
- **XSS**: Cross-Site Scripting - typ ataku webowego

---

**Koniec specyfikacji**

Wersja: 1.0  
Data: 2026-01-21  
Autor: AI Assistant  
Status: Do implementacji
