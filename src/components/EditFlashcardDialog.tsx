import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "./ui/alert-dialog";

interface EditFlashcardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (front: string, back: string) => void;
  initialFront: string;
  initialBack: string;
}

export function EditFlashcardDialog({
  isOpen,
  onClose,
  onSave,
  initialFront,
  initialBack,
}: EditFlashcardDialogProps) {
  const [front, setFront] = useState(initialFront);
  const [back, setBack] = useState(initialBack);
  const [errors, setErrors] = useState<{ front?: string; back?: string }>({});

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFront(initialFront);
      setBack(initialBack);
      setErrors({});
    }
  }, [isOpen, initialFront, initialBack]);

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

  const handleSave = () => {
    if (validate()) {
      onSave(front.trim(), back.trim());
    }
  };

  const handleCancel = () => {
    setFront(initialFront);
    setBack(initialBack);
    setErrors({});
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleCancel}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Edytuj fiszkę</AlertDialogTitle>
          <AlertDialogDescription>
            Wprowadź zmiany w treści fiszki. Pamiętaj, że zmiany będą natychmiast zapisane.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Front field */}
          <div className="space-y-2">
            <Label htmlFor="edit-front">
              Przód fiszki
              <span className="ml-1 text-xs text-neutral-500 dark:text-neutral-400">
                ({front.length}/200)
              </span>
            </Label>
            <textarea
              id="edit-front"
              className="flex min-h-[80px] w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Wpisz pytanie lub pojęcie..."
              maxLength={200}
            />
            {errors.front && <p className="text-sm text-red-600 dark:text-red-400">{errors.front}</p>}
          </div>

          {/* Back field */}
          <div className="space-y-2">
            <Label htmlFor="edit-back">
              Tył fiszki
              <span className="ml-1 text-xs text-neutral-500 dark:text-neutral-400">
                ({back.length}/500)
              </span>
            </Label>
            <textarea
              id="edit-back"
              className="flex min-h-[120px] w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Wpisz odpowiedź lub wyjaśnienie..."
              maxLength={500}
            />
            {errors.back && <p className="text-sm text-red-600 dark:text-red-400">{errors.back}</p>}
          </div>
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Anuluj
          </Button>
          <Button onClick={handleSave}>Zapisz zmiany</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
