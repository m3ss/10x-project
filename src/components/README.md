# Komponenty widoku generowania fiszek

Dokumentacja komponentów używanych w widoku `/generate` do generowania fiszek przez AI.

## Struktura komponentów

```
FlashcardGenerationView (główny kontener)
├── TextInputArea (pole wprowadzania tekstu)
├── ErrorNotification (komunikaty błędów/sukcesu)
├── SkeletonLoader (stan ładowania)
├── FlashcardList (lista fiszek)
│   └── FlashcardListItem (pojedyncza fiszka)
└── BulkSaveButton (przyciski zapisu)
```

## Komponenty

### FlashcardGenerationView
**Ścieżka:** `src/components/FlashcardGenerationView.tsx`

Główny komponent widoku zarządzający całym flow generowania i edycji fiszek.

**Odpowiedzialności:**
- Zarządzanie stanem lokalnym fiszek
- Koordynacja działania hooków (useGenerateFlashcards, useSaveFlashcards)
- Obsługa akcji użytkownika (generowanie, reset, akceptacja, edycja, odrzucenie)

**Hooki:**
- `useGenerateFlashcards()` - generowanie fiszek przez API
- `useSaveFlashcards()` - zapis fiszek do bazy

---

### TextInputArea
**Ścieżka:** `src/components/TextInputArea.tsx`

Pole tekstowe z walidacją długości tekstu (1000-10000 znaków).

**Props:**
- `value: string` - wartość pola
- `onChange: (value: string) => void` - callback zmiany wartości
- `placeholder?: string` - tekst placeholdera
- `disabled?: boolean` - czy pole jest wyłączone

**Walidacja:**
- Minimalna długość: 1000 znaków
- Maksymalna długość: 10000 znaków
- Wizualne wskazanie poprawności (kolory border)
- Dynamiczny licznik znaków
- Komunikaty o stanie walidacji

**Optymalizacje:**
- React.memo() - zapobiega niepotrzebnym re-renderom

---

### FlashcardList
**Ścieżka:** `src/components/FlashcardList.tsx`

Kontener dla listy fiszek ze statystykami.

**Props:**
- `flashcards: FlashcardProposalViewModel[]` - lista fiszek
- `onAccept: (index: number) => void` - callback akceptacji
- `onEdit: (index: number, front: string, back: string) => void` - callback edycji
- `onReject: (index: number) => void` - callback odrzucenia

**Funkcjonalności:**
- Wyświetlanie statystyk (wszystkie/zaakceptowane)
- Empty state gdy brak fiszek
- Semantyczny markup (role="list")

**Optymalizacje:**
- React.memo() - zapobiega niepotrzebnym re-renderom

---

### FlashcardListItem
**Ścieżka:** `src/components/FlashcardListItem.tsx`

Pojedyncza karta fiszki z trybem wyświetlania i edycji.

**Props:**
- `flashcard: FlashcardProposalViewModel` - dane fiszki
- `index: number` - indeks w liście
- `onAccept: (index: number) => void` - callback akceptacji
- `onEdit: (index: number, front: string, back: string) => void` - callback edycji
- `onReject: (index: number) => void` - callback odrzucenia

**Funkcjonalności:**
- **Tryb wyświetlania:** pokazuje front/back fiszki
- **Tryb edycji:** textarea z walidacją (front ≤200, back ≤500)
- **Statusy wizualne:** zaakceptowana, edytowana
- **Akcje:** Zatwierdź/Odznacz, Edytuj, Odrzuć
- Auto-akceptacja po zapisaniu edycji
- Zmiana source na "ai-edited" po edycji

**Walidacja w trybie edycji:**
- Front: max 200 znaków
- Back: max 500 znaków
- Licznik znaków z wizualizacją błędów
- Przycisk "Zapisz" aktywny tylko przy poprawnych danych

**Optymalizacje:**
- React.memo() - renderuje się tylko gdy props się zmienią
- useId() dla unikalnych ID elementów (accessibility)

---

### SkeletonLoader
**Ścieżka:** `src/components/SkeletonLoader.tsx`

Komponent wizualizacji ładowania (skeleton screens).

**Props:**
- `count?: number` - liczba szkieletów do wyświetlenia (domyślnie 5)

**Funkcjonalności:**
- Realistyczne szkielety imitujące strukturę kart fiszek
- Animacja pulse
- Dark mode support
- ARIA (role="status", aria-label)

**Optymalizacje:**
- React.memo() - zapobiega niepotrzebnym re-renderom

---

### ErrorNotification
**Ścieżka:** `src/components/ErrorNotification.tsx`

Uniwersalny komponent do wyświetlania powiadomień.

**Props:**
- `message: string` - treść komunikatu
- `type?: "error" | "warning" | "info"` - typ powiadomienia (domyślnie "error")
- `dismissible?: boolean` - czy można zamknąć (domyślnie false)
- `onDismiss?: () => void` - callback zamknięcia

**Typy powiadomień:**
- **error** - błędy (czerwony)
- **warning** - ostrzeżenia (pomarańczowy)
- **info** - informacje/sukces (niebieski)

**Funkcjonalności:**
- Różne kolory i ikony dla każdego typu
- Opcjonalne zamknięcie przez użytkownika
- ARIA (aria-live: assertive/polite)

**Optymalizacje:**
- React.memo() - zapobiega niepotrzebnym re-renderom

---

### BulkSaveButton
**Ścieżka:** `src/components/BulkSaveButton.tsx`

Przyciski do zbiorczego zapisu fiszek do bazy danych.

