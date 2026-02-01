/**
 * OpenRouter Service - Integration with OpenRouter API for LLM chat completions
 *
 * This service provides a typed interface for communicating with OpenRouter API,
 * supporting structured JSON responses, custom system/user messages, and model configuration.
 *
 * @example Basic usage with string response
 * ```typescript
 * const service = new OpenRouterService({
 *   apiKey: import.meta.env.OPENROUTER_API_KEY,
 *   defaultModel: "openai/gpt-4-turbo",
 * });
 *
 * service.setSystemMessage("You are a helpful assistant.");
 * const response = await service.sendChatMessage("Hello!");
 * console.log(response); // AI response as string
 * ```
 *
 * @example Usage with structured JSON response
 * ```typescript
 * const service = new OpenRouterService({
 *   apiKey: import.meta.env.OPENROUTER_API_KEY,
 * });
 *
 * service.setSystemMessage("Generate flashcards from text.");
 * service.setResponseFormat({
 *   type: "object",
 *   properties: {
 *     flashcards: {
 *       type: "array",
 *       items: {
 *         type: "object",
 *         properties: {
 *           front: { type: "string" },
 *           back: { type: "string" },
 *         },
 *       },
 *     },
 *   },
 * });
 *
 * interface FlashcardResponse {
 *   flashcards: Array<{ front: string; back: string }>;
 * }
 *
 * const result = await service.sendChatMessage<FlashcardResponse>(
 *   "Generate flashcards from: [text content]"
 * );
 * console.log(result.flashcards);
 * ```
 *
 * @example Error handling
 * ```typescript
 * try {
 *   const response = await service.sendChatMessage("Hello!");
 * } catch (error) {
 *   if (error instanceof OpenRouterError) {
 *     console.error(`Error [${error.code}]:`, error.message);
 *     if (error.statusCode === 401) {
 *       // Handle authentication error
 *     }
 *   }
 * }
 * ```
 */

/**
 * Parameters for configuring the LLM model behavior
 */
export interface ModelParameters {
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

/**
 * JSON Schema definition for structured output
 */
export interface JSONSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
  [key: string]: unknown;
}

/**
 * Message format for OpenRouter chat API
 */
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Request payload structure for OpenRouter API
 */
interface RequestPayload {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  response_format?: {
    type: "json_object";
  };
}

/**
 * Response structure from OpenRouter API
 */
interface ApiResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Configuration options for OpenRouterService initialization
 */
export interface OpenRouterServiceConfig {
  apiKey: string;
  apiUrl?: string;
  defaultModel?: string;
  defaultModelParameters?: ModelParameters;
  timeout?: number;
  maxRetries?: number;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  apiUrl: "https://openrouter.ai/api/v1/chat/completions",
  defaultModel: "openai/gpt-4-turbo",
  timeout: 60000, // 60 seconds
  maxRetries: 3,
  defaultModelParameters: {
    temperature: 0.7,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
  },
} as const;

