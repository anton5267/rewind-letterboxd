import styles from "./RetryButton.module.css";

interface RetryButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  size?: "standard" | "large";
}

/**
 * Shared retry action for compact API error states.
 * The surrounding surface owns the message and color; this control owns the
 * minimum touch target, focus treatment and disabled/busy affordance.
 */
export default function RetryButton({
  label,
  onClick,
  disabled = false,
  busy = false,
  size = "standard",
}: RetryButtonProps) {
  return (
    <button
      className={`${styles.button} ${size === "large" ? styles.large : ""}`}
      type="button"
      data-retry-button="true"
      disabled={disabled || busy}
      aria-busy={busy}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
