import { useEffect, useState, useCallback } from "react";
import { useFlashcards } from "./hooks/useFlashcards";
import { FlashcardCard } from "./FlashcardCard";
import { CreateFlashcardDialog } from "./CreateFlashcardDialog";
import { Button } from "./ui/button";
import { ErrorNotification } from "./ErrorNotification";
import { SkeletonLoader } from "./SkeletonLoader";
import type { Source } from "@/types";

export function MyFlashcardsView() {
  const {
    flashcards,
    pagination,
    isLoading,
    error,
    fetchFlashcards,
    deleteFlashcard,
    updateFlashcard,
    refreshFlashcards,
  } = useFlashcards();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<Source | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch flashcards on mount and when filters change
  useEffect(() => {
    const source = sourceFilter === "all" ? undefined : sourceFilter;
    fetchFlashcards(currentPage, 20, source);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, sourceFilter]);

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deleteFlashcard(id);
      } catch (error) {
        console.error("Failed to delete flashcard:", error);
        throw error; // Re-throw so FlashcardCard can handle it
      }
    },
    [deleteFlashcard]
  );

  const handleUpdate = useCallback(
    async (id: number, front: string, back: string) => {
      try {
        await updateFlashcard(id, front, back);
      } catch (error) {
        console.error("Failed to update flashcard:", error);
      }
    },
    [updateFlashcard]
  );

  const handleCreateSuccess = useCallback(() => {
    setIsCreateDialogOpen(false);
    refreshFlashcards();
  }, [refreshFlashcards]);

  const handleFilterChange = (filter: Source | "all") => {
    setSourceFilter(filter);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 0;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Moje fiszki</h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              {pagination ? `Łącznie: ${pagination.total} fiszek` : "Ładowanie..."}
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Dodaj fiszkę
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={sourceFilter === "all" ? "default" : "outline"}
            onClick={() => handleFilterChange("all")}
            size="sm"
          >
            Wszystkie
          </Button>
          <Button
            variant={sourceFilter === "ai-full" ? "default" : "outline"}
            onClick={() => handleFilterChange("ai-full")}
            size="sm"
          >
            AI (pełne)
          </Button>
          <Button
            variant={sourceFilter === "ai-edited" ? "default" : "outline"}
            onClick={() => handleFilterChange("ai-edited")}
            size="sm"
          >
            AI (edytowane)
          </Button>
          <Button
            variant={sourceFilter === "manual" ? "default" : "outline"}
            onClick={() => handleFilterChange("manual")}
            size="sm"
          >
            Ręczne
          </Button>
        </div>

        {/* Error Display */}
        {error && <ErrorNotification message={error} type="error" />}

        {/* Loading State */}
        {isLoading && <SkeletonLoader count={5} />}

        {/* Empty State */}
        {!isLoading && flashcards.length === 0 && (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-12 text-center dark:border-neutral-800 dark:bg-neutral-900">
            <svg
              className="mx-auto h-16 w-16 text-neutral-400 dark:text-neutral-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="mt-4 text-lg font-medium text-neutral-900 dark:text-neutral-100">
              Nie masz jeszcze żadnych fiszek
            </p>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400">
              Zacznij od utworzenia pierwszej fiszki lub wygeneruj je za pomocą AI
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button onClick={() => setIsCreateDialogOpen(true)}>Utwórz fiszkę</Button>
              <Button variant="outline" onClick={() => (window.location.href = "/generate")}>
                Generuj z AI
              </Button>
            </div>
          </div>
        )}

        {/* Flashcards List */}
        {!isLoading && flashcards.length > 0 && (
          <div className="space-y-4">
            {flashcards.map((flashcard) => (
              <FlashcardCard
                key={flashcard.id}
                flashcard={flashcard}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Poprzednia
            </Button>
            <span className="px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300">
              Strona {currentPage} z {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Następna
            </Button>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <CreateFlashcardDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
