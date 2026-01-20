import { useState, memo } from "react";

interface ErrorNotificationProps {
  message: string;
  type?: "error" | "warning" | "info";
  dismissible?: boolean;
  onDismiss?: () => void;
}

export const ErrorNotification = memo(function ErrorNotification({
  message,
  type = "error",
  dismissible = false,
  onDismiss,
}: ErrorNotificationProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!message || isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const styles = {
    error: {
      border: "border-red-200 dark:border-red-800",
      bg: "bg-red-50 dark:bg-red-950",
      iconColor: "text-red-600 dark:text-red-400",
      titleColor: "text-red-800 dark:text-red-200",
      textColor: "text-red-700 dark:text-red-300",
      buttonHover: "hover:bg-red-100 dark:hover:bg-red-900",
    },
    warning: {
      border: "border-amber-200 dark:border-amber-800",
      bg: "bg-amber-50 dark:bg-amber-950",
      iconColor: "text-amber-600 dark:text-amber-400",
      titleColor: "text-amber-800 dark:text-amber-200",
      textColor: "text-amber-700 dark:text-amber-300",
      buttonHover: "hover:bg-amber-100 dark:hover:bg-amber-900",
    },
    info: {
      border: "border-blue-200 dark:border-blue-800",
      bg: "bg-blue-50 dark:bg-blue-950",
      iconColor: "text-blue-600 dark:text-blue-400",
      titleColor: "text-blue-800 dark:text-blue-200",
      textColor: "text-blue-700 dark:text-blue-300",
      buttonHover: "hover:bg-blue-100 dark:hover:bg-blue-900",
    },
  };

  const currentStyle = styles[type];

  const icons = {
    error: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
    warning: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    ),
    info: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  };

  const titles = {
    error: "Wystąpił błąd",
    warning: "Ostrzeżenie",
    info: "Informacja",
  };

  return (
    <div
      className={`rounded-md border ${currentStyle.border} ${currentStyle.bg} p-4`}
      role="alert"
      aria-live={type === "error" ? "assertive" : "polite"}
    >
      <div className="flex items-start gap-3">
        <svg
          className={`h-5 w-5 flex-shrink-0 ${currentStyle.iconColor}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          {icons[type]}
        </svg>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-medium ${currentStyle.titleColor}`}>{titles[type]}</h3>
          <p className={`mt-1 text-sm ${currentStyle.textColor}`}>{message}</p>
        </div>
        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className={`flex-shrink-0 rounded-md p-1.5 ${currentStyle.iconColor} ${currentStyle.buttonHover} transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent`}
            aria-label="Zamknij powiadomienie"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
});
