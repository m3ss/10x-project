import { useState, useId, memo } from "react";
import { Button } from "./ui/button";
import type { FlashcardProposalViewModel } from "@/types";

interface FlashcardListItemProps {
  flashcard: FlashcardProposalViewModel;
  index: number;
  onAccept: (index: number) => void;
  onEdit: (index: number, front: string, back: string) => void;
  onReject: (index: number) => void;
}

export const FlashcardListItem = memo(function FlashcardListItem({
  flashcard,
  index,
  onAccept,
  onEdit,
  onReject,
}: FlashcardListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFront, setEditedFront] = useState(flashcard.front);
  const [editedBack, setEditedBack] = useState(flashcard.back);

  const frontId = useId();
  const backId = useId();

  const maxFrontLength = 200;
  const maxBackLength = 500;

  const isFrontValid = editedFront.trim().length > 0 && editedFront.length <= maxFrontLength;
  const isBackValid = editedBack.trim().length > 0 && editedBack.length <= maxBackLength;
  const isEditValid = isFrontValid && isBackValid;

  const handleSaveEdit = () => {
    if (!isEditValid) return;
    onEdit(index, editedFront.trim(), editedBack.trim());
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedFront(flashcard.front);
    setEditedBack(flashcard.back);
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setEditedFront(flashcard.front);
    setEditedBack(flashcard.back);
    setIsEditing(true);
  };

  return (
    <div
      className={`rounded-lg border p-6 transition-all ${
        flashcard.accepted
          ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
          : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
      }`}
      data-testid={`flashcard-card-${index}`}
    >
      {/* Header with status and actions */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {flashcard.accepted && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/50 dark:text-green-300">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Zaakceptowana
            </span>
          )}
          {flashcard.edited && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Edytowana
            </span>
          )}
        </div>

        {!isEditing && (
          <div className="flex gap-2">
            <Button
              onClick={() => onAccept(index)}
              variant={flashcard.accepted ? "outline" : "default"}
              size="sm"
              aria-label={flashcard.accepted ? "Odznacz fiszkę" : "Zatwierdź fiszkę"}
            >
              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={flashcard.accepted ? "M6 18L18 6M6 6l12 12" : "M5 13l4 4L19 7"}
                />
              </svg>
              {flashcard.accepted ? "Odznacz" : "Zatwierdź"}
            </Button>
            <Button onClick={handleStartEdit} variant="outline" size="sm">
              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edytuj
            </Button>
            <Button
              onClick={() => onReject(index)}
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/50"
            >
              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Odrzuć
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        /* Edit Mode */
        <div className="space-y-4">
          {/* Front input */}
          <div className="space-y-2">
            <label htmlFor={frontId} className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Przód fiszki
            </label>
            <textarea
              id={frontId}
              value={editedFront}
              onChange={(e) => setEditedFront(e.target.value)}
              rows={2}
              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 resize-y ${
                !isFrontValid
                  ? "border-red-500 focus:ring-red-500 dark:border-red-600"
                  : "border-neutral-300 focus:ring-neutral-500 dark:border-neutral-700"
              } dark:bg-neutral-900 dark:text-neutral-100`}
              aria-describedby={`${frontId}-count`}
              aria-invalid={!isFrontValid}
            />
            <div
              id={`${frontId}-count`}
              className={`text-xs ${
                !isFrontValid ? "text-red-600 dark:text-red-400" : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              {editedFront.length} / {maxFrontLength} znaków
              {editedFront.length > maxFrontLength && ` (przekroczono o ${editedFront.length - maxFrontLength})`}
            </div>
          </div>

          {/* Back input */}
          <div className="space-y-2">
            <label htmlFor={backId} className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Tył fiszki
            </label>
            <textarea
              id={backId}
              value={editedBack}
              onChange={(e) => setEditedBack(e.target.value)}
              rows={4}
              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 resize-y ${
                !isBackValid
                  ? "border-red-500 focus:ring-red-500 dark:border-red-600"
                  : "border-neutral-300 focus:ring-neutral-500 dark:border-neutral-700"
              } dark:bg-neutral-900 dark:text-neutral-100`}
              aria-describedby={`${backId}-count`}
              aria-invalid={!isBackValid}
            />
            <div
              id={`${backId}-count`}
              className={`text-xs ${
                !isBackValid ? "text-red-600 dark:text-red-400" : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              {editedBack.length} / {maxBackLength} znaków
              {editedBack.length > maxBackLength && ` (przekroczono o ${editedBack.length - maxBackLength})`}
            </div>
          </div>

          {/* Edit actions */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSaveEdit} disabled={!isEditValid} size="sm">
              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Zapisz zmiany
            </Button>
            <Button onClick={handleCancelEdit} variant="outline" size="sm">
              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Anuluj
            </Button>
          </div>
        </div>
      ) : (
        /* View Mode */
        <div className="space-y-4">
          {/* Front display */}
          <div className="space-y-1">
            <div className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Przód
            </div>
            <p className="text-sm text-neutral-900 dark:text-neutral-100">{flashcard.front}</p>
          </div>

          {/* Back display */}
          <div className="space-y-1">
            <div className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Tył
            </div>
            <p className="text-sm text-neutral-900 dark:text-neutral-100">{flashcard.back}</p>
          </div>
        </div>
      )}
    </div>
  );
});