**Props:**
- `flashcards: FlashcardProposalViewModel[]` - lista fiszek
- `generationId: number | null` - ID generacji
- `isSaving: boolean` - czy trwa zapisywanie
- `onSaveAll: () => void` - callback zapisu wszystkich
- `onSaveAccepted: () => void` - callback zapisu zaakceptowanych

**Funkcjonalności:**
- Dwa przyciski akcji:
  - "Zapisz wszystkie" - wszystkie fiszki
  - "Zapisz zaakceptowane" - tylko zaakceptowane
- Wyświetlanie liczby fiszek do zapisu
- Stan ładowania z animowanym spinerem
- Walidacja: wyłączone gdy brak generationId

**Optymalizacje:**
- React.memo() - zapobiega niepotrzebnym re-renderom

---

## Hooki

### useGenerateFlashcards
**Ścieżka:** `src/components/hooks/useGenerateFlashcards.ts`

Hook do generowania fiszek przez API.

**Zwracane wartości:**
```typescript
{
  isLoading: boolean;          // stan ładowania
  error: string | null;        // komunikat błędu
  flashcards: FlashcardProposalViewModel[]; // wygenerowane fiszki
  generationId: number | null; // ID generacji
  generateFlashcards: (sourceText: string) => Promise<void>; // funkcja generowania
  resetFlashcards: () => void; // reset stanu
}
```

**API Endpoint:** `POST /api/generations`

**Walidacja:**
- Tekst źródłowy: 1000-10000 znaków
- Obsługa błędów 400, 500

---

### useSaveFlashcards
**Ścieżka:** `src/components/hooks/useSaveFlashcards.ts`

Hook do zapisu fiszek do bazy danych.

**Zwracane wartości:**
```typescript
{
  isSaving: boolean;           // stan zapisywania
  saveError: string | null;    // komunikat błędu
  saveSuccess: boolean;        // czy zapisano pomyślnie
  savedCount: number;          // liczba zapisanych fiszek
  saveFlashcards: (flashcards, generationId) => Promise<boolean>; // funkcja zapisu
  resetSaveState: () => void;  // reset stanu
}
```

**API Endpoint:** `POST /api/flashcards`

**Walidacja:**
- Front: niepuste, max 200 znaków
- Back: niepuste, max 500 znaków
- Source: "ai-full" | "ai-edited" | "manual"
- generation_id: wymagane dla AI, null dla manual

---

## Typy

### FlashcardProposalViewModel
```typescript
interface FlashcardProposalViewModel {
  front: string;
  back: string;
  source: "ai-full" | "ai-edited";
  accepted: boolean;  // czy użytkownik zaakceptował
  edited: boolean;    // czy użytkownik edytował
}
```

Rozszerzony model reprezentujący stan propozycji fiszki w UI.

---

## Optymalizacje performance

Wszystkie komponenty używają `React.memo()` do zapobiegania niepotrzebnym re-renderom:

```typescript
export const ComponentName = memo(function ComponentName(props) {
  // ...
});
```

Callbacki w głównym komponencie używają `useCallback()`:
```typescript
const handleAccept = useCallback((index: number) => {
  // ...
}, []);
```

---

## Responsywność

Komponenty są w pełni responsywne:

- **Mobile first:** przyciski pełnej szerokości
- **Breakpoint sm:** przyciski auto-width
- **Container:** max-w-4xl z padding
- **Flexbox/Grid:** automatyczne dostosowanie layoutu

Przykłady:
```tsx
// Przycisk pełnej szerokości na mobile, auto na desktop
<Button className="flex-1 sm:flex-none">

// Responsywne gap
<div className="flex gap-2">

// Container z paddingiem
<div className="container mx-auto max-w-4xl px-4 py-8">
```

---

## Dostępność (a11y)

Wszystkie komponenty implementują best practices ARIA:

- **role** attributes (status, alert, list, listitem)
- **aria-label** dla przycisków i sekcji
- **aria-live** (assertive/polite) dla dynamicznej treści
- **aria-describedby** dla powiązanego opisu
- **aria-invalid** dla niepoprawnych pól
- **aria-hidden** dla dekoracyjnych ikon
- **useId()** dla unikalnych ID (accessibility)

Przykłady:
```tsx
// Komunikat błędu
<div role="alert" aria-live="assertive">

// Loading state
<div role="status" aria-label="Ładowanie fiszek">

// Lista
<div role="list" aria-label="Lista propozycji fiszek">
```

---

## Dark mode

Wszystkie komponenty wspierają dark mode przez Tailwind `dark:` variant:

```tsx
<h1 className="text-neutral-900 dark:text-neutral-100">
<div className="bg-white dark:bg-neutral-950">
```

---

## Testowanie

### Scenariusze testowe

1. **Happy path:** generowanie → akceptacja → edycja → zapis
2. **Walidacja:** niepoprawna długość tekstu/pól
3. **Błędy API:** 400, 500
4. **Edge cases:** brak fiszek, wszystkie odrzucone
5. **Responsywność:** mobile, tablet, desktop
6. **Accessibility:** nawigacja klawiaturą, screen reader

### Uruchomienie
```bash
npm run dev
# Przejdź do http://localhost:4321/generate
```

---

## Best Practices

1. **Używaj TypeScript** - wszystkie komponenty są typowane
2. **Memoizuj komponenty** - używaj `React.memo()` i `useCallback()`
3. **Waliduj dane** - na frontendzie i backendzie
4. **Obsługuj błędy** - zawsze wyświetlaj komunikaty użytkownikowi
5. **Accessibility first** - implementuj ARIA attributes
6. **Mobile first** - projektuj najpierw dla mobile
7. **Dark mode** - wszystkie komponenty muszą wspierać dark mode
