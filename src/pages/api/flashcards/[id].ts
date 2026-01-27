import type { APIRoute } from "astro";
import { z } from "zod";
import type { FlashcardDto, FlashcardUpdateCommand } from "../../../types";
import { FlashcardService } from "../../../lib/flashcard.service";

export const prerender = false;

/**
 * Validation schema for PUT /flashcards/{id} endpoint
 */
const flashcardUpdateSchema = z.object({
  front: z
    .string()
    .min(1, "Front cannot be empty")
    .max(200, "Front cannot exceed 200 characters")
    .transform((val) => val.trim())
    .optional(),
  back: z
    .string()
    .min(1, "Back cannot be empty")
    .max(500, "Back cannot exceed 500 characters")
    .transform((val) => val.trim())
    .optional(),
}).refine((data) => data.front !== undefined || data.back !== undefined, {
  message: "At least one field (front or back) must be provided",
});

/**
 * GET /api/flashcards/{id}
 *
 * Retrieves a single flashcard by ID.
 * Requires authentication.
 *
 * @returns {FlashcardDto} Flashcard object
 *
 * Status Codes:
 * - 200: Flashcard retrieved successfully
 * - 400: Invalid flashcard ID
 * - 401: Unauthorized (user not authenticated)
 * - 404: Flashcard not found
 * - 500: Server error (database error)
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Auth check
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Musisz być zalogowany aby pobrać fiszkę",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = locals.user.id;

    // Validate flashcard ID
    const flashcardId = parseInt(params.id || "");
    if (isNaN(flashcardId) || flashcardId < 1) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid flashcard ID",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize flashcard service
    const flashcardService = new FlashcardService(locals.supabase);

    // Retrieve flashcard
    const flashcard: FlashcardDto = await flashcardService.getFlashcard(flashcardId, userId);

    // Return successful response
    return new Response(
      JSON.stringify({
        data: flashcard,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Log error for internal monitoring
    console.error("[GET /api/flashcards/{id}] Unexpected error:", error);

    // Check if it's a not found error
    if (error instanceof Error && error.message === "Flashcard not found") {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Fiszka nie została znaleziona",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return generic server error to client
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred while retrieving flashcard",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * PUT /api/flashcards/{id}
 *
 * Updates an existing flashcard.
 * Requires authentication.
 *
 * @param {FlashcardUpdateCommand} body - Fields to update
 * @returns {FlashcardDto} Updated flashcard object
 *
 * Status Codes:
 * - 200: Flashcard updated successfully
 * - 400: Invalid input data (e.g., validation errors)
 * - 401: Unauthorized (user not authenticated)
 * - 404: Flashcard not found
 * - 500: Server error (database error)
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // Auth check
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Musisz być zalogowany aby edytować fiszkę",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = locals.user.id;

    // Validate flashcard ID
    const flashcardId = parseInt(params.id || "");
    if (isNaN(flashcardId) || flashcardId < 1) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid flashcard ID",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

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
    const validationResult = flashcardUpdateSchema.safeParse(body);

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

    const command: FlashcardUpdateCommand = validationResult.data;

    // Initialize flashcard service
    const flashcardService = new FlashcardService(locals.supabase);

    // Update flashcard
    const updatedFlashcard: FlashcardDto = await flashcardService.updateFlashcard(
      flashcardId,
      userId,
      command
    );

    // Return successful response
    return new Response(
      JSON.stringify({
        data: updatedFlashcard,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Log error for internal monitoring
    console.error("[PUT /api/flashcards/{id}] Unexpected error:", error);

    // Check if it's a not found error
    if (error instanceof Error && error.message === "Flashcard not found") {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Fiszka nie została znaleziona",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if it's a validation error from the service
    if (error instanceof Error) {
      if (
        error.message.includes("cannot be empty") ||
        error.message.includes("cannot exceed")
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
        message: "An unexpected error occurred while updating flashcard",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * DELETE /api/flashcards/{id}
 *
 * Deletes a flashcard.
 * Requires authentication.
 *
 * @returns Success message
 *
 * Status Codes:
 * - 200: Flashcard deleted successfully
 * - 400: Invalid flashcard ID
 * - 401: Unauthorized (user not authenticated)
 * - 404: Flashcard not found (not explicitly checked, RLS handles it)
 * - 500: Server error (database error)
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Auth check
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Musisz być zalogowany aby usunąć fiszkę",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = locals.user.id;

    // Validate flashcard ID
    const flashcardId = parseInt(params.id || "");
    if (isNaN(flashcardId) || flashcardId < 1) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid flashcard ID",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize flashcard service
    const flashcardService = new FlashcardService(locals.supabase);

    // Delete flashcard
    await flashcardService.deleteFlashcard(flashcardId, userId);

    // Return successful response
    return new Response(
      JSON.stringify({
        message: "Fiszka została pomyślnie usunięta",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Log error for internal monitoring
    console.error("[DELETE /api/flashcards/{id}] Unexpected error:", error);

    // Return generic server error to client
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred while deleting flashcard",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
