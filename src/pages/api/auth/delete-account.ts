import type { APIRoute } from "astro";
import { deleteUserAccount } from "../../../lib/auth.service";
import { supabaseServiceClient } from "../../../db/supabase.client";
import type { AuthResponse } from "../../../types";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Auth check
    if (!locals.user) {
      const response: AuthResponse = {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Musisz być zalogowany",
        },
      };
      return new Response(JSON.stringify(response), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = locals.user.id;

    // Parse request body
    const body = await request.json();
    const { confirmText } = body;

    // Validate confirmation text
    if (confirmText !== "USUŃ KONTO") {
      const response: AuthResponse = {
        success: false,
        error: {
          code: "INVALID_CONFIRMATION",
          message: "Nieprawidłowy tekst potwierdzający",
        },
      };
      return new Response(JSON.stringify(response), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete user account using admin client
    // This will cascade delete all related data (flashcards, generations, logs)
    const result = await deleteUserAccount(supabaseServiceClient, userId);

    if (!result.success) {
      const response: AuthResponse = {
        success: false,
        error: result.error,
      };
      return new Response(JSON.stringify(response), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Logout user (clear session)
    await locals.supabase.auth.signOut();

    // Success
    const response: AuthResponse = {
      success: true,
      message: "Twoje konto zostało trwale usunięte",
      redirectTo: "/",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Account deletion error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    const response: AuthResponse = {
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Wystąpił błąd serwera. Spróbuj ponownie później.",
      },
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
