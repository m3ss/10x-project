import type { APIRoute } from "astro";
import { requestPasswordReset, isValidEmail } from "../../../lib/auth.service";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import type { AuthResponse } from "../../../types";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();
    const { email } = body;

    // Validation
    if (!email) {
      const response: AuthResponse = {
        success: false,
        error: {
          code: "INVALID_EMAIL",
          message: "Email jest wymagany",
        },
      };
      return new Response(JSON.stringify(response), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!isValidEmail(email)) {
      const response: AuthResponse = {
        success: false,
        error: {
          code: "INVALID_EMAIL",
          message: "Nieprawidłowy format adresu email",
        },
      };
      return new Response(JSON.stringify(response), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with SSR support
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Get site URL for email redirect
    const siteUrl = new URL(request.url).origin;
    const redirectUrl = `${siteUrl}/reset-password`;

    // Request password reset
    // Note: We always return success (security best practice - don't reveal if email exists)
    await requestPasswordReset(supabase, email, redirectUrl);

    // Success
    const response: AuthResponse = {
      success: true,
      message: "Jeśli konto z tym adresem email istnieje, otrzymasz link do resetowania hasła",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Password reset request error:", {
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
