import { memo } from "react";
import { Button } from "./ui/button";
import type { FlashcardProposalViewModel } from "@/types";

interface BulkSaveButtonProps {
  flashcards: FlashcardProposalViewModel[];
  generationId: number | null;
  isSaving: boolean;
  onSaveAll: () => void;
  onSaveAccepted: () => void;
}

export const BulkSaveButton = memo(function BulkSaveButton({
  flashcards,
  generationId,
  isSaving,
  onSaveAll,
  onSaveAccepted,
}: BulkSaveButtonProps) {
  const acceptedFlashcards = flashcards.filter((f) => f.accepted);
  const hasFlashcards = flashcards.length > 0;
  const hasAcceptedFlashcards = acceptedFlashcards.length > 0;
  const canSave = generationId !== null && !isSaving;

  if (!hasFlashcards) {
    return null;
  }

  return (
    <div
      className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900"
      data-testid="bulk-save-button"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Info section */}
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Zapisz fiszki do bazy danych</h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            Wszystkich:{" "}
            <span className="font-semibold" data-testid="total-flashcards-count">
              {flashcards.length}
            </span>{" "}
            | Zaakceptowanych:{" "}
            <span className="font-semibold text-green-600 dark:text-green-400" data-testid="accepted-flashcards-count">
              {acceptedFlashcards.length}
            </span>
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={onSaveAll}
            disabled={!canSave || !hasFlashcards}
            variant="default"
            size="sm"
            className="flex-1 sm:flex-none"
            data-testid="save-all-button"
          >
            {isSaving ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Zapisywanie...
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
                Zapisz wszystkie ({flashcards.length})
              </>
            )}
          </Button>

          <Button
            onClick={onSaveAccepted}
            disabled={!canSave || !hasAcceptedFlashcards}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
            data-testid="save-accepted-button"
          >
            {isSaving ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Zapisywanie...
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Zapisz zaakceptowane ({acceptedFlashcards.length})
              </>
            )}
          </Button>
        </div>
      </div>

      {!generationId && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-500">
          Brak identyfikatora generacji. Wygeneruj fiszki ponownie.
        </p>
      )}
    </div>
  );
});
