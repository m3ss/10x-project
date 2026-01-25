import { useState } from "react";
import { Trash2 } from "lucide-react";
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
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { ErrorNotification } from "./ErrorNotification";
import type { AccountSettingsProps } from "@/types";

export function AccountSettings({ user }: AccountSettingsProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    setError(null);

    // Validate confirmation text
    if (confirmText !== "USUŃ KONTO") {
      setError("Nieprawidłowy tekst potwierdzający. Wpisz dokładnie: USUŃ KONTO");
      return;
    }

    setIsDeleting(true);

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
        // Account deleted successfully - redirect to home
        window.location.href = "/?message=Twoje konto zostało trwale usunięte";
      } else {
        setError(data.error?.message || "Nie udało się usunąć konta. Spróbuj ponownie później.");
        setIsDeleting(false);
      }
    } catch (err) {
      setError("Błąd połączenia. Sprawdź swoje połączenie internetowe");
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="space-y-8">
        {/* Account Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Informacje o koncie</CardTitle>
            <CardDescription>Twoje dane konta w 10x-cards</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                {user.email}
              </div>
            </div>
            <div className="space-y-2">
              <Label>ID użytkownika</Label>
              <div className="rounded-md border bg-muted px-3 py-2 font-mono text-xs">
                {user.id}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone - Delete Account */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Niebezpieczna strefa</CardTitle>
            <CardDescription>
              Nieodwracalne akcje dotyczące Twojego konta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <ErrorNotification message={error} type="error" />}

            <div className="space-y-4 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-destructive">Usuń konto</h3>
                <p className="text-sm text-muted-foreground">
                  Usunięcie konta jest <strong>trwałe i nieodwracalne</strong>. Wszystkie Twoje dane zostaną permanentnie usunięte:
                </p>
                <ul className="ml-6 list-disc text-sm text-muted-foreground">
                  <li>Wszystkie Twoje fiszki</li>
                  <li>Historia generowania</li>
                  <li>Logi błędów</li>
                  <li>Dane konta</li>
                </ul>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting}>
                    <Trash2 className="mr-2 size-4" aria-hidden="true" />
                    Usuń konto
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Czy na pewno chcesz usunąć swoje konto?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-4">
                      <p>
                        Ta akcja jest <strong>nieodwracalna</strong>. Wszystkie Twoje dane zostaną
                        trwale usunięte z naszych serwerów.
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="confirmText">
                          Wpisz <strong>USUŃ KONTO</strong> aby potwierdzić:
                        </Label>
                        <Input
                          id="confirmText"
                          type="text"
                          placeholder="USUŃ KONTO"
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                          disabled={isDeleting}
                        />
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || confirmText !== "USUŃ KONTO"}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Usuwanie..." : "Potwierdź usunięcie"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
