import { useState, useCallback, useEffect } from "react";
import { TextInputArea } from "./TextInputArea";
import { Button } from "./ui/button";
import { FlashcardList } from "./FlashcardList";
import { SkeletonLoader } from "./SkeletonLoader";
import { ErrorNotification } from "./ErrorNotification";
import { BulkSaveButton } from "./BulkSaveButton";
import { useGenerateFlashcards } from "./hooks/useGenerateFlashcards";
import { useSaveFlashcards } from "./hooks/useSaveFlashcards";
import type { FlashcardProposalViewModel } from "@/types";

export function FlashcardGenerationView() {
  const [textValue, setTextValue] = useState("");
  const { isLoading, error, flashcards, generationId, generateFlashcards, resetFlashcards } = useGenerateFlashcards();

  const { isSaving, saveError, saveSuccess, savedCount, saveFlashcards, resetSaveState } = useSaveFlashcards();

  const [localFlashcards, setLocalFlashcards] = useState<FlashcardProposalViewModel[]>([]);

  // Synchronizuj lokalny stan z hookiem gdy flashcards się zmienią
  useEffect(() => {
    if (flashcards.length > 0) {
      setLocalFlashcards(flashcards);
    }
  }, [flashcards]);

  const isTextValid = textValue.length >= 1000 && textValue.length <= 10000;
  const canGenerate = isTextValid && !isLoading;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    await generateFlashcards(textValue);
  };

  const handleReset = () => {
    setTextValue("");
    setLocalFlashcards([]);
    resetFlashcards();
    resetSaveState();
  };

  const handleAccept = useCallback((index: number) => {
    setLocalFlashcards((prev) => prev.map((card, i) => (i === index ? { ...card, accepted: !card.accepted } : card)));
  }, []);

  const handleEdit = useCallback((index: number, front: string, back: string) => {
    setLocalFlashcards((prev) =>
      prev.map((card, i) =>
        i === index
          ? {
              ...card,
              front,
              back,
              edited: true,
              source: "ai-edited" as const,
              accepted: true, // Auto-akceptuj po edycji
            }
          : card
      )
    );
  }, []);

  const handleReject = useCallback((index: number) => {
    setLocalFlashcards((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSaveAll = useCallback(async () => {
    if (!generationId) return;
    resetSaveState();
    await saveFlashcards(localFlashcards, generationId);
  }, [localFlashcards, generationId, saveFlashcards, resetSaveState]);

  const handleSaveAccepted = useCallback(async () => {
    if (!generationId) return;
    const acceptedFlashcards = localFlashcards.filter((f) => f.accepted);
    if (acceptedFlashcards.length === 0) return;
    resetSaveState();
    await saveFlashcards(acceptedFlashcards, generationId);
  }, [localFlashcards, generationId, saveFlashcards, resetSaveState]);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8" data-testid="flashcard-generation-view">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Generowanie Fiszek</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Wklej tekst, a AI wygeneruje dla Ciebie propozycje fiszek do nauki.
          </p>
        </div>

        {/* Input Section */}
        <div className="space-y-4">
          <TextInputArea value={textValue} onChange={setTextValue} disabled={isLoading} />

          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="flex-1 sm:flex-none"
              data-testid="generate-button"
            >
              {isLoading ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Generowanie...
                </>
              ) : (
                <>
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generuj fiszki
                </>
              )}
            </Button>

            {(flashcards.length > 0 || error) && (
              <Button onClick={handleReset} variant="outline" disabled={isLoading} data-testid="reset-button">
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Resetuj
              </Button>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && <ErrorNotification message={error} type="error" />}

        {/* Save Error Display */}
        {saveError && <ErrorNotification message={saveError} type="error" />}

        {/* Success Display */}
        {saveSuccess && (
          <ErrorNotification
            message={`Pomyślnie zapisano ${savedCount} ${savedCount === 1 ? "fiszkę" : savedCount < 5 ? "fiszki" : "fiszek"} do bazy danych!`}
            type="info"
            dismissible
            onDismiss={resetSaveState}
          />
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Generowanie fiszek...</h2>
            <SkeletonLoader count={5} />
          </div>
        )}

        {/* Flashcards Display */}
        {!isLoading && localFlashcards.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Wygenerowane fiszki</h2>
            </div>

            <FlashcardList
              flashcards={localFlashcards}
              onAccept={handleAccept}
              onEdit={handleEdit}
              onReject={handleReject}
            />

            <BulkSaveButton
              flashcards={localFlashcards}
              generationId={generationId}
              isSaving={isSaving}
              onSaveAll={handleSaveAll}
              onSaveAccepted={handleSaveAccepted}
            />
          </div>
        )}
      </div>
    </div>
  );
}
