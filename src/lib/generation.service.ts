import type { SupabaseClient } from "../db/supabase.client";
import type { GenerationCreateResponseDto, FlashcardProposalDto } from "../types";
import crypto from "crypto";
import { OpenRouterService } from "./openrouter.service";

/**
 * Configuration for AI service
 */
const AI_CONFIG = {
  timeout: parseInt(import.meta.env.AI_SERVICE_TIMEOUT || "60000", 10),
  provider: import.meta.env.AI_SERVICE_PROVIDER || "openrouter",
  model: import.meta.env.OPENROUTER_MODEL || "openai/gpt-4-turbo",
  maxRetries: 3,
  retryDelay: 1000, // 1 second
} as const;

/**
 * System prompt for generating flashcards from source text
 * Instructs the AI to create high-quality educational flashcards
 */
const SYSTEM_PROMPT = `You are an expert educational content creator specializing in creating high-quality flashcards for effective learning.

Your task is to analyze the provided text and generate flashcards that:
1. Focus on key concepts, definitions, and important facts
2. Ask clear, specific questions on the front
3. Provide concise, accurate answers on the back
4. Avoid overly complex or compound questions
5. Cover different aspects of the material (concepts, examples, applications)
6. Are suitable for spaced repetition learning

Guidelines:
- Front: Should be a clear question or prompt (max 200 characters)
- Back: Should be a concise answer (max 500 characters)
- Generate 3-7 flashcards depending on text length and content richness
- Prioritize quality over quantity
- Ensure answers are factually accurate and based only on the provided text

Return your response as a JSON object with an array of flashcards.`;

/**
 * JSON Schema for structured flashcard generation response
 */
const FLASHCARD_SCHEMA = {
  type: "object",
  properties: {
    flashcards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          front: {
            type: "string",
            description: "Question or prompt for the flashcard",
            maxLength: 200,
          },
          back: {
            type: "string",
            description: "Answer or explanation for the flashcard",
            maxLength: 500,
          },
        },
        required: ["front", "back"],
      },
      minItems: 3,
      maxItems: 7,
    },
  },
  required: ["flashcards"],
} as const;

/**
 * Response structure from AI service
 */
interface AIFlashcardResponse {
  flashcards: {
    front: string;
    back: string;
  }[];
}

/**
 * Service for generating flashcards using AI
 */
export class GenerationService {
  private openRouterService: OpenRouterService | null = null;

  constructor(private supabase: SupabaseClient) {
    // Initialize OpenRouter service if provider is set to openrouter
    if (AI_CONFIG.provider === "openrouter") {
      const apiKey = import.meta.env.OPENROUTER_API_KEY;

      if (!apiKey) {
        console.warn("[GenerationService] OPENROUTER_API_KEY not found, falling back to mock mode");
      } else {
        // Parse model parameters from environment variables
        const temperature = import.meta.env.OPENROUTER_TEMPERATURE
          ? parseFloat(import.meta.env.OPENROUTER_TEMPERATURE)
          : 0.7;
        const topP = import.meta.env.OPENROUTER_TOP_P ? parseFloat(import.meta.env.OPENROUTER_TOP_P) : 0.9;

        // Validate parameters
        const validTemperature = !isNaN(temperature) && temperature >= 0 && temperature <= 2 ? temperature : 0.7;
        const validTopP = !isNaN(topP) && topP >= 0 && topP <= 1 ? topP : 0.9;

        this.openRouterService = new OpenRouterService({
          apiKey,
          defaultModel: AI_CONFIG.model,
          timeout: AI_CONFIG.timeout,
          maxRetries: AI_CONFIG.maxRetries,
          defaultModelParameters: {
            temperature: validTemperature,
            top_p: validTopP,
            frequency_penalty: 0.0,
            presence_penalty: 0.0,
          },
        });

        // Configure the service with system prompt and response format
        this.openRouterService.setSystemMessage(SYSTEM_PROMPT);
        this.openRouterService.setResponseFormat(FLASHCARD_SCHEMA);

        console.log(
          `[GenerationService] OpenRouter service initialized - ` +
            `Model: ${AI_CONFIG.model}, Temperature: ${validTemperature}, Top-P: ${validTopP}`
        );
      }
    }
  }

