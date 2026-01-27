import { useState, useCallback } from "react";
import type { FlashcardDto } from "@/types";

interface UseCreateFlashcardResult {
  isCreating: boolean;
  error: string | null;
  success: boolean;
  createFlashcard: (front: string, back: string) => Promise<FlashcardDto | null>;
  resetState: () => void;
}

/**
 * Hook for creating manual flashcards
 */
export function useCreateFlashcard(): UseCreateFlashcardResult {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Create a new manual flashcard
   */
  const createFlashcard = useCallback(async (front: string, back: string): Promise<FlashcardDto | null> => {
    setIsCreating(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flashcards: [
            {
              front: front.trim(),
              back: back.trim(),
              source: "manual",
              generation_id: null,
            },
          ],
        }),
        credentials: "same-origin",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Nie udało się utworzyć fiszki");
      }

      const result = await response.json();
      const createdFlashcard: FlashcardDto = result.data[0];

      setSuccess(true);
      return createdFlashcard;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd";
      setError(errorMessage);
      console.error("Error creating flashcard:", err);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  /**
   * Reset state
   */
  const resetState = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return {
    isCreating,
    error,
    success,
    createFlashcard,
    resetState,
  };
}
