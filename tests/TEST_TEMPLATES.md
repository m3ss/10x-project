# Szablony testów

> Gotowe do użycia szablony dla różnych typów testów jednostkowych.

## Spis treści

1. [Test serwisu](#test-serwisu)
2. [Test hooka React](#test-hooka-react)
3. [Test komponentu React](#test-komponentu-react)
4. [Test funkcji pomocniczej](#test-funkcji-pomocniczej)
5. [Mockowanie Supabase](#mockowanie-supabase)
6. [Mockowanie Fetch](#mockowanie-fetch)

---

## Test serwisu

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MyService } from '@/lib/my.service';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
  auth: {
    signInWithPassword: vi.fn(),
  },
} as unknown as SupabaseClient;

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    // Reset wszystkich mocków przed każdym testem
    vi.clearAllMocks();
    
    // Inicjalizuj serwis
    service = new MyService(mockSupabase);
  });

  describe('myMethod', () => {
    describe('when operation succeeds', () => {
      it('should return expected result', async () => {
        // Arrange
        const mockData = { id: 1, name: 'Test' };
        const mockFrom = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        };
        mockSupabase.from.mockReturnValue(mockFrom);

        // Act
        const result = await service.myMethod('test-id');

        // Assert
        expect(mockSupabase.from).toHaveBeenCalledWith('table_name');
        expect(mockFrom.eq).toHaveBeenCalledWith('id', 'test-id');
        expect(result).toEqual(mockData);
      });
    });

    describe('when operation fails', () => {
      it('should throw error', async () => {
        // Arrange
        const mockError = { message: 'Database error', code: 'DB_ERROR' };
        const mockFrom = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        };
        mockSupabase.from.mockReturnValue(mockFrom);

        // Act & Assert
        await expect(service.myMethod('test-id')).rejects.toThrow('Database error');
      });
    });
  });
});
```

---

## Test hooka React

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('useMyHook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with default values', () => {
      // Act
      const { result } = renderHook(() => useMyHook());

      // Assert
      expect(result.current.data).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('fetchData', () => {
    it('should fetch and set data', async () => {
      // Arrange
      const mockData = [{ id: 1, name: 'Test' }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockData }),
      });

      const { result } = renderHook(() => useMyHook());

      // Act
      await act(async () => {
        await result.current.fetchData();
      });

      // Assert
      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should set error on fetch failure', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Error occurred' }),
      });

      const { result } = renderHook(() => useMyHook());

      // Act
      await act(async () => {
        await result.current.fetchData();
      });

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBe('Error occurred');
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('updateItem', () => {
    it('should update item in local state', async () => {
      // Arrange
      const initialData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: initialData }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { id: 1, name: 'Updated' } }),
        });

      const { result } = renderHook(() => useMyHook());

      // Fetch initial data
      await act(async () => {
        await result.current.fetchData();
      });

      // Act - update item
      await act(async () => {
        await result.current.updateItem(1, 'Updated');
      });

      // Assert
      await waitFor(() => {
        expect(result.current.data[0].name).toBe('Updated');
        expect(result.current.data[1].name).toBe('Item 2');
      });
    });
  });
});
```

---

## Test komponentu React

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from '../setup/test-utils';
import { MyComponent } from '@/components/MyComponent';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render component with initial state', () => {
      // Act
      renderWithProviders(<MyComponent />);

      // Assert
      expect(screen.getByRole('heading', { name: /my component/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('should render loading state', () => {
      // Arrange
      renderWithProviders(<MyComponent isLoading={true} />);

      // Assert
      expect(screen.getByRole('button', { name: /loading/i })).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should render error message', () => {
      // Arrange
      const errorMessage = 'Something went wrong';
      
      // Act
      renderWithProviders(<MyComponent error={errorMessage} />);

      // Assert
      expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
    });
  });

  describe('user interactions', () => {
    it('should update input value on change', async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithProviders(<MyComponent />);
      const input = screen.getByRole('textbox', { name: /email/i });

      // Act
      await user.type(input, 'test@example.com');

      // Assert
      expect(input).toHaveValue('test@example.com');
    });

    it('should call onSubmit when form is submitted', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      renderWithProviders(<MyComponent onSubmit={mockOnSubmit} />);
      
      const input = screen.getByRole('textbox', { name: /email/i });
      const button = screen.getByRole('button', { name: /submit/i });

      // Act
      await user.type(input, 'test@example.com');
      await user.click(button);

      // Assert
      expect(mockOnSubmit).toHaveBeenCalledWith('test@example.com');
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it('should show validation error for invalid input', async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithProviders(<MyComponent />);
      
      const input = screen.getByRole('textbox', { name: /email/i });
      const button = screen.getByRole('button', { name: /submit/i });

      // Act
      await user.type(input, 'invalid-email');
      await user.click(button);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/nieprawidłowy format email/i)).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('API integration', () => {
    it('should fetch and display data on mount', async () => {
      // Arrange
      const mockData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockData }),
      });

      // Act
      renderWithProviders(<MyComponent />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
      });
    });

    it('should show error when API fails', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'API Error' }),
      });

      // Act
      renderWithProviders(<MyComponent />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/api error/i)).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      // Act
      renderWithProviders(<MyComponent />);

      // Assert
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toHaveAccessibleName();
    });

    it('should be keyboard navigable', async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithProviders(<MyComponent />);

      // Act - Tab through elements
      await user.tab();
      expect(screen.getByRole('textbox')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('button')).toHaveFocus();
    });
  });
});
```

---

## Test funkcji pomocniczej

```typescript
import { describe, it, expect } from 'vitest';
import { myUtilFunction } from '@/lib/utils';

