import type { APIRoute } from "astro";
import { logoutUser } from "../../../lib/auth.service";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import type { AuthResponse } from "../../../types";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Create Supabase client with SSR support
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Attempt logout
    const result = await logoutUser(supabase);

    if (!result.success) {
      const response: AuthResponse = {
        success: false,
        error: result.error,
      };
      return new Response(JSON.stringify(response), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Success
    const response: AuthResponse = {
      success: true,
      redirectTo: "/login",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Logout error:", {
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
