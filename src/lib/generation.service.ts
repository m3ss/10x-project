import type { SupabaseClient } from "../db/supabase.client";
import type { GenerationCreateResponseDto, FlashcardProposalDto } from "../types";
import crypto from "crypto";

/**
 * Configuration for AI service
 */
const AI_CONFIG = {
  timeout: parseInt(import.meta.env.AI_SERVICE_TIMEOUT || "60000", 10),
  provider: import.meta.env.AI_SERVICE_PROVIDER || "mock",
  model: "mock-ai-v1",
  maxRetries: 3,
  retryDelay: 1000, // 1 second
} as const;

/**
 * Service for generating flashcards using AI
 */
export class GenerationService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Generates an MD5 hash for the source text to enable deduplication and tracking
   */
  private generateSourceTextHash(text: string): string {
    return crypto.createHash("md5").update(text).digest("hex");
  }

  /**
   * Calls the AI service to generate flashcard proposals
   * Currently uses a mock implementation for development
   * In production, this will integrate with external AI services (OpenAI, Claude, etc.)
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
    // Mock implementation - simulates AI service behavior
    // TODO: Replace with actual AI service integration in production

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
      const model = AI_CONFIG.model;

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

      try {
        await this.supabase.from("generation_error_logs").insert({
          user_id: userId,
          error_code: errorCode,
          error_message: errorMessage,
          model: AI_CONFIG.model,
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
