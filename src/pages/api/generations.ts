import type { APIRoute } from "astro";
import { z } from "zod";
import type { GenerateFlashcardsCommand, GenerationCreateResponseDto } from "../../types";
import { GenerationService } from "../../lib/generation.service";
import { DEFAULT_USER_ID, supabaseServiceClient } from "../../db/supabase.client";

export const prerender = false;

/**
 * Validation schema for POST /generations endpoint
 * Ensures source_text is between 1000 and 10000 characters
 */
const generateFlashcardsSchema = z.object({
  source_text: z
    .string()
    .min(1000, "Source text must be at least 1000 characters long")
    .max(10000, "Source text must not exceed 10000 characters"),
});

/**
 * POST /api/generations
 *
 * Initiates the AI flashcard generation process based on user-provided source text.
 *
 * @param {string} source_text - Input text (1000-10000 characters)
 * @returns {GenerationCreateResponseDto} Generated flashcard proposals with metadata
 *
 * Status Codes:
 * - 201: Generation created successfully
 * - 400: Invalid input data (e.g., source_text length out of range)
 * - 500: Server error (AI service failure or database error)
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Use service role client to bypass RLS (for development without auth)

    // Parse and validate request body
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
    const validationResult = generateFlashcardsSchema.safeParse(body);

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

    const command: GenerateFlashcardsCommand = validationResult.data;

    // Initialize generation service with service role client (bypasses RLS)
    const generationService = new GenerationService(supabaseServiceClient);

    // Call generation service with DEFAULT_USER_ID (auth will be implemented later)
    const result: GenerationCreateResponseDto = await generationService.generateFlashcards(
      command.source_text,
      DEFAULT_USER_ID
    );

    // Return successful response with 201 status
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error for internal monitoring
    console.error("[POST /api/generations] Unexpected error:", error);

    // Return generic server error to client (don't expose internal details)
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred while processing your request",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
