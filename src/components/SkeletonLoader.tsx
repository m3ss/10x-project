import { memo } from "react";

interface SkeletonLoaderProps {
  count?: number;
}

export const SkeletonLoader = memo(function SkeletonLoader({ count = 5 }: SkeletonLoaderProps) {
  return (
    <div className="space-y-4" role="status" aria-label="Ładowanie fiszek">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950"
        >
          {/* Header skeleton */}
          <div className="mb-4 flex items-center justify-between">
            <div className="h-4 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="flex gap-2">
              <div className="h-8 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-8 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-8 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            </div>
          </div>

          {/* Front side skeleton */}
          <div className="mb-4 space-y-2">
            <div className="h-3 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-4 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
          </div>

          {/* Back side skeleton */}
          <div className="space-y-2">
            <div className="h-3 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-4 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-4 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </div>
      ))}
      <span className="sr-only">Ładowanie propozycji fiszek...</span>
    </div>
  );
});
