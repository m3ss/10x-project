import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types";
import type { FlashcardCreateDto, FlashcardDto } from "../types";

/**
 * FlashcardService handles flashcard-related business logic and database operations
 */
export class FlashcardService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Creates multiple flashcards in the database
   *
   * @param flashcards - Array of flashcard data to create
   * @param userId - ID of the user creating the flashcards
   * @returns Array of created flashcard DTOs
   * @throws Error if database operation fails
   */
  async createFlashcards(flashcards: FlashcardCreateDto[], userId: string): Promise<FlashcardDto[]> {
    // Validate input
    if (!flashcards || flashcards.length === 0) {
      throw new Error("At least one flashcard is required");
    }

    // Validate each flashcard
    for (const flashcard of flashcards) {
      if (!flashcard.front || flashcard.front.trim().length === 0) {
        throw new Error("Flashcard front cannot be empty");
      }
      if (!flashcard.back || flashcard.back.trim().length === 0) {
        throw new Error("Flashcard back cannot be empty");
      }
      if (flashcard.front.length > 200) {
        throw new Error("Flashcard front cannot exceed 200 characters");
      }
      if (flashcard.back.length > 500) {
        throw new Error("Flashcard back cannot exceed 500 characters");
      }
      if (!["ai-full", "ai-edited", "manual"].includes(flashcard.source)) {
        throw new Error("Invalid source value");
      }
      // Validate generation_id based on source
      if ((flashcard.source === "ai-full" || flashcard.source === "ai-edited") && !flashcard.generation_id) {
        throw new Error("generation_id is required for AI-generated flashcards");
      }
      if (flashcard.source === "manual" && flashcard.generation_id !== null) {
        throw new Error("generation_id must be null for manual flashcards");
      }
    }

    // Prepare data for insertion
    const flashcardsToInsert = flashcards.map((flashcard) => ({
      front: flashcard.front.trim(),
      back: flashcard.back.trim(),
      source: flashcard.source,
      generation_id: flashcard.generation_id,
      user_id: userId,
    }));

    // Insert flashcards into database
    const { data, error } = await this.supabase
      .from("flashcards")
      .insert(flashcardsToInsert)
      .select("id, front, back, source, generation_id, created_at, updated_at");

    if (error) {
      console.error("Database error during flashcard creation:", error);
      throw new Error(`Failed to create flashcards: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error("No flashcards were created");
    }

    return data as FlashcardDto[];
  }
}
