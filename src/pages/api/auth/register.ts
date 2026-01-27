import type { APIRoute } from "astro";
import { registerUser, isValidEmail, isStrongPassword } from "../../../lib/auth.service";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import type { AuthResponse } from "../../../types";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      const response: AuthResponse = {
        success: false,
        error: {
          code: "INVALID_EMAIL",
          message: "Email i hasło są wymagane",
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

    // Validate password strength
    const passwordValidation = isStrongPassword(password);
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
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Get site URL for email redirect
    const siteUrl = new URL(request.url).origin;
    const emailRedirectUrl = `${siteUrl}/login?verified=true`;

    // Attempt registration
    const result = await registerUser(supabase, email, password, emailRedirectUrl);

    if (!result.success) {
      const response: AuthResponse = {
        success: false,
        error: result.error,
      };
      const statusCode = result.error.code === "EMAIL_ALREADY_EXISTS" ? 409 : 400;
      return new Response(JSON.stringify(response), {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Success - user is created and automatically logged in (Option A - auto-confirm)
    const response: AuthResponse = {
      success: true,
      message: "Konto zostało utworzone pomyślnie",
      redirectTo: "/my-flashcards",
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Registration error:", {
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
