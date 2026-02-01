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

  const validateRequestForm = (): boolean => {
    if (!email.trim()) {
      setError("Email jest wymagany");
      return false;
    }

    if (!isValidEmail(email)) {
      setError("Nieprawidłowy format adresu email");
      return false;
    }

    return true;
  };

  const validateUpdateForm = (): boolean => {
    if (!newPassword) {
      setError("Nowe hasło jest wymagane");
      return false;
    }

    if (newPassword.length < 8) {
      setError("Hasło musi mieć minimum 8 znaków");
      return false;
    }

    if (!/\d/.test(newPassword)) {
      setError("Hasło musi zawierać co najmniej jedną cyfrę");
      return false;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      setError("Hasło musi zawierać co najmniej jeden znak specjalny");
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError("Hasła nie są identyczne");
      return false;
    }

    return true;
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateRequestForm()) {
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

    if (!validateUpdateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPasswordUpdated(true);
        // Redirect to login after 2 seconds
        setTimeout(() => {
          window.location.href = data.redirectTo || "/login";
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

  // Real-time password strength indicator
  const getPasswordStrength = (): { text: string; color: string } => {
    if (!newPassword) return { text: "", color: "" };

    let strength = 0;
    if (newPassword.length >= 8) strength++;
    if (/\d/.test(newPassword)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) strength++;
    if (newPassword.length >= 12) strength++;

    if (strength <= 1) return { text: "Słabe", color: "text-red-600" };
    if (strength === 2) return { text: "Średnie", color: "text-yellow-600" };
    if (strength === 3) return { text: "Dobre", color: "text-blue-600" };
    return { text: "Bardzo dobre", color: "text-green-600" };
  };

  const passwordStrength = getPasswordStrength();

  // Request mode - send reset link
  if (mode === "request") {
    if (emailSent) {
      return (
        <div className="container mx-auto max-w-md px-4 py-8">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Sprawdź swoją skrzynkę email</CardTitle>
              <CardDescription>Wysłaliśmy link do resetowania hasła na podany adres email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ErrorNotification
                message="Jeśli nie otrzymasz emaila w ciągu kilku minut, sprawdź folder spam"
                type="info"
              />
              <div className="text-center">
                <a href="/login" className="text-primary hover:underline font-medium">
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
            <CardDescription>Wprowadź swój email aby otrzymać link do resetowania hasła</CardDescription>
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
                <p className="text-xs text-muted-foreground">Wyślemy link do resetowania hasła na podany adres</p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Wysyłanie..." : "Wyślij link resetujący"}
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

  // Update mode - set new password
  if (passwordUpdated) {
    return (
      <div className="container mx-auto max-w-md px-4 py-8">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Hasło zmienione!</CardTitle>
            <CardDescription>Twoje hasło zostało pomyślnie zmienione</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ErrorNotification message="Za chwilę zostaniesz przekierowany do strony logowania" type="info" />
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
          <CardDescription>Wprowadź nowe hasło do swojego konta</CardDescription>
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
              {newPassword && (
                <p className={`text-xs ${passwordStrength.color}`}>Siła hasła: {passwordStrength.text}</p>
              )}
              <p className="text-xs text-muted-foreground">Minimum 8 znaków, zawierające cyfrę i znak specjalny</p>
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

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Zapisywanie..." : "Ustaw nowe hasło"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <a href="/login" className="text-primary hover:underline font-medium">
                Powrót do logowania
              </a>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
