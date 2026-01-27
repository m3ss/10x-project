import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types";
import type { 
  FlashcardCreateDto, 
  FlashcardDto, 
  FlashcardUpdateDto,
  FlashcardsListResponseDto,
  PaginationDto 
} from "../types";

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

  /**
   * Retrieves a paginated list of flashcards for a user
   *
   * @param userId - ID of the user
   * @param page - Page number (1-indexed)
   * @param limit - Number of flashcards per page
   * @param sortField - Field to sort by
   * @param sortOrder - Sort order (asc or desc)
   * @param source - Optional filter by source
   * @returns Paginated list of flashcards
   * @throws Error if database operation fails
   */
  async getFlashcards(
    userId: string,
    page: number = 1,
    limit: number = 20,
    sortField: 'created_at' | 'updated_at' | 'front' = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc',
    source?: 'ai-full' | 'ai-edited' | 'manual'
  ): Promise<FlashcardsListResponseDto> {
    // Validate pagination parameters
    if (page < 1) {
      throw new Error("Page number must be at least 1");
    }
    if (limit < 1 || limit > 100) {
      throw new Error("Limit must be between 1 and 100");
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query
    let query = this.supabase
      .from("flashcards")
      .select("id, front, back, source, generation_id, created_at, updated_at", { count: "exact" })
      .eq("user_id", userId);

    // Apply source filter if provided
    if (source) {
      query = query.eq("source", source);
    }

    // Apply sorting
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Database error during flashcard retrieval:", error);
      throw new Error(`Failed to retrieve flashcards: ${error.message}`);
    }

    const pagination: PaginationDto = {
      page,
      limit,
      total: count ?? 0,
    };

    return {
      data: (data as FlashcardDto[]) ?? [],
      pagination,
    };
  }

  /**
   * Retrieves a single flashcard by ID
   *
   * @param flashcardId - ID of the flashcard
   * @param userId - ID of the user (for authorization)
   * @returns Flashcard DTO
   * @throws Error if flashcard not found or database operation fails
   */
  async getFlashcard(flashcardId: number, userId: string): Promise<FlashcardDto> {
    const { data, error } = await this.supabase
      .from("flashcards")
      .select("id, front, back, source, generation_id, created_at, updated_at")
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("Flashcard not found");
      }
      console.error("Database error during flashcard retrieval:", error);
      throw new Error(`Failed to retrieve flashcard: ${error.message}`);
    }

    if (!data) {
      throw new Error("Flashcard not found");
    }

    return data as FlashcardDto;
  }

  /**
   * Updates a flashcard
   *
   * @param flashcardId - ID of the flashcard to update
   * @param userId - ID of the user (for authorization)
   * @param updates - Fields to update
   * @returns Updated flashcard DTO
   * @throws Error if flashcard not found or database operation fails
   */
  async updateFlashcard(
    flashcardId: number,
    userId: string,
    updates: FlashcardUpdateDto
  ): Promise<FlashcardDto> {
    // Validate updates
    if (updates.front !== undefined) {
      if (!updates.front || updates.front.trim().length === 0) {
        throw new Error("Flashcard front cannot be empty");
      }
      if (updates.front.length > 200) {
        throw new Error("Flashcard front cannot exceed 200 characters");
      }
    }

    if (updates.back !== undefined) {
      if (!updates.back || updates.back.trim().length === 0) {
        throw new Error("Flashcard back cannot be empty");
      }
      if (updates.back.length > 500) {
        throw new Error("Flashcard back cannot exceed 500 characters");
      }
    }

    // If no fields to update, return current flashcard
    if (updates.front === undefined && updates.back === undefined) {
      return this.getFlashcard(flashcardId, userId);
    }

    // First, get the current flashcard to check its source
    const currentFlashcard = await this.getFlashcard(flashcardId, userId);

    // Prepare update data
    const updateData: Record<string, string> = {};
    if (updates.front !== undefined) {
      updateData.front = updates.front.trim();
    }
    if (updates.back !== undefined) {
      updateData.back = updates.back.trim();
    }

    // If the flashcard was AI-generated (ai-full) and is being edited,
    // change its source to ai-edited
    if (currentFlashcard.source === "ai-full") {
      updateData.source = "ai-edited";
    }

    // Update flashcard
    const { data, error } = await this.supabase
      .from("flashcards")
      .update(updateData)
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .select("id, front, back, source, generation_id, created_at, updated_at")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("Flashcard not found");
      }
      console.error("Database error during flashcard update:", error);
      throw new Error(`Failed to update flashcard: ${error.message}`);
    }

    if (!data) {
      throw new Error("Flashcard not found");
    }

    return data as FlashcardDto;
  }

  /**
   * Deletes a flashcard
   *
   * @param flashcardId - ID of the flashcard to delete
   * @param userId - ID of the user (for authorization)
   * @throws Error if flashcard not found or database operation fails
   */
  async deleteFlashcard(flashcardId: number, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("flashcards")
      .delete()
      .eq("id", flashcardId)
      .eq("user_id", userId);

    if (error) {
      console.error("Database error during flashcard deletion:", error);
      throw new Error(`Failed to delete flashcard: ${error.message}`);
    }
  }
}
