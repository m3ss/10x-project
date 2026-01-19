import type { APIRoute } from "astro";
import { z } from "zod";
import type { FlashcardsCreateCommand, FlashcardDto } from "../../types";
import { FlashcardService } from "../../lib/flashcard.service";
import { DEFAULT_USER_ID, supabaseServiceClient } from "../../db/supabase.client";

export const prerender = false;

/**
 * Validation schema for individual flashcard
 */
const flashcardCreateSchema = z.object({
  front: z
    .string()
    .min(1, "Front cannot be empty")
    .max(200, "Front cannot exceed 200 characters")
    .transform((val) => val.trim()),
  back: z
    .string()
    .min(1, "Back cannot be empty")
    .max(500, "Back cannot exceed 500 characters")
    .transform((val) => val.trim()),
  source: z.enum(["ai-full", "ai-edited", "manual"], {
    errorMap: () => ({ message: "Source must be one of: ai-full, ai-edited, manual" }),
  }),
  generation_id: z.number().int().positive().nullable(),
}).refine(
  (data) => {
    // For AI-generated flashcards, generation_id is required
    if ((data.source === "ai-full" || data.source === "ai-edited") && !data.generation_id) {
      return false;
    }
    // For manual flashcards, generation_id must be null
    if (data.source === "manual" && data.generation_id !== null) {
      return false;
    }
    return true;
  },
  {
    message: "generation_id is required for AI-generated flashcards and must be null for manual flashcards",
    path: ["generation_id"],
  }
);

/**
 * Validation schema for POST /flashcards endpoint
 */
const flashcardsCreateSchema = z.object({
  flashcards: z
    .array(flashcardCreateSchema)
    .min(1, "At least one flashcard is required")
    .max(100, "Cannot create more than 100 flashcards at once"),
});

/**
 * POST /api/flashcards
 *
 * Creates one or more flashcards in the database.
 *
 * @param {FlashcardsCreateCommand} body - Array of flashcards to create
 * @returns {FlashcardDto[]} Array of created flashcards with IDs
 *
 * Status Codes:
 * - 201: Flashcards created successfully
 * - 400: Invalid input data (e.g., validation errors)
 * - 500: Server error (database error)
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid JSON format",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate input using zod schema
    const validationResult = flashcardsCreateSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: "Validation Error",
          message: "Invalid input data",
          details: errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const command: FlashcardsCreateCommand = validationResult.data;

    // Initialize flashcard service with service role client
    const flashcardService = new FlashcardService(supabaseServiceClient);

    // Create flashcards
    const createdFlashcards: FlashcardDto[] = await flashcardService.createFlashcards(
      command.flashcards,
      DEFAULT_USER_ID
    );

    // Return successful response with 201 status
    return new Response(
      JSON.stringify({
        data: createdFlashcards,
        count: createdFlashcards.length,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Log error for internal monitoring
    console.error("[POST /api/flashcards] Unexpected error:", error);

    // Check if it's a validation error from the service
    if (error instanceof Error) {
      if (
        error.message.includes("cannot be empty") ||
        error.message.includes("cannot exceed") ||
        error.message.includes("is required") ||
        error.message.includes("Invalid source")
      ) {
        return new Response(
          JSON.stringify({
            error: "Validation Error",
            message: error.message,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Return generic server error to client
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred while creating flashcards",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
