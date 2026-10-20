import type { ReactNode } from "react";
import { useLocale } from "../i18n";

interface Props {
  page: number;
  totalPages: number;
  label: string;
  busy?: boolean;
  className?: string;
  /** Optional count or context rendered after the page status. */
  statusSuffix?: ReactNode;
  /** Allows message threads to keep their domain-specific direction labels. */
  previousLabel?: string;
  nextLabel?: string;
  onPageChange: (page: number) => void;
}

/**
 * Shared accessible page controls for server-paginated surfaces.
 * The page keeps its own visual class so each Figma surface can preserve its
 * composition while labels and boundary behavior stay consistent.
 */
export default function Pagination({
  page,
  totalPages,
  label,
  busy = false,
  className,
  statusSuffix,
  previousLabel,
  nextLabel,
  onPageChange,
}: Props) {
  const { t } = useLocale();
  if (totalPages <= 1) return null;

  return (
    <nav className={className} aria-label={label} aria-busy={busy}>
      <button
        type="button"
        disabled={busy || page === 0}
        onClick={() => onPageChange(page - 1)}
      >
        {previousLabel ?? t("previous")}
      </button>
      <span role="status">
        {t("page")} {page + 1} {t("of")} {totalPages}
        {statusSuffix != null ? <> · {statusSuffix}</> : null}
      </span>
      <button
        type="button"
        disabled={busy || page + 1 >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        {nextLabel ?? t("next")}
      </button>
    </nav>
  );
}
