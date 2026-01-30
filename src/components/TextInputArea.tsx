import { useId, memo } from "react";

interface TextInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const TextInputArea = memo(function TextInputArea({
  value,
  onChange,
  placeholder = "Wklej tutaj tekst (1000-10000 znaków)...",
  disabled = false,
}: TextInputAreaProps) {
  const textareaId = useId();
  const characterCount = value.length;
  const minLength = 1000;
  const maxLength = 10000;
  const isValid = characterCount >= minLength && characterCount <= maxLength;
  const isTooShort = characterCount > 0 && characterCount < minLength;
  const isTooLong = characterCount > maxLength;

  return (
    <div className="space-y-2" data-testid="text-input-area">
      <label htmlFor={textareaId} className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        Tekst źródłowy
      </label>
      <textarea
        id={textareaId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={10}
        className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors resize-y ${
          disabled
            ? "bg-neutral-100 text-neutral-500 cursor-not-allowed dark:bg-neutral-800"
            : isTooLong
              ? "border-red-500 focus:ring-red-500 dark:border-red-600 dark:focus:ring-red-600"
              : isValid
                ? "border-green-500 focus:ring-green-500 dark:border-green-600 dark:focus:ring-green-600"
                : "border-neutral-300 focus:ring-neutral-500 dark:border-neutral-700 dark:focus:ring-neutral-500"
        } dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder-neutral-500`}
        aria-describedby={`${textareaId}-description ${textareaId}-count`}
        aria-invalid={isTooShort || isTooLong}
        data-testid="text-input-textarea"
      />
      <div className="flex items-center justify-between text-xs">
        <div
          id={`${textareaId}-description`}
          className={`${
            isTooShort
              ? "text-amber-600 dark:text-amber-500"
              : isTooLong
                ? "text-red-600 dark:text-red-500"
                : isValid
                  ? "text-green-600 dark:text-green-500"
                  : "text-neutral-500 dark:text-neutral-400"
          }`}
        >
          {isTooShort
            ? `Dodaj jeszcze ${minLength - characterCount} znaków`
            : isTooLong
              ? `Przekroczono limit o ${characterCount - maxLength} znaków`
              : isValid
                ? "Tekst ma odpowiednią długość"
                : "Wprowadź tekst o długości 1000-10000 znaków"}
        </div>
        <div
          id={`${textareaId}-count`}
          className={`font-medium ${
            isTooLong
              ? "text-red-600 dark:text-red-500"
              : isValid
                ? "text-green-600 dark:text-green-500"
                : "text-neutral-500 dark:text-neutral-400"
          }`}
          aria-live="polite"
          data-testid="character-count"
        >
          {characterCount.toLocaleString()} / {maxLength.toLocaleString()}
        </div>
      </div>
    </div>
  );
});
