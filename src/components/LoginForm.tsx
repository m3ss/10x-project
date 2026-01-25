import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { ErrorNotification } from "./ErrorNotification";
import type { LoginFormProps } from "@/types";

export function LoginForm({ redirectTo = "/generate", message = null }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    if (password.length < 6) {
      setError("Hasło musi mieć minimum 6 znaków");
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        window.location.href = data.redirectTo || redirectTo;
      } else {
        // Use error.message from the new API format
        setError(data.error?.message || "Wystąpił błąd podczas logowania");
      }
    } catch (err) {
      setError("Błąd połączenia. Sprawdź swoje połączenie internetowe");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-8">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Logowanie</CardTitle>
          <CardDescription>Wprowadź swoje dane aby się zalogować</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {message && <ErrorNotification message={message} type="info" />}
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
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Hasło</Label>
                <a
                  href="/reset-password"
                  className="text-sm text-primary hover:underline"
                  tabIndex={-1}
                >
                  Zapomniałeś hasła?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
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
                  Logowanie...
                </>
              ) : (
                "Zaloguj się"
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Nie masz jeszcze konta?{" "}
              <a href="/register" className="text-primary hover:underline font-medium">
                Zarejestruj się
              </a>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
