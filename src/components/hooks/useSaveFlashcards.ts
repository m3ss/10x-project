import { useState } from "react";
import type { FlashcardsCreateCommand, FlashcardCreateDto, FlashcardProposalViewModel } from "@/types";

interface UseSaveFlashcardsReturn {
  isSaving: boolean;
  saveError: string | null;
  saveSuccess: boolean;
  savedCount: number;
  saveFlashcards: (flashcards: FlashcardProposalViewModel[], generationId: number) => Promise<boolean>;
  resetSaveState: () => void;
}

export function useSaveFlashcards(): UseSaveFlashcardsReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const validateFlashcard = (flashcard: FlashcardProposalViewModel): boolean => {
    if (!flashcard.front || flashcard.front.trim().length === 0) {
      return false;
    }
    if (!flashcard.back || flashcard.back.trim().length === 0) {
      return false;
    }
    if (flashcard.front.length > 200) {
      return false;
    }
    if (flashcard.back.length > 500) {
      return false;
    }
    return true;
  };

  const saveFlashcards = async (flashcards: FlashcardProposalViewModel[], generationId: number): Promise<boolean> => {
    // Walidacja wejściowa
    if (flashcards.length === 0) {
      setSaveError("Brak fiszek do zapisu.");
      return false;
    }

    if (!generationId) {
      setSaveError("Brak identyfikatora generacji.");
      return false;
    }

    // Walidacja każdej fiszki
    const invalidFlashcard = flashcards.find((f) => !validateFlashcard(f));
    if (invalidFlashcard) {
      setSaveError(
        "Jedna lub więcej fiszek zawiera nieprawidłowe dane. Upewnij się, że przód ma maksymalnie 200 znaków, a tył 500 znaków."
      );
      return false;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    setSavedCount(0);

    try {
      // Przekształcenie FlashcardProposalViewModel na FlashcardCreateDto
      const flashcardsToSave: FlashcardCreateDto[] = flashcards.map((flashcard) => ({
        front: flashcard.front.trim(),
        back: flashcard.back.trim(),
        source: flashcard.source,
        generation_id: generationId,
      }));

      const command: FlashcardsCreateCommand = {
        flashcards: flashcardsToSave,
      };

      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Błąd walidacji danych.");
        }
        if (response.status === 500) {
          throw new Error("Błąd serwera. Spróbuj ponownie później.");
        }
        throw new Error("Wystąpił nieoczekiwany błąd podczas zapisu.");
      }

      const result = await response.json();

      setSaveSuccess(true);
      setSavedCount(flashcards.length);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nie udało się zapisać fiszek.";
      setSaveError(errorMessage);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const resetSaveState = (): void => {
    setSaveError(null);
    setSaveSuccess(false);
    setSavedCount(0);
  };

  return {
    isSaving,
    saveError,
    saveSuccess,
    savedCount,
    saveFlashcards,
    resetSaveState,
  };
}
