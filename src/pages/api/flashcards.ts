import type { APIRoute } from "astro";
import { z } from "zod";
import type {
  FlashcardsCreateCommand,
  FlashcardDto,
  FlashcardUpdateCommand,
  FlashcardsListResponseDto,
} from "../../types";
import { FlashcardService } from "../../lib/flashcard.service";

export const prerender = false;

/**
 * Validation schema for individual flashcard
 */
const flashcardCreateSchema = z
  .object({
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
  })
  .refine(
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
 * Validation schema for PUT /flashcards/{id} endpoint
 */
const flashcardUpdateSchema = z
  .object({
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
  })
  .refine((data) => data.front !== undefined || data.back !== undefined, {
    message: "At least one field (front or back) must be provided",
  });

/**
 * POST /api/flashcards
 *
 * Creates one or more flashcards in the database.
 * Requires authentication.
 *
 * @param {FlashcardsCreateCommand} body - Array of flashcards to create
 * @returns {FlashcardDto[]} Array of created flashcards with IDs
 *
 * Status Codes:
 * - 201: Flashcards created successfully
 * - 400: Invalid input data (e.g., validation errors)
 * - 401: Unauthorized (user not authenticated)
 * - 500: Server error (database error)
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Auth check
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Musisz być zalogowany aby zapisać fiszki",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = locals.user.id;

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

    // Initialize flashcard service with authenticated user's supabase client
    const flashcardService = new FlashcardService(locals.supabase);

    // Create flashcards with authenticated user's ID
    const createdFlashcards: FlashcardDto[] = await flashcardService.createFlashcards(command.flashcards, userId);

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

/**
 * GET /api/flashcards
 *
 * Retrieves a paginated list of flashcards for the authenticated user.
 * Requires authentication.
 *
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 20, max: 100)
 * @param {string} sort - Sort field (default: created_at)
 * @param {string} order - Sort order (default: desc)
 * @param {string} source - Filter by source (optional)
 * @returns {FlashcardsListResponseDto} Paginated list of flashcards
 *
 * Status Codes:
 * - 200: Flashcards retrieved successfully
 * - 400: Invalid query parameters
 * - 401: Unauthorized (user not authenticated)
 * - 500: Server error (database error)
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Auth check
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Musisz być zalogowany aby pobrać fiszki",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = locals.user.id;

    // Parse query parameters
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const sort = url.searchParams.get("sort") || "created_at";
    const order = url.searchParams.get("order") || "desc";
    const source = url.searchParams.get("source");

    // Validate query parameters
    if (isNaN(page) || page < 1) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Page must be a positive integer",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Limit must be between 1 and 100",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!["created_at", "updated_at", "front"].includes(sort)) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Sort must be one of: created_at, updated_at, front",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!["asc", "desc"].includes(order)) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Order must be either asc or desc",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (source && !["ai-full", "ai-edited", "manual"].includes(source)) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Source must be one of: ai-full, ai-edited, manual",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize flashcard service
    const flashcardService = new FlashcardService(locals.supabase);

    // Retrieve flashcards
    const result: FlashcardsListResponseDto = await flashcardService.getFlashcards(
      userId,
      page,
      limit,
      sort as "created_at" | "updated_at" | "front",
      order as "asc" | "desc",
      source as "ai-full" | "ai-edited" | "manual" | undefined
    );

    // Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error for internal monitoring
    console.error("[GET /api/flashcards] Unexpected error:", error);

    // Return generic server error to client
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred while retrieving flashcards",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
