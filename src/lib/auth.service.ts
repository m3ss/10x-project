import type { SupabaseClient, User, AuthError as SupabaseAuthError } from "@supabase/supabase-js";
import type { AuthError, AuthErrorCode } from "../types";

// Type for auth operation results
type AuthResult<T> = { success: true; data: T } | { success: false; error: AuthError };

/**
 * Login user with email and password
 */
export async function loginUser(
  supabase: SupabaseClient,
  email: string,
  password: string
): Promise<AuthResult<{ user: User }>> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: mapSupabaseError(error),
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Nie udało się zalogować. Spróbuj ponownie.",
        },
      };
    }

    return {
      success: true,
      data: { user: data.user },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: "Błąd połączenia. Sprawdź swoje połączenie internetowe.",
      },
    };
  }
}

/**
 * Register new user with email and password
 */
export async function registerUser(
  supabase: SupabaseClient,
  email: string,
  password: string,
  emailRedirectUrl: string
): Promise<AuthResult<{ userId: string }>> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: emailRedirectUrl,
      },
    });

    if (error) {
      return {
        success: false,
        error: mapSupabaseError(error),
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Nie udało się utworzyć konta. Spróbuj ponownie.",
        },
      };
    }

    return {
      success: true,
      data: { userId: data.user.id },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: "Błąd połączenia. Sprawdź swoje połączenie internetowe.",
      },
    };
  }
}

/**
 * Logout current user
 */
export async function logoutUser(supabase: SupabaseClient): Promise<AuthResult<void>> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: mapSupabaseError(error),
      };
    }

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: "Błąd połączenia. Sprawdź swoje połączenie internetowe.",
      },
    };
  }
}

/**
 * Request password reset email
 */
export async function requestPasswordReset(
  supabase: SupabaseClient,
  email: string,
  redirectUrl: string
): Promise<AuthResult<void>> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      return {
        success: false,
        error: mapSupabaseError(error),
      };
    }

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: "Błąd połączenia. Sprawdź swoje połączenie internetowe.",
      },
    };
  }
}

/**
 * Update user password (after clicking reset link)
 */
export async function updatePassword(supabase: SupabaseClient, newPassword: string): Promise<AuthResult<void>> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return {
        success: false,
        error: mapSupabaseError(error),
      };
    }

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: "Błąd połączenia. Sprawdź swoje połączenie internetowe.",
      },
    };
  }
}

/**
 * Delete user account (requires admin client)
 */
export async function deleteUserAccount(supabaseAdmin: SupabaseClient, userId: string): Promise<AuthResult<void>> {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      return {
        success: false,
        error: {
          code: "ACCOUNT_DELETION_FAILED",
          message: "Nie udało się usunąć konta. Spróbuj ponownie później.",
        },
      };
    }

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: "Błąd połączenia. Sprawdź swoje połączenie internetowe.",
      },
    };
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isStrongPassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Hasło musi mieć minimum 8 znaków");
  }

  if (!/\d/.test(password)) {
    errors.push("Hasło musi zawierać co najmniej jedną cyfrę");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Hasło musi zawierać co najmniej jeden znak specjalny");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Map Supabase auth errors to application error codes
 */
export function mapSupabaseError(error: SupabaseAuthError): AuthError {
  const errorMessage = error.message.toLowerCase();

  // Invalid credentials
  if (
    errorMessage.includes("invalid login credentials") ||
    errorMessage.includes("invalid email or password") ||
    errorMessage.includes("email not confirmed")
  ) {
    return {
      code: "INVALID_CREDENTIALS",
      message: "Nieprawidłowy email lub hasło",
    };
  }

  // Email already exists
  if (errorMessage.includes("user already registered") || errorMessage.includes("email already exists")) {
    return {
      code: "EMAIL_ALREADY_EXISTS",
      message: "Konto z tym adresem email już istnieje",
    };
  }

  // Weak password
  if (errorMessage.includes("password") && (errorMessage.includes("weak") || errorMessage.includes("short"))) {
    return {
      code: "WEAK_PASSWORD",
      message: "Hasło musi zawierać minimum 8 znaków, cyfrę i znak specjalny",
    };
  }

  // Invalid email
  if (errorMessage.includes("invalid email")) {
    return {
      code: "INVALID_EMAIL",
      message: "Nieprawidłowy format adresu email",
    };
  }

  // Email not verified
  if (errorMessage.includes("email not confirmed")) {
    return {
      code: "EMAIL_NOT_VERIFIED",
      message: "Potwierdź swój adres email aby się zalogować",
    };
  }

  // Invalid reset token
  if (errorMessage.includes("invalid token") || errorMessage.includes("token expired")) {
    return {
      code: "INVALID_RESET_TOKEN",
      message: "Link resetujący hasło wygasł lub jest nieprawidłowy",
    };
  }

  // Default server error
  return {
    code: "SERVER_ERROR",
    message: "Wystąpił błąd serwera. Spróbuj ponownie później.",
  };
}
