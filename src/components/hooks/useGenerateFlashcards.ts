import { useState } from "react";
import type { GenerateFlashcardsCommand, GenerationCreateResponseDto, FlashcardProposalViewModel } from "@/types";

interface UseGenerateFlashcardsReturn {
  isLoading: boolean;
  error: string | null;
  flashcards: FlashcardProposalViewModel[];
  generationId: number | null;
  generateFlashcards: (sourceText: string) => Promise<void>;
  resetFlashcards: () => void;
}

export function useGenerateFlashcards(): UseGenerateFlashcardsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardProposalViewModel[]>([]);
  const [generationId, setGenerationId] = useState<number | null>(null);

  const generateFlashcards = async (sourceText: string): Promise<void> => {
    // Walidacja długości tekstu
    if (sourceText.length < 1000 || sourceText.length > 10000) {
      setError("Tekst musi mieć długość od 1000 do 10000 znaków.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setFlashcards([]);
    setGenerationId(null);

    try {
      const command: GenerateFlashcardsCommand = {
        source_text: sourceText,
      };

      const response = await fetch("/api/generations", {
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
        throw new Error("Wystąpił nieoczekiwany błąd.");
      }

      const data: GenerationCreateResponseDto = await response.json();

      // Przekształcenie FlashcardProposalDto na FlashcardProposalViewModel
      const viewModels: FlashcardProposalViewModel[] = data.flashcards_proposals.map((proposal) => ({
        front: proposal.front,
        back: proposal.back,
        source: proposal.source,
        accepted: false,
        edited: false,
      }));

      setFlashcards(viewModels);
      setGenerationId(data.generation_id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nie udało się wygenerować fiszek.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetFlashcards = (): void => {
    setFlashcards([]);
    setGenerationId(null);
    setError(null);
  };

  return {
    isLoading,
    error,
    flashcards,
    generationId,
    generateFlashcards,
    resetFlashcards,
  };
}
