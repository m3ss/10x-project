# Services Documentation

This directory contains business logic services used throughout the application.

## OpenRouter Service

`openrouter.service.ts` provides integration with the OpenRouter API for LLM chat completions.

### Features

- ✅ Type-safe API interface
- ✅ Structured JSON responses with schema validation
- ✅ Configurable system and user messages
- ✅ Model parameter configuration (temperature, top_p, etc.)
- ✅ Automatic retry logic with exponential backoff
- ✅ Comprehensive error handling
- ✅ Request timeout support
- ✅ Full TypeScript support

### Configuration

Set the following environment variables:

```bash
OPENROUTER_API_KEY=your-api-key-here
OPENROUTER_MODEL=openai/gpt-4-turbo  # Optional, defaults to gpt-4-turbo
AI_SERVICE_TIMEOUT=60000              # Optional, defaults to 60 seconds
```

### Usage Example

#### Basic Text Response

```typescript
import { OpenRouterService } from "./openrouter.service";

const service = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  defaultModel: "openai/gpt-4-turbo",
  timeout: 60000,
  maxRetries: 3,
});

// Set system context
service.setSystemMessage("You are a helpful assistant specialized in education.");

// Send message and get response
const response = await service.sendChatMessage("Explain quantum physics in simple terms.");
console.log(response);
```

#### Structured JSON Response

```typescript
// Define your expected response structure
interface QuizResponse {
  questions: Array<{
    question: string;
    answer: string;
    difficulty: "easy" | "medium" | "hard";
  }>;
}

// Configure JSON schema
service.setResponseFormat({
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          answer: { type: "string" },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
        },
        required: ["question", "answer", "difficulty"],
      },
    },
  },
  required: ["questions"],
});

// Send message with typed response
const quiz = await service.sendChatMessage<QuizResponse>(
  "Generate 3 quiz questions about JavaScript"
);

quiz.questions.forEach((q) => {
  console.log(`Q: ${q.question}`);
  console.log(`A: ${q.answer}`);
  console.log(`Difficulty: ${q.difficulty}\n`);
});
```

#### Custom Model Configuration

```typescript
// Change model and parameters
service.setModel("anthropic/claude-3-opus", {
  temperature: 0.8,
  top_p: 0.95,
  frequency_penalty: 0.1,
  presence_penalty: 0.1,
});

const response = await service.sendChatMessage("Tell me a creative story.");
```

#### Error Handling

```typescript
import { OpenRouterError } from "./openrouter.service";

try {
  const response = await service.sendChatMessage("Hello!");
  console.log(response);
} catch (error) {
  if (error instanceof OpenRouterError) {
    switch (error.code) {
      case "AUTHENTICATION_ERROR":
        console.error("Invalid API key");
        break;
      case "RATE_LIMIT_ERROR":
        console.error("Rate limit exceeded, try again later");
        break;
      case "TIMEOUT_ERROR":
        console.error("Request timed out");
        break;
      case "NETWORK_ERROR":
        console.error("Network connection failed");
        break;
      default:
        console.error(`Error: ${error.message}`);
    }

    // Access additional error details
    console.log("Status Code:", error.statusCode);
    console.log("Error Code:", error.code);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

### API Reference

#### Constructor Options

```typescript
interface OpenRouterServiceConfig {
  apiKey: string; // Required: OpenRouter API key
  apiUrl?: string; // Optional: API endpoint URL
  defaultModel?: string; // Optional: Default model name
  defaultModelParameters?: ModelParameters; // Optional: Default model parameters
  timeout?: number; // Optional: Request timeout in ms (default: 60000)
  maxRetries?: number; // Optional: Max retry attempts (default: 3)
}
```

#### Public Methods

| Method                                   | Description                                     |
| ---------------------------------------- | ----------------------------------------------- |
| `setSystemMessage(message: string)`      | Sets the system message for chat context        |
| `setUserMessage(message: string)`        | Sets the user message for the next request      |
| `setResponseFormat(schema: JSONSchema)`  | Configures JSON schema for structured responses |
| `setModel(name: string, params?)`        | Sets the model and optional parameters          |
| `sendChatMessage<T>(message?: string)`   | Sends chat message and returns response         |
| `resetMessages()`                        | Resets current message context                  |
| `resetAll()`                             | Resets all configuration to defaults            |

#### Error Codes

| Code                     | Description                                |
| ------------------------ | ------------------------------------------ |
| `AUTHENTICATION_ERROR`   | Invalid or missing API key                 |
| `RATE_LIMIT_ERROR`       | API rate limit exceeded                    |
| `TIMEOUT_ERROR`          | Request exceeded timeout duration          |
| `NETWORK_ERROR`          | Network connection failed                  |
| `INVALID_RESPONSE`       | API returned invalid or unexpected data    |
| `JSON_PARSE_ERROR`       | Failed to parse JSON response              |
| `MAX_RETRIES_EXCEEDED`   | All retry attempts failed                  |
| `UNKNOWN_ERROR`          | Unexpected error occurred                  |

---

## Generation Service

`generation.service.ts` handles flashcard generation using AI.

### Features

- ✅ Integrated with OpenRouter Service for AI generation
- ✅ Automatic fallback to mock mode for development
- ✅ Structured flashcard output (3-7 flashcards per generation)
- ✅ Metadata tracking (duration, token count, source hash)
- ✅ Error logging to database
- ✅ Retry logic for transient failures

### Configuration

Set these environment variables to use real AI:

```bash
AI_SERVICE_PROVIDER=openrouter        # Use "openrouter" for real AI, "mock" for development
OPENROUTER_API_KEY=your-api-key
OPENROUTER_MODEL=openai/gpt-4-turbo  # Optional, defaults to openai/gpt-4-turbo
OPENROUTER_TEMPERATURE=0.7            # Optional, defaults to 0.7 (range: 0-2)
OPENROUTER_TOP_P=0.9                  # Optional, defaults to 0.9 (range: 0-1)
AI_SERVICE_TIMEOUT=60000              # Optional, defaults to 60000ms
```

### Usage

```typescript
import { GenerationService } from "./generation.service";
import { createClient } from "../db/supabase.client";

