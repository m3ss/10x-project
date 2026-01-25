import type { APIRoute } from "astro";
import { loginUser, isValidEmail } from "../../../lib/auth.service";
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

    if (password.length < 6) {
      const response: AuthResponse = {
        success: false,
        error: {
          code: "WEAK_PASSWORD",
          message: "Hasło musi mieć minimum 6 znaków",
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

    // Attempt login
    const result = await loginUser(supabase, email, password);

    if (!result.success) {
      const response: AuthResponse = {
        success: false,
        error: result.error,
      };
      const statusCode = result.error.code === "INVALID_CREDENTIALS" ? 401 : 400;
      return new Response(JSON.stringify(response), {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Success
    const response: AuthResponse = {
      success: true,
      user: {
        id: result.data.user.id,
        email: result.data.user.email ?? "",
      },
      redirectTo: "/generate",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Login error:", {
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
