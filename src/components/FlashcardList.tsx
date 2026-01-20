import { memo } from "react";
import { FlashcardListItem } from "./FlashcardListItem";
import type { FlashcardProposalViewModel } from "@/types";

interface FlashcardListProps {
  flashcards: FlashcardProposalViewModel[];
  onAccept: (index: number) => void;
  onEdit: (index: number, front: string, back: string) => void;
  onReject: (index: number) => void;
}

export const FlashcardList = memo(function FlashcardList({
  flashcards,
  onAccept,
  onEdit,
  onReject,
}: FlashcardListProps) {
  if (flashcards.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
        <svg
          className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-600"
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
        <p className="mt-4 text-neutral-600 dark:text-neutral-400">Brak wygenerowanych fiszek</p>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-500">
          Wprowadź tekst i kliknij "Generuj fiszki", aby rozpocząć
        </p>
      </div>
    );
  }

  const acceptedCount = flashcards.filter((f) => f.accepted).length;

  return (
    <div className="space-y-4">
      {/* Stats header */}
      <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-6">
          <div className="text-sm">
            <span className="font-medium text-neutral-700 dark:text-neutral-300">Wszystkie:</span>{" "}
            <span className="text-neutral-900 dark:text-neutral-100">{flashcards.length}</span>
          </div>
          <div className="text-sm">
            <span className="font-medium text-neutral-700 dark:text-neutral-300">Zaakceptowane:</span>{" "}
            <span className="font-semibold text-green-600 dark:text-green-400">{acceptedCount}</span>
          </div>
        </div>
      </div>

      {/* Flashcards list */}
      <div className="space-y-4" role="list" aria-label="Lista propozycji fiszek">
        {flashcards.map((flashcard, index) => (
          <div key={index} role="listitem">
            <FlashcardListItem
              flashcard={flashcard}
              index={index}
              onAccept={onAccept}
              onEdit={onEdit}
              onReject={onReject}
            />
          </div>
        ))}
      </div>
    </div>
  );
});
