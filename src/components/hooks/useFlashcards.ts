import { useState, useCallback } from "react";
import type { FlashcardDto, FlashcardsListResponseDto, PaginationDto } from "@/types";

interface UseFlashcardsResult {
  flashcards: FlashcardDto[];
  pagination: PaginationDto | null;
  isLoading: boolean;
  error: string | null;
  fetchFlashcards: (page?: number, limit?: number, source?: string) => Promise<void>;
  deleteFlashcard: (id: number) => Promise<void>;
  updateFlashcard: (id: number, front: string, back: string) => Promise<void>;
  refreshFlashcards: () => Promise<void>;
}

/**
 * Hook for managing flashcards list with CRUD operations
 */
export function useFlashcards(): UseFlashcardsResult {
  const [flashcards, setFlashcards] = useState<FlashcardDto[]>([]);
  const [pagination, setPagination] = useState<PaginationDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLimit, setCurrentLimit] = useState(20);
  const [currentSource, setCurrentSource] = useState<string | undefined>(undefined);

  /**
   * Fetch flashcards from the API
   */
  const fetchFlashcards = useCallback(async (page = 1, limit = 20, source?: string) => {
    setIsLoading(true);
    setError(null);
    setCurrentPage(page);
    setCurrentLimit(limit);
    setCurrentSource(source);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort: "created_at",
        order: "desc",
      });

      if (source) {
        params.append("source", source);
      }

      console.log("[useFlashcards] Fetching flashcards with params:", params.toString());

      const response = await fetch(`/api/flashcards?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
      });

      console.log("[useFlashcards] Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[useFlashcards] Error response:", errorData);
        throw new Error(errorData.message || "Nie udało się pobrać fiszek");
      }

      const data: FlashcardsListResponseDto = await response.json();
      console.log("[useFlashcards] Success! Received flashcards:", data);
      setFlashcards(data.data);
      setPagination(data.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd";
      setError(errorMessage);
      console.error("Error fetching flashcards:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh flashcards with current parameters
   */
  const refreshFlashcards = useCallback(async () => {
    await fetchFlashcards(currentPage, currentLimit, currentSource);
  }, [fetchFlashcards, currentPage, currentLimit, currentSource]);

  /**
   * Delete a flashcard
   */
  const deleteFlashcard = useCallback(
    async (id: number) => {
      try {
        const response = await fetch(`/api/flashcards/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Nie udało się usunąć fiszki");
        }

        // Remove flashcard from local state
        setFlashcards((prev) => prev.filter((f) => f.id !== id));

        // Update pagination count
        if (pagination) {
          setPagination({
            ...pagination,
            total: pagination.total - 1,
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd";
        setError(errorMessage);
        console.error("Error deleting flashcard:", err);
        throw err; // Re-throw to allow caller to handle
      }
    },
    [pagination]
  );

  /**
   * Update a flashcard
   */
  const updateFlashcard = useCallback(async (id: number, front: string, back: string) => {
    try {
      const response = await fetch(`/api/flashcards/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ front, back }),
        credentials: "same-origin",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Nie udało się zaktualizować fiszki");
      }

      const result = await response.json();
      const updatedFlashcard: FlashcardDto = result.data;

      // Update flashcard in local state
      setFlashcards((prev) => prev.map((f) => (f.id === id ? updatedFlashcard : f)));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd";
      setError(errorMessage);
      console.error("Error updating flashcard:", err);
      throw err; // Re-throw to allow caller to handle
    }
  }, []);

  return {
    flashcards,
    pagination,
    isLoading,
    error,
    fetchFlashcards,
    deleteFlashcard,
    updateFlashcard,
    refreshFlashcards,
  };
}