// Create service instance
const supabase = createClient(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY);
const generationService = new GenerationService(supabase);

// Generate flashcards
const result = await generationService.generateFlashcards(
  sourceText, // 1000-10000 characters
  userId // Authenticated user ID
);

console.log("Generation ID:", result.generation_id);
console.log("Flashcards:", result.flashcards_proposals);
console.log("Count:", result.generated_count);
```

### How It Works

1. **AI Generation**: Calls OpenRouter API (or mock) to generate flashcards
2. **Validation**: Validates response structure and flashcard count (3-7)
3. **Metadata**: Calculates hash, duration, and other metadata
4. **Database**: Saves generation record with metadata
5. **Error Handling**: Logs any errors to `generation_error_logs` table

### Flashcard Quality Guidelines

The AI is prompted to create flashcards that:

- Focus on key concepts, definitions, and important facts
- Ask clear, specific questions (max 200 characters)
- Provide concise, accurate answers (max 500 characters)
- Avoid overly complex or compound questions
- Cover different aspects of the material
- Are suitable for spaced repetition learning

---

## Flashcard Service

`flashcard.service.ts` handles CRUD operations for flashcards.

### Usage

```typescript
import { FlashcardService } from "./flashcard.service";

const flashcardService = new FlashcardService(supabase);

// Create flashcards
const created = await flashcardService.createFlashcards(
  [
    {
      front: "What is TypeScript?",
      back: "A typed superset of JavaScript",
      source: "ai-full",
      generation_id: 123,
    },
  ],
  userId
);
```

### Validation Rules

- `front`: Required, max 200 characters
- `back`: Required, max 500 characters
- `source`: Must be "ai-full", "ai-edited", or "manual"
- `generation_id`: Required for AI sources, null for manual

---

## Best Practices

### 1. Error Handling

Always wrap service calls in try-catch blocks and handle specific error types:

```typescript
try {
  const result = await service.someMethod();
} catch (error) {
  if (error instanceof OpenRouterError) {
    // Handle OpenRouter-specific errors
  } else {
    // Handle generic errors
  }
}
```

### 2. Service Initialization

Initialize services once and reuse them:

```typescript
// ✅ Good - reuse service instance
const service = new OpenRouterService(config);
const result1 = await service.sendChatMessage("Message 1");
const result2 = await service.sendChatMessage("Message 2");

// ❌ Bad - creating new instance for each call
const result1 = await new OpenRouterService(config).sendChatMessage("Message 1");
const result2 = await new OpenRouterService(config).sendChatMessage("Message 2");
```

### 3. Environment Variables

Always validate environment variables before using them:

```typescript
const apiKey = import.meta.env.OPENROUTER_API_KEY;
if (!apiKey) {
  throw new Error("OPENROUTER_API_KEY is required");
}
```

### 4. Timeouts

Set appropriate timeouts for different operations:

- Quick responses: 10-30 seconds
- Complex generation: 60-120 seconds
- Adjust based on model and task complexity

### 5. Logging

Services include console logging for development. In production:

- Use proper logging framework
- Avoid logging sensitive data (API keys, user data)
- Log performance metrics for monitoring
