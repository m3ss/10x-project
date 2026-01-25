import type { APIRoute } from "astro";
import { updatePassword, isStrongPassword } from "../../../lib/auth.service";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import type { AuthResponse } from "../../../types";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();
    const { newPassword } = body;

    // Validation
    if (!newPassword) {
      const response: AuthResponse = {
        success: false,
        error: {
          code: "WEAK_PASSWORD",
          message: "Nowe hasło jest wymagane",
        },
      };
      return new Response(JSON.stringify(response), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate password strength
    const passwordValidation = isStrongPassword(newPassword);
    if (!passwordValidation.valid) {
      const response: AuthResponse = {
        success: false,
        error: {
          code: "WEAK_PASSWORD",
          message: passwordValidation.errors.join(". "),
        },
      };
      return new Response(JSON.stringify(response), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with SSR support
    // The session should already be set from the reset link
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Update password
    const result = await updatePassword(supabase, newPassword);

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
      message: "Hasło zostało zmienione pomyślnie",
      redirectTo: "/login?message=Hasło zostało zmienione. Możesz się teraz zalogować",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Password update error:", {
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