/**
 * Custom error class for OpenRouter API errors
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

/**
 * OpenRouter Service
 *
 * Handles communication with OpenRouter API for LLM chat completions.
 * Supports structured JSON responses, configurable models, and retry logic.
 */
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  private currentModel: string;
  private currentModelParameters: ModelParameters;
  private currentSystemMessage: string | null = null;
  private currentUserMessage: string | null = null;
  private currentResponseFormat: JSONSchema | null = null;
  private baseSystemMessage: string | null = null;

  /**
   * Creates an instance of OpenRouterService
   *
   * @param config - Configuration options for the service
   * @throws Error if API key is not provided
   */
  constructor(config: OpenRouterServiceConfig) {
    // Validate required configuration
    if (!config.apiKey || config.apiKey.trim().length === 0) {
      throw new Error("OpenRouter API key is required");
    }

    // Initialize configuration
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl || DEFAULT_CONFIG.apiUrl;
    this.timeout = config.timeout || DEFAULT_CONFIG.timeout;
    this.maxRetries = config.maxRetries || DEFAULT_CONFIG.maxRetries;
    this.currentModel = config.defaultModel || DEFAULT_CONFIG.defaultModel;
    this.currentModelParameters = {
      ...DEFAULT_CONFIG.defaultModelParameters,
      ...config.defaultModelParameters,
    };

    console.log(
      `[OpenRouterService] Initialized with model: ${this.currentModel}, ` +
        `timeout: ${this.timeout}ms, maxRetries: ${this.maxRetries}`
    );
  }

  /**
   * Sets the system message for chat context
   *
   * @param message - System message to set
   */
  setSystemMessage(message: string): void {
    if (!message || message.trim().length === 0) {
      throw new Error("System message cannot be empty");
    }
    this.baseSystemMessage = message.trim();
    this.updateSystemMessage();
    console.log("[OpenRouterService] System message set");
  }

  /**
   * Sets the user message for the next chat request
   *
   * @param message - User message to set
   */
  setUserMessage(message: string): void {
    if (!message || message.trim().length === 0) {
      throw new Error("User message cannot be empty");
    }
    this.currentUserMessage = message.trim();
    console.log("[OpenRouterService] User message set");
  }

  /**
   * Configures the response format with a JSON schema
   * Note: The schema is communicated to the model via the system message
   * since OpenRouter doesn't support inline schema validation
   *
   * @param schema - JSON schema for structured output
   */
  setResponseFormat(schema: JSONSchema): void {
    if (!schema || typeof schema !== "object") {
      throw new Error("Invalid JSON schema");
    }
    this.currentResponseFormat = schema;
    this.updateSystemMessage();
    console.log("[OpenRouterService] Response format configured");
  }

  /**
   * Updates the system message to include JSON schema instructions
   * @private
   */
  private updateSystemMessage(): void {
    if (!this.baseSystemMessage) {
      this.currentSystemMessage = null;
      return;
    }

    let message = this.baseSystemMessage;

    if (this.currentResponseFormat) {
      message += `\n\nCRITICAL: Respond with actual JSON DATA, not a schema definition. Your response must be valid JSON following this structure (but with real values, not schema syntax):\n\n`;

      // Provide example structure
      if (this.currentResponseFormat.properties?.flashcards) {
        message += `Example format:\n{\n  "flashcards": [\n    {\n      "front": "actual question text here",\n      "back": "actual answer text here"\n    },\n    {\n      "front": "another question",\n      "back": "another answer"\n    }\n  ]\n}\n\nDo NOT respond with type definitions, schema, or metadata. Only actual data.`;
      } else {
        message += JSON.stringify(this.currentResponseFormat, null, 2);
      }
    }

    this.currentSystemMessage = message;
  }

  /**
   * Sets the model and its parameters
   *
   * @param name - Model name (e.g., "openai/gpt-4-turbo")
   * @param parameters - Optional model parameters
   */
  setModel(name: string, parameters?: ModelParameters): void {
    if (!name || name.trim().length === 0) {
      throw new Error("Model name cannot be empty");
    }

    this.currentModel = name.trim();

    if (parameters) {
      this.currentModelParameters = {
        ...this.currentModelParameters,
        ...parameters,
      };
    }

    console.log(`[OpenRouterService] Model set to: ${this.currentModel}`);
  }

  /**
   * Builds the request payload for OpenRouter API
   *
   * @returns Constructed request payload
   * @throws Error if required messages are not set
   */
  private buildRequestPayload(): RequestPayload {
    // Validate required data
    if (!this.currentUserMessage) {
      throw new Error("User message must be set before sending chat request");
    }

    // Build messages array
    const messages: ChatMessage[] = [];

    if (this.currentSystemMessage) {
      messages.push({
        role: "system",
        content: this.currentSystemMessage,
      });
    }

    messages.push({
      role: "user",
      content: this.currentUserMessage,
    });

    // Build base payload
    const payload: RequestPayload = {
      model: this.currentModel,
      messages,
      ...this.currentModelParameters,
    };

    // Add response format if configured
    // Note: OpenRouter uses type: "json_object" to enable JSON mode
    // The schema is communicated via the system/user messages
    if (this.currentResponseFormat) {
      payload.response_format = {
        type: "json_object",
      };
    }

    return payload;
  }

  /**
   * Executes an HTTP request to OpenRouter API
   *
   * @param payload - Request payload
   * @returns API response
   * @throws OpenRouterError for API errors
   */
  private async executeRequest(payload: RequestPayload): Promise<ApiResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      console.log(`[OpenRouterService] Sending request to ${this.apiUrl} with model ${payload.model}`);

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": "https://your-app-url.com", // Optional: replace with actual URL
          "X-Title": "Flashcard Generator", // Optional: app title
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = `API request failed with status ${response.status}`;
        let errorCode = "API_ERROR";

        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.error?.message || errorMessage;
          errorCode = errorJson.error?.code || errorCode;
        } catch {
          // If error body is not JSON, use raw text
          errorMessage = errorBody || errorMessage;
        }

        // Handle specific error types
        if (response.status === 401) {
          throw new OpenRouterError("Authentication failed - invalid API key", "AUTHENTICATION_ERROR", 401, errorBody);
        }

        if (response.status === 429) {
          throw new OpenRouterError("Rate limit exceeded", "RATE_LIMIT_ERROR", 429, errorBody);
        }

        throw new OpenRouterError(errorMessage, errorCode, response.status, errorBody);
      }

      // Parse successful response
      const data: ApiResponse = await response.json();

      // Validate response structure
      if (!data.choices || data.choices.length === 0) {
        throw new OpenRouterError("Invalid API response - no choices returned", "INVALID_RESPONSE", undefined, data);
      }

      console.log(`[OpenRouterService] Request successful, tokens used: ${data.usage?.total_tokens || "N/A"}`);

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort/timeout
      if (error instanceof Error && error.name === "AbortError") {
        throw new OpenRouterError(`Request timeout after ${this.timeout}ms`, "TIMEOUT_ERROR");
      }

      // Handle network errors
      if (error instanceof TypeError) {
        throw new OpenRouterError(`Network error: ${error.message}`, "NETWORK_ERROR");
      }

      // Re-throw OpenRouterError as-is
      if (error instanceof OpenRouterError) {
        throw error;
      }

      // Wrap unknown errors
      throw new OpenRouterError(error instanceof Error ? error.message : "Unknown error occurred", "UNKNOWN_ERROR");
    }
  }

  /**
   * Executes request with retry logic for transient failures
   *
   * @param payload - Request payload
   * @returns API response
   * @throws OpenRouterError after all retries are exhausted
   */
  private async executeRequestWithRetry(payload: RequestPayload): Promise<ApiResponse> {
    let lastError: OpenRouterError | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[OpenRouterService] Request attempt ${attempt}/${this.maxRetries}`);
        return await this.executeRequest(payload);
      } catch (error) {
        lastError =
          error instanceof OpenRouterError
            ? error
            : new OpenRouterError(error instanceof Error ? error.message : "Unknown error", "UNKNOWN_ERROR");

        console.error(`[OpenRouterService] Attempt ${attempt} failed: ${lastError.message}`);

        // Don't retry on authentication errors
        if (lastError.code === "AUTHENTICATION_ERROR") {
          throw lastError;
        }

        // Don't retry on timeout errors (they're already long enough)
        if (lastError.code === "TIMEOUT_ERROR") {
          throw lastError;
        }

        // Wait before retrying (except on last attempt)
        if (attempt < this.maxRetries) {
          // Exponential backoff: 1s, 2s, 4s, etc.
          const delay = 1000 * Math.pow(2, attempt - 1);
          console.log(`[OpenRouterService] Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new OpenRouterError(
      `Request failed after ${this.maxRetries} attempts: ${lastError?.message}`,
      "MAX_RETRIES_EXCEEDED",
      lastError?.statusCode,
      lastError?.response
    );
  }

  /**
   * Sends a chat message and returns the response
   *
   * @param userMessage - Optional user message (if not set via setUserMessage)
   * @returns Parsed response content
   * @throws OpenRouterError if request fails
   */
  async sendChatMessage<T = string>(userMessage?: string): Promise<T> {
    // Set user message if provided
    if (userMessage) {
      this.setUserMessage(userMessage);
    }

    // Build and execute request
    const payload = this.buildRequestPayload();
    const response = await this.executeRequestWithRetry(payload);

    // Extract content from response
    const content = response.choices[0].message.content;

    // Parse JSON if response format is configured
    if (this.currentResponseFormat) {
      try {
        return JSON.parse(content) as T;
      } catch (error) {
        throw new OpenRouterError(
          `Failed to parse JSON response: ${error instanceof Error ? error.message : "Unknown error"}`,
          "JSON_PARSE_ERROR",
          undefined,
          content
        );
      }
    }

    // Return raw content
    return content as T;
  }

  /**
   * Resets the current message context
   * Useful for starting a new conversation
   */
  resetMessages(): void {
    this.baseSystemMessage = null;
    this.currentSystemMessage = null;
    this.currentUserMessage = null;
    console.log("[OpenRouterService] Messages reset");
  }

  /**
   * Resets all configuration to defaults
   */
  resetAll(): void {
    this.currentModel = DEFAULT_CONFIG.defaultModel;
    this.currentModelParameters = { ...DEFAULT_CONFIG.defaultModelParameters };
    this.baseSystemMessage = null;
    this.currentSystemMessage = null;
    this.currentUserMessage = null;
    this.currentResponseFormat = null;
    console.log("[OpenRouterService] All configuration reset to defaults");
  }
}
