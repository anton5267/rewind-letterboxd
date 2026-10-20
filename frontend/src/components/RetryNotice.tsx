import RetryButton from "./RetryButton";

interface RetryNoticeProps {
  className: string;
  message: string;
  retryLabel: string;
  onRetry: () => void;
  disabled?: boolean;
  busy?: boolean;
}

/**
 * Shared inline failure state for API-backed sections.
 * The parent supplies its Figma-specific class so visual composition stays local.
 */
export default function RetryNotice({
  className,
  message,
  retryLabel,
  onRetry,
  disabled = false,
  busy = false,
}: RetryNoticeProps) {
  return (
    <p className={className} role="alert">
      {message}{" "}
      <RetryButton
        label={retryLabel}
        disabled={disabled}
        busy={busy}
        onClick={onRetry}
      />
    </p>
  );
}
