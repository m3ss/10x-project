# Przewodnik debugowania problemu "Ładowanie..." na stronie my-flashcards

## Problem
Strona `/my-flashcards` wiesza się w stanie "Ładowanie..." i przyciski są nieaktywne.

## Naprawione problemy

### 1. ✅ Nieskończona pętla w useEffect
**Lokalizacja:** `src/components/MyFlashcardsView.tsx`

**Problem:** 
`fetchFlashcards` było w dependency array useEffect, co powodowało nieskończoną pętlę re-renderowania.

**Rozwiązanie:**
```tsx
// PRZED (ZŁE):
useEffect(() => {
  const source = sourceFilter === "all" ? undefined : sourceFilter;
  fetchFlashcards(currentPage, 20, source);
}, [fetchFlashcards, currentPage, sourceFilter]); // ❌ fetchFlashcards powoduje loop

// PO (DOBRE):
useEffect(() => {
  const source = sourceFilter === "all" ? undefined : sourceFilter;
  fetchFlashcards(currentPage, 20, source);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [currentPage, sourceFilter]); // ✅ tylko zmiany filtrów
```

### 2. ✅ Brak credentials w fetch
**Lokalizacja:** `src/components/hooks/useFlashcards.ts`, `src/components/hooks/useCreateFlashcard.ts`

**Problem:**
Brak `credentials: "same-origin"` w request, co mogło powodować problemy z sesją.

**Rozwiązanie:**
Dodano `credentials: "same-origin"` do wszystkich fetch requestów:
```typescript
const response = await fetch(`/api/flashcards?${params}`, {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "same-origin", // ✅ Dodane
});
```

### 3. ✅ Dodano debug logging
**Lokalizacja:** `src/components/hooks/useFlashcards.ts`

Console.log w kluczowych miejscach aby śledzić flow:
- Request parameters
- Response status
- Error details
- Success data

## Kroki debugowania

### 1. Sprawdź konsolę przeglądarki
Otwórz DevTools (F12) i sprawdź zakładkę Console. Powinny pojawić się logi:

```
[useFlashcards] Fetching flashcards with params: page=1&limit=20&sort=created_at&order=desc
[useFlashcards] Response status: 200
[useFlashcards] Success! Received flashcards: {...}
```

### 2. Sprawdź Network tab
W DevTools > Network sprawdź:
- Czy request do `/api/flashcards` jest wysyłany
- Jaki status zwraca (200, 401, 500?)
- Co zawiera odpowiedź

### 3. Sprawdź czy Supabase działa
```bash
npx supabase status
```

Powinno pokazać:
```
API URL: http://127.0.0.1:15431
...
```

### 4. Sprawdź czy serwer dev działa
```bash
npm run dev
```

Serwer powinien działać na `http://localhost:4321`

### 5. Testuj endpoint bezpośrednio
W konsoli przeglądarki (gdy jesteś zalogowany):
```javascript
fetch('/api/flashcards?page=1&limit=20', {
  credentials: 'same-origin'
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

### 6. Sprawdź czy użytkownik jest zalogowany
W konsoli przeglądarki:
```javascript
// Sprawdź cookies
document.cookie

// Powinny być cookies od Supabase
```

## Typowe błędy i rozwiązania

### Error 401 Unauthorized
**Przyczyna:** Użytkownik nie jest zalogowany lub sesja wygasła

**Rozwiązanie:**
1. Wyloguj się i zaloguj ponownie
2. Sprawdź czy Supabase działa: `npx supabase status`
3. Sprawdź middleware w `src/middleware/index.ts`

### Error 500 Internal Server Error
**Przyczyna:** Błąd w serwerze lub bazie danych

**Rozwiązanie:**
1. Sprawdź terminal z `npm run dev` - powinny być logi błędów
2. Sprawdź czy migracje są zastosowane: `npx supabase migration list`
3. Sprawdź czy tabela `flashcards` istnieje w bazie

### Infinite loop / Performance issue
**Przyczyna:** useEffect z niewłaściwymi dependencies

**Rozwiązanie:**
Sprawdź czy useEffect w `MyFlashcardsView.tsx` nie ma `fetchFlashcards` w dependencies

### CORS errors
**Przyczyna:** Problem z credentials lub origin

**Rozwiązanie:**
Upewnij się że wszystkie fetch mają `credentials: "same-origin"`

## Checklist do weryfikacji

- [ ] Serwer dev działa (`npm run dev`)
- [ ] Supabase działa (`npx supabase status`)
- [ ] Użytkownik jest zalogowany
- [ ] Konsola nie pokazuje błędów
- [ ] Network tab pokazuje request do `/api/flashcards`
- [ ] Response status to 200
- [ ] Response zawiera `data` i `pagination`

## Kontakt i wsparcie

Jeśli problem nadal występuje:
1. Sprawdź wszystkie logi w konsoli
2. Sprawdź Network tab
3. Sprawdź terminal z serwerem
4. Zrób screenshot błędów
