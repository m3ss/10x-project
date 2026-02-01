import { useState, useEffect } from "react";
import { useCreateFlashcard } from "./hooks/useCreateFlashcard";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "./ui/alert-dialog";
import { ErrorNotification } from "./ErrorNotification";

interface CreateFlashcardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateFlashcardDialog({ isOpen, onClose, onSuccess }: CreateFlashcardDialogProps) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [errors, setErrors] = useState<{ front?: string; back?: string }>({});

  const { isCreating, error, success, createFlashcard, resetState } = useCreateFlashcard();

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFront("");
      setBack("");
      setErrors({});
      resetState();
    }
  }, [isOpen, resetState]);

  // Handle success
  useEffect(() => {
    if (success) {
      onSuccess();
    }
  }, [success, onSuccess]);

  const validate = (): boolean => {
    const newErrors: { front?: string; back?: string } = {};

    if (!front.trim()) {
      newErrors.front = "Przód fiszki nie może być pusty";
    } else if (front.length > 200) {
      newErrors.front = "Przód fiszki nie może przekraczać 200 znaków";
    }

    if (!back.trim()) {
      newErrors.back = "Tył fiszki nie może być pusty";
    } else if (back.length > 500) {
      newErrors.back = "Tył fiszki nie może przekraczać 500 znaków";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (validate()) {
      await createFlashcard(front.trim(), back.trim());
    }
  };

  const handleCancel = () => {
    setFront("");
    setBack("");
    setErrors({});
    resetState();
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleCancel}>
      <AlertDialogContent className="max-w-2xl" data-testid="create-flashcard-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Utwórz nową fiszkę</AlertDialogTitle>
          <AlertDialogDescription>
            Ręcznie dodaj nową fiszkę do swojej kolekcji. Wprowadź pytanie i odpowiedź.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && <ErrorNotification message={error} type="error" data-testid="create-flashcard-error" />}

        <div className="space-y-4 py-4">
          {/* Front field */}
          <div className="space-y-2">
            <Label htmlFor="create-front">
              Przód fiszki
              <span className="ml-1 text-xs text-neutral-500 dark:text-neutral-400">({front.length}/200)</span>
            </Label>
            <textarea
              id="create-front"
              data-testid="create-front-input"
              className="flex min-h-[80px] w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Wpisz pytanie lub pojęcie..."
              maxLength={200}
              disabled={isCreating}
            />
            {errors.front && (
              <p className="text-sm text-red-600 dark:text-red-400" data-testid="create-front-error">
                {errors.front}
              </p>
            )}
          </div>

          {/* Back field */}
          <div className="space-y-2">
            <Label htmlFor="create-back">
              Tył fiszki
              <span className="ml-1 text-xs text-neutral-500 dark:text-neutral-400">({back.length}/500)</span>
            </Label>
            <textarea
              id="create-back"
              data-testid="create-back-input"
              className="flex min-h-[120px] w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Wpisz odpowiedź lub wyjaśnienie..."
              maxLength={500}
              disabled={isCreating}
            />
            {errors.back && (
              <p className="text-sm text-red-600 dark:text-red-400" data-testid="create-back-error">
                {errors.back}
              </p>
            )}
          </div>
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isCreating} data-testid="create-cancel-button">
            Anuluj
          </Button>
          <Button onClick={handleCreate} disabled={isCreating} data-testid="create-submit-button">
            {isCreating ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Tworzenie...
              </>
            ) : (
              "Utwórz fiszkę"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
