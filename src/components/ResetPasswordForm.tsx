import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { ErrorNotification } from "./ErrorNotification";
import type { ResetPasswordFormProps } from "@/types";

export function ResetPasswordForm({ mode, accessToken }: ResetPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getPasswordStrengthErrors = (password: string): string[] => {
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

    return errors;
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email jest wymagany");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Nieprawidłowy format adresu email");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setEmailSent(true);
      } else {
        setError(data.error?.message || "Wystąpił błąd podczas wysyłania linku");
      }
    } catch (err) {
      setError("Błąd połączenia. Sprawdź swoje połączenie internetowe");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const passwordErrors = getPasswordStrengthErrors(newPassword);
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join(". "));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Hasła muszą być identyczne");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newPassword, accessToken }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPasswordUpdated(true);
        setTimeout(() => {
          window.location.href = "/login?message=Hasło zostało zmienione. Możesz się teraz zalogować.";
        }, 2000);
      } else {
        setError(data.error?.message || "Wystąpił błąd podczas zmiany hasła");
      }
    } catch (err) {
      setError("Błąd połączenia. Sprawdź swoje połączenie internetowe");
    } finally {
      setIsLoading(false);
    }
  };

  // Request mode - wysyłanie linku resetującego
  if (mode === "request") {
    if (emailSent) {
      return (
        <div className="container mx-auto max-w-md px-4 py-8">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Sprawdź swoją skrzynkę</CardTitle>
              <CardDescription>Link do resetowania hasła został wysłany</CardDescription>
            </CardHeader>
            <CardContent>
              <ErrorNotification
                message="Jeśli konto z tym adresem email istnieje, otrzymasz link do resetowania hasła. Sprawdź także folder spam."
                type="info"
              />
              <div className="mt-4 text-center">
                <a href="/login" className="text-sm text-primary hover:underline">
                  Powrót do logowania
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="container mx-auto max-w-md px-4 py-8">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Resetowanie hasła</CardTitle>
            <CardDescription>Wprowadź swój adres email, aby otrzymać link do resetowania hasła</CardDescription>
          </CardHeader>
          <form onSubmit={handleRequestSubmit}>
            <CardContent className="space-y-4">
              {error && <ErrorNotification message={error} type="error" />}

              <div className="space-y-2">
                <Label htmlFor="email">Adres email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="twoj@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Wyślemy link do resetowania hasła na podany adres
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <svg
                      className="mr-2 h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Wysyłanie...
                  </>
                ) : (
                  "Wyślij link resetujący"
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Pamiętasz hasło?{" "}
                <a href="/login" className="text-primary hover:underline font-medium">
                  Zaloguj się
                </a>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // Update mode - ustawianie nowego hasła
  if (passwordUpdated) {
    return (
      <div className="container mx-auto max-w-md px-4 py-8">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Hasło zostało zmienione!</CardTitle>
            <CardDescription>Możesz się teraz zalogować nowym hasłem</CardDescription>
          </CardHeader>
          <CardContent>
            <ErrorNotification
              message="Za chwilę zostaniesz przekierowany do strony logowania."
              type="info"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-8">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Ustaw nowe hasło</CardTitle>
          <CardDescription>Wprowadź i potwierdź swoje nowe hasło</CardDescription>
        </CardHeader>
        <form onSubmit={handleUpdateSubmit}>
          <CardContent className="space-y-4">
            {error && <ErrorNotification message={error} type="error" />}

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nowe hasło</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="new-password"
                required
              />
              <p className="text-xs text-muted-foreground">
                Minimum 8 znaków, zawierające cyfrę i znak specjalny
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Potwierdź nowe hasło</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="new-password"
                required
              />
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Zapisywanie...
                </>
              ) : (
                "Ustaw nowe hasło"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