describe('myUtilFunction', () => {
  describe('when input is valid', () => {
    it('should return expected result', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = myUtilFunction(input);

      // Assert
      expect(result).toBe('expected');
    });

    it('should handle edge case: empty string', () => {
      // Arrange
      const input = '';

      // Act
      const result = myUtilFunction(input);

      // Assert
      expect(result).toBe('');
    });

    it('should handle edge case: very long string', () => {
      // Arrange
      const input = 'a'.repeat(10000);

      // Act
      const result = myUtilFunction(input);

      // Assert
      expect(result).toHaveLength(10000);
    });
  });

  describe('when input is invalid', () => {
    it('should throw error for null', () => {
      // Act & Assert
      expect(() => myUtilFunction(null)).toThrow('Input cannot be null');
    });

    it('should throw error for undefined', () => {
      // Act & Assert
      expect(() => myUtilFunction(undefined)).toThrow('Input is required');
    });
  });

  describe('with different data types', () => {
    it('should handle numbers', () => {
      // Arrange
      const input = 123;

      // Act
      const result = myUtilFunction(input);

      // Assert
      expect(result).toBe('123');
    });

    it('should handle arrays', () => {
      // Arrange
      const input = [1, 2, 3];

      // Act
      const result = myUtilFunction(input);

      // Assert
      expect(result).toEqual([1, 2, 3]);
    });
  });
});
```

---

## Mockowanie Supabase

### Mock podstawowy

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';

const mockSupabase = {
  from: vi.fn(),
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
  },
} as unknown as SupabaseClient;
```

### Mock operacji SELECT

```typescript
const mockFrom = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
};

mockSupabase.from.mockReturnValue(mockFrom);
```

### Mock operacji INSERT

```typescript
const mockFrom = {
  insert: vi.fn().mockReturnThis(),
  select: vi.fn().mockResolvedValue({ data: [mockInsertedData], error: null }),
};

mockSupabase.from.mockReturnValue(mockFrom);
```

### Mock operacji UPDATE

```typescript
const mockFrom = {
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: mockUpdatedData, error: null }),
};

mockSupabase.from.mockReturnValue(mockFrom);
```

### Mock operacji DELETE

```typescript
const mockFrom = {
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockResolvedValue({ error: null }),
};

mockSupabase.from.mockReturnValue(mockFrom);
```

### Mock Auth operations

```typescript
// Login
mockSupabase.auth.signInWithPassword.mockResolvedValue({
  data: { user: mockUser, session: mockSession },
  error: null,
});

// Register
mockSupabase.auth.signUp.mockResolvedValue({
  data: { user: mockUser, session: null },
  error: null,
});

// Logout
mockSupabase.auth.signOut.mockResolvedValue({ error: null });

// Get User
mockSupabase.auth.getUser.mockResolvedValue({
  data: { user: mockUser },
  error: null,
});
```

### Mock błędów Supabase

```typescript
// Database error
const mockFrom = {
  select: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({
    data: null,
    error: { message: 'Database error', code: 'PGRST116' },
  }),
};

// Auth error
mockSupabase.auth.signInWithPassword.mockResolvedValue({
  data: { user: null, session: null },
  error: { message: 'Invalid login credentials', name: 'AuthError', status: 400 },
});
```

---

## Mockowanie Fetch

### Mock podstawowy

```typescript
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
});
```

### Mock sukcesu

```typescript
mockFetch.mockResolvedValueOnce({
  ok: true,
  status: 200,
  json: async () => ({ data: mockData }),
});
```

### Mock błędu API

```typescript
mockFetch.mockResolvedValueOnce({
  ok: false,
  status: 400,
  json: async () => ({ message: 'Bad Request', error: 'VALIDATION_ERROR' }),
});
```

### Mock błędu sieci

```typescript
mockFetch.mockRejectedValueOnce(new Error('Network error'));
```

### Mock wielu wywołań

```typescript
mockFetch
  .mockResolvedValueOnce({
    ok: true,
    json: async () => ({ data: firstCallData }),
  })
  .mockResolvedValueOnce({
    ok: true,
    json: async () => ({ data: secondCallData }),
  })
  .mockRejectedValueOnce(new Error('Third call fails'));
```

### Weryfikacja wywołań fetch

