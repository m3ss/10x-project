Frontend - Astro z React dla komponentów interaktywnych:

- Astro 5 pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript
- React 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI

Backend - Supabase jako kompleksowe rozwiązanie backendowe:

- Zapewnia bazę danych PostgreSQL
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autentykację użytkowników

AI - Komunikacja z modelami przez usługę Openrouter.ai:

- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wiele innych), które pozwolą nam znaleźć rozwiązanie zapewniające wysoką efektywność i niskie koszta
- Pozwala na ustawianie limitów finansowych na klucze API

Testowanie - Kompleksowe pokrycie testami na różnych poziomach:

**Testy jednostkowe i integracyjne:**
- Vitest - szybki, nowoczesny framework testowy z natywnym wsparciem dla ESM i TypeScript
- React Testing Library - testowanie komponentów React z perspektywy użytkownika
- MSW (Mock Service Worker) - mockowanie wywołań API w testach integracyjnych
- Supabase Test Client - izolowane testowanie integracji z bazą danych
- Pokrycie kodu minimum 80%, funkcje krytyczne 100%

**Testy E2E:**
- Playwright - cross-browser testing z auto-waiting, retry mechanisms i możliwością nagrywania sesji
- Testowanie pełnych ścieżek użytkownika (rejestracja, generowanie fiszek, zarządzanie kontem)
- Wsparcie dla desktop, tablet i mobile
- Screenshots i video recording dla debugowania

CI/CD i Hosting:

- Github Actions do tworzenia pipeline'ów CI/CD
- Automatyczne uruchamianie testów przy każdym pull request
- DigitalOcean do hostowania aplikacji za pośrednictwem obrazu docker
