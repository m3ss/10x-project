import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { ErrorNotification } from "./ErrorNotification";
import type { RegisterFormProps } from "@/types";

export function RegisterForm({}: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setError("Email jest wymagany");
      return false;
    }

    if (!isValidEmail(email)) {
      setError("Nieprawidłowy format adresu email");
      return false;
    }

    if (!password) {
      setError("Hasło jest wymagane");
      return false;
    }

    if (password.length < 8) {
      setError("Hasło musi mieć minimum 8 znaków");
      return false;
    }

    if (!/\d/.test(password)) {
      setError("Hasło musi zawierać co najmniej jedną cyfrę");
      return false;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setError("Hasło musi zawierać co najmniej jeden znak specjalny");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Hasła nie są identyczne");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Automatically redirects after successful registration
        window.location.href = data.redirectTo || "/generate";
      } else {
        // Use error.message from the API format
        setError(data.error?.message || "Wystąpił błąd podczas rejestracji");
      }
    } catch (err) {
      setError("Błąd połączenia. Sprawdź swoje połączenie internetowe");
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time password strength indicator
  const getPasswordStrength = (): { text: string; color: string } => {
    if (!password) return { text: "", color: "" };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    if (password.length >= 12) strength++;

    if (strength <= 1) return { text: "Słabe", color: "text-red-600" };
    if (strength === 2) return { text: "Średnie", color: "text-yellow-600" };
    if (strength === 3) return { text: "Dobre", color: "text-blue-600" };
    return { text: "Bardzo dobre", color: "text-green-600" };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="container mx-auto max-w-md px-4 py-8">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Rejestracja</CardTitle>
          <CardDescription>Utwórz konto aby korzystać z 10x-cards</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
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
                Użyjemy tego adresu do weryfikacji konta
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="new-password"
                required
              />
              {password && (
                <p className={`text-xs ${passwordStrength.color}`}>
                  Siła hasła: {passwordStrength.text}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Minimum 8 znaków, zawierające cyfrę i znak specjalny
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
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
                  Tworzenie konta...
                </>
              ) : (
                "Zarejestruj się"
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Masz już konto?{" "}
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