  /**
   * Generates an MD5 hash for the source text to enable deduplication and tracking
   */
  private generateSourceTextHash(text: string): string {
    return crypto.createHash("md5").update(text).digest("hex");
  }

  /**
   * Calls the AI service to generate flashcard proposals
   * Uses OpenRouter API if configured, otherwise falls back to mock implementation
   *
   * @param sourceText - The input text to generate flashcards from
   * @param timeoutMs - Timeout in milliseconds (default: from env or 60000ms)
   * @returns Array of flashcard proposals
   * @throws Error if timeout is reached or AI service fails
   */
  private async callAIService(
    sourceText: string,
    timeoutMs: number = AI_CONFIG.timeout
  ): Promise<FlashcardProposalDto[]> {
    // Use OpenRouter service if available
    if (this.openRouterService) {
      try {
        console.log("[GenerationService] Calling OpenRouter API...");

        const response = await this.openRouterService.sendChatMessage<AIFlashcardResponse>(
          `Generate flashcards from the following text:\n\n${sourceText}`
        );

        // Debug: Log the raw response
        console.log("[GenerationService] Raw AI response:", JSON.stringify(response, null, 2).substring(0, 500));

        // Validate response structure
        if (!response.flashcards || !Array.isArray(response.flashcards)) {
          console.error("[GenerationService] Response validation failed. Response:", response);
          throw new Error("Invalid response structure from AI service");
        }

        if (response.flashcards.length < 3) {
          throw new Error("AI service returned fewer than 3 flashcards");
        }

        if (response.flashcards.length > 7) {
          console.warn(`[GenerationService] AI returned ${response.flashcards.length} flashcards, trimming to 7`);
          response.flashcards = response.flashcards.slice(0, 7);
        }

        // Transform to FlashcardProposalDto format
        const flashcards: FlashcardProposalDto[] = response.flashcards.map((card) => {
          // Validate and truncate if necessary
          const front = card.front.substring(0, 200).trim();
          const back = card.back.substring(0, 500).trim();

          if (!front || !back) {
            throw new Error("AI service returned flashcard with empty front or back");
          }

          return {
            front,
            back,
            source: "ai-full" as const,
          };
        });

        console.log(`[GenerationService] OpenRouter API returned ${flashcards.length} flashcards`);

        return flashcards;
      } catch (error) {
        console.error("[GenerationService] OpenRouter API error:", error);
        throw error;
      }
    }

    // Fallback to mock implementation for development/testing
    console.warn("[GenerationService] OpenRouter not configured, using mock implementation");

    return new Promise((resolve, reject) => {
      // Set timeout
      const timeoutId = setTimeout(() => {
        reject(new Error(`AI service timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      // Simulate AI service call
      (async () => {
        try {
          // Simulate API call delay (200-500ms)
          const delay = Math.floor(Math.random() * 300) + 200;
          await new Promise((delayResolve) => setTimeout(delayResolve, delay));

          // Simulate occasional failures (5% chance) for testing retry logic
          if (Math.random() < 0.05) {
            throw new Error("Simulated AI service temporary failure");
          }

          // Generate 3-7 mock flashcards based on text length
          const baseCount = 3;
          const bonusCount = Math.floor(sourceText.length / 2000); // +1 per 2000 chars
          const count = Math.min(baseCount + bonusCount, 7);

          const mockFlashcards: FlashcardProposalDto[] = [];

          for (let i = 0; i < count; i++) {
            mockFlashcards.push({
              front: `Mock Question ${i + 1} based on provided text`,
              back: `Mock Answer ${i + 1} extracted from source material`,
              source: "ai-full" as const,
            });
          }

          clearTimeout(timeoutId);
          resolve(mockFlashcards);
        } catch (error) {
          clearTimeout(timeoutId);
          reject(error);
        }
      })();
    });
  }

  /**
   * Calls AI service with retry logic for transient failures
   *
   * @param sourceText - The input text to generate flashcards from
   * @returns Array of flashcard proposals
   * @throws Error if all retry attempts fail
   */
  private async callAIServiceWithRetry(sourceText: string): Promise<FlashcardProposalDto[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= AI_CONFIG.maxRetries; attempt++) {
      try {
        console.log(`[GenerationService] AI service call attempt ${attempt}/${AI_CONFIG.maxRetries}`);
        return await this.callAIService(sourceText);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[GenerationService] Attempt ${attempt} failed:`, lastError.message);

        // Don't retry on timeout errors (they're already long enough)
        if (lastError.message.includes("timeout")) {
          throw lastError;
        }

        // Wait before retrying (except on last attempt)
        if (attempt < AI_CONFIG.maxRetries) {
          const delay = AI_CONFIG.retryDelay * attempt; // Exponential backoff
          console.log(`[GenerationService] Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`AI service failed after ${AI_CONFIG.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Main service function to generate flashcards from source text
   *
   * Workflow:
   * 1. Call AI service to generate flashcard proposals
   * 2. Calculate metadata (hash, length, duration, model)
   * 3. Save generation record to database
   * 4. Return response with generation_id and proposals
   *
   * @param sourceText - Input text (1000-10000 characters)
   * @param userId - ID of authenticated user
   * @returns Generation response with proposals
   * @throws Error if AI service fails or database operation fails
   */
  async generateFlashcards(sourceText: string, userId: string): Promise<GenerationCreateResponseDto> {
    const startTime = Date.now();

    try {
      // Step 1: Call AI service to generate flashcard proposals (with retry logic)
      console.log(`[GenerationService] Starting generation for user ${userId}, text length: ${sourceText.length}`);
      const flashcardsProposals = await this.callAIServiceWithRetry(sourceText);

      const endTime = Date.now();
      const durationMs = endTime - startTime;

      // Step 2: Calculate metadata
      const sourceTextHash = this.generateSourceTextHash(sourceText);
      const sourceTextLength = sourceText.length;
      const generatedCount = flashcardsProposals.length;
      const model = this.openRouterService ? AI_CONFIG.model : "mock-ai-v1";

      // Step 3: Save generation record to database
      const { data: generationData, error: dbError } = await this.supabase
        .from("generations")
        .insert({
          user_id: userId,
          model: model,
          generated_count: generatedCount,
          source_text_hash: sourceTextHash,
          source_text_length: sourceTextLength,
          generation_duration: durationMs,
        })
        .select("id")
        .single();

      if (dbError || !generationData) {
        console.error("[GenerationService] Database error:", dbError);
        throw new Error("Failed to save generation record to database");
      }

      // Log performance metrics
      console.log(
        `[GenerationService] Generation successful: ID=${generationData.id}, ` +
          `count=${generatedCount}, duration=${durationMs}ms, hash=${sourceTextHash.substring(0, 8)}...`
      );

      // Step 4: Return successful response
      const response: GenerationCreateResponseDto = {
        generation_id: generationData.id,
        flashcards_proposals: flashcardsProposals,
        generated_count: generatedCount,
      };

      return response;
    } catch (error) {
      const endTime = Date.now();
      const durationMs = endTime - startTime;

      // Log error to generation_error_logs table
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorCode = error instanceof Error && "code" in error ? String(error.code) : "UNKNOWN_ERROR";
      const model = this.openRouterService ? AI_CONFIG.model : "mock-ai-v1";

      try {
        await this.supabase.from("generation_error_logs").insert({
          user_id: userId,
          error_code: errorCode,
          error_message: errorMessage,
          model: model,
          source_text_hash: this.generateSourceTextHash(sourceText),
          source_text_length: sourceText.length,
          generation_duration: durationMs,
        });
      } catch (logError) {
        // If logging fails, just log to console (don't throw)
        console.error("[GenerationService] Failed to log error:", logError);
      }

      // Re-throw the original error
      throw error;
    }
  }
}