```typescript
// Sprawdź czy został wywołany
expect(mockFetch).toHaveBeenCalled();

// Sprawdź liczbę wywołań
expect(mockFetch).toHaveBeenCalledTimes(1);

// Sprawdź parametry wywołania
expect(mockFetch).toHaveBeenCalledWith('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ key: 'value' }),
  credentials: 'same-origin',
});

// Sprawdź pierwszy argument pierwszego wywołania
expect(mockFetch.mock.calls[0][0]).toBe('/api/endpoint');

// Sprawdź drugi argument (opcje)
expect(mockFetch.mock.calls[0][1]).toEqual({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
});
```

---

## Mockowanie innych zależności

### Mock window.location

```typescript
const mockLocationReload = vi.fn();
const mockLocationAssign = vi.fn();

Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    href: 'http://localhost:3000',
    reload: mockLocationReload,
    assign: mockLocationAssign,
  },
});
```

### Mock console

```typescript
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

// Przywróć oryginalne po testach
afterAll(() => {
  mockConsoleLog.mockRestore();
  mockConsoleError.mockRestore();
  mockConsoleWarn.mockRestore();
});
```

### Mock Date

```typescript
const mockDate = new Date('2024-01-15T12:00:00Z');
vi.setSystemTime(mockDate);

// Przywróć po teście
afterAll(() => {
  vi.useRealTimers();
});
```

### Mock crypto (dla Node.js)

```typescript
import crypto from 'crypto';

vi.mock('crypto', () => ({
  default: {
    createHash: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn(() => 'mocked-hash'),
    })),
  },
}));
```

---

## Wzorce testowania

### Test z timeout

```typescript
it('should timeout after specified duration', async () => {
  vi.useFakeTimers();

  const promise = myAsyncFunction();
  
  vi.advanceTimersByTime(5000);
  
  await expect(promise).rejects.toThrow('Timeout');
  
  vi.useRealTimers();
});
```

### Test retry logic

```typescript
it('should retry on failure', async () => {
  const mockFn = vi.fn()
    .mockRejectedValueOnce(new Error('First attempt'))
    .mockRejectedValueOnce(new Error('Second attempt'))
    .mockResolvedValueOnce({ success: true });

  const result = await retryFunction(mockFn, { maxRetries: 3 });

  expect(mockFn).toHaveBeenCalledTimes(3);
  expect(result).toEqual({ success: true });
});
```

### Test debounce/throttle

```typescript
it('should debounce function calls', async () => {
  vi.useFakeTimers();
  
  const mockFn = vi.fn();
  const debouncedFn = debounce(mockFn, 500);

  debouncedFn('call 1');
  debouncedFn('call 2');
  debouncedFn('call 3');

  expect(mockFn).not.toHaveBeenCalled();

  vi.advanceTimersByTime(500);

  expect(mockFn).toHaveBeenCalledTimes(1);
  expect(mockFn).toHaveBeenCalledWith('call 3');

  vi.useRealTimers();
});
```

---

## Best Practices

### 1. Cleanup mocków

```typescript
beforeEach(() => {
  vi.clearAllMocks();  // Clear call history
  // lub
  vi.resetAllMocks();  // Clear call history + reset implementation
  // lub
  vi.restoreAllMocks(); // Restore original implementation
});
```

### 2. Grupowanie testów

```typescript
describe('Component', () => {
  describe('Feature A', () => {
    describe('when condition X', () => {
      it('should do Y');
    });
  });
});
```

### 3. Setup/Teardown

```typescript
describe('MyTests', () => {
  beforeAll(() => {
    // Runs once before all tests
  });

  beforeEach(() => {
    // Runs before each test
  });

  afterEach(() => {
    // Runs after each test
  });

  afterAll(() => {
    // Runs once after all tests
  });
});
```

### 4. Parametryczne testy

```typescript
describe.each([
  { input: 'test@example.com', expected: true },
  { input: 'invalid', expected: false },
  { input: '', expected: false },
])('isValidEmail($input)', ({ input, expected }) => {
  it(`should return ${expected}`, () => {
    expect(isValidEmail(input)).toBe(expected);
  });
});
```

### 5. Snapshot testing (używaj ostrożnie)

```typescript
it('should match snapshot', () => {
  const component = renderWithProviders(<MyComponent />);
  expect(component.container).toMatchSnapshot();
});

// Lub inline snapshot (preferowane)
it('should match inline snapshot', () => {
  const result = myFunction('input');
  expect(result).toMatchInlineSnapshot(`"expected output"`);
});
```

---

## Debugowanie testów

### 1. screen.debug()

```typescript
it('should render', () => {
  renderWithProviders(<MyComponent />);
  
  screen.debug(); // Print entire DOM
  screen.debug(screen.getByRole('button')); // Print specific element
});
```

### 2. logTestingPlaygroundURL

```typescript
import { logTestingPlaygroundURL } from '@testing-library/react';

it('should render', () => {
  const { container } = renderWithProviders(<MyComponent />);
  
  logTestingPlaygroundURL(container); // Get query suggestions
});
```

### 3. Test.only / Test.skip

```typescript
it.only('focus on this test', () => {
  // Only this test will run
});

it.skip('skip this test', () => {
  // This test will be skipped
});
```

### 4. Increase timeout

```typescript
it('slow test', async () => {
  // Test code
}, 10000); // 10 seconds timeout
```

---

**Happy Testing!** 🧪
