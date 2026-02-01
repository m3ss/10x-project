import { useState, memo } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { EditFlashcardDialog } from "./EditFlashcardDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { FlashcardDto } from "@/types";

interface FlashcardCardProps {
  flashcard: FlashcardDto;
  onDelete: (id: number) => Promise<void>;
  onUpdate: (id: number, front: string, back: string) => void;
}

export const FlashcardCard = memo(function FlashcardCard({ flashcard, onDelete, onUpdate }: FlashcardCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleEditSuccess = (front: string, back: string) => {
    onUpdate(flashcard.id, front, back);
    setIsEditDialogOpen(false);
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete(flashcard.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete flashcard:", error);
      setIsDeleting(false);
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "ai-full":
        return (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            AI
          </span>
        );
      case "ai-edited":
        return (
          <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            AI (edytowane)
          </span>
        );
      case "manual":
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
            Ręczne
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <>
      <Card className="p-6 transition-all hover:shadow-md" data-testid={`flashcard-card-${flashcard.id}`}>
        <div className="space-y-4">
          {/* Header with source badge */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              {getSourceBadge(flashcard.source)}
              <p className="text-xs text-neutral-500 dark:text-neutral-400" data-testid="flashcard-created-date">
                Utworzono: {formatDate(flashcard.created_at)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
                data-testid="edit-flashcard-button"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span className="ml-2">Edytuj</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeleteClick} data-testid="delete-flashcard-button">
                <svg
                  className="h-4 w-4 text-red-600 dark:text-red-400"
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
                <span className="ml-2">Usuń</span>
              </Button>
            </div>
          </div>

          {/* Flashcard content with flip effect */}
          <div
            className="relative min-h-[120px] cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsFlipped(!isFlipped);
              }
            }}
            aria-label={isFlipped ? "Pokaż przód fiszki" : "Pokaż tył fiszki"}
            data-testid="flashcard-flip-area"
          >
            <div
              className={`rounded-lg border border-neutral-200 bg-white p-6 transition-all dark:border-neutral-700 dark:bg-neutral-800 ${
                isFlipped ? "opacity-0" : "opacity-100"
              }`}
              data-testid="flashcard-front"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Przód
              </p>
              <p className="mt-2 text-base text-neutral-900 dark:text-neutral-100">{flashcard.front}</p>
            </div>
            {isFlipped && (
              <div
                className="absolute inset-0 rounded-lg border border-neutral-200 bg-neutral-50 p-6 transition-all dark:border-neutral-700 dark:bg-neutral-900"
                data-testid="flashcard-back"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Tył
                </p>
                <p className="mt-2 text-base text-neutral-900 dark:text-neutral-100">{flashcard.back}</p>
              </div>
            )}
          </div>

          {/* Flip hint */}
          <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
            Kliknij, aby {isFlipped ? "zobaczyć przód" : "zobaczyć tył"}
          </p>
        </div>
      </Card>

      {/* Edit Dialog */}
      <EditFlashcardDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={handleEditSuccess}
        initialFront={flashcard.front}
        initialBack={flashcard.back}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </>
  );
});
