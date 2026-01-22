import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { ErrorNotification } from "./ErrorNotification";
import type { AccountSettingsProps } from "@/types";

export function AccountSettings({ user }: AccountSettingsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (confirmText !== "USUŃ KONTO") {
      setError("Nieprawidłowy tekst potwierdzający");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confirmText }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Przekierowanie do strony głównej z komunikatem
        window.location.href = "/?message=Twoje konto zostało trwale usunięte";
      } else {
        setError(data.error?.message || "Nie udało się usunąć konta. Spróbuj ponownie później");
        setIsDeleting(false);
      }
    } catch (err) {
      setError("Błąd połączenia. Sprawdź swoje połączenie internetowe");
      setIsDeleting(false);
    }
  };

  const handleOpenDeleteDialog = () => {
    setShowDeleteDialog(true);
    setConfirmText("");
    setError(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setConfirmText("");
    setError(null);
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Ustawienia konta</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Zarządzaj swoim kontem i danymi osobowymi</p>
        </div>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informacje o koncie</CardTitle>
            <CardDescription>Twoje podstawowe dane konta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Adres email</Label>
              <Input value={user.email} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>ID użytkownika</Label>
              <Input value={user.id} disabled className="bg-muted font-mono text-xs" />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Niebezpieczna strefa</CardTitle>
            <CardDescription>Nieodwracalne akcje na Twoim koncie</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
              <h3 className="text-sm font-medium mb-2">Usunięcie konta</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Usunięcie konta jest <strong>trwałe i nie można go cofnąć</strong>. Wszystkie Twoje fiszki, generacje i
                dane zostaną bezpowrotnie usunięte.
              </p>
              <Button variant="destructive" onClick={handleOpenDeleteDialog} disabled={isDeleting}>
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Usuń konto
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Delete Account Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Czy na pewno chcesz usunąć swoje konto?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  <p>
                    Ta akcja jest <strong className="text-destructive">nieodwracalna</strong>. Wszystkie Twoje dane
                    zostaną trwale usunięte:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Konto użytkownika</li>
                    <li>Wszystkie fiszki</li>
                    <li>Wszystkie generacje AI</li>
                    <li>Historia i logi</li>
                  </ul>
                  {error && (
                    <div className="mt-4">
                      <ErrorNotification message={error} type="error" />
                    </div>
                  )}
                  <div className="mt-4">
                    <Label htmlFor="confirmDelete">
                      Wpisz <span className="font-mono font-bold">USUŃ KONTO</span> aby potwierdzić
                    </Label>
                    <Input
                      id="confirmDelete"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="USUŃ KONTO"
                      className="mt-2"
                      disabled={isDeleting}
                      autoComplete="off"
                    />
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelDelete} disabled={isDeleting}>
                Anuluj
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={confirmText !== "USUŃ KONTO" || isDeleting}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {isDeleting ? (
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
                    Usuwanie...
                  </>
                ) : (
                  "Potwierdź usunięcie"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
