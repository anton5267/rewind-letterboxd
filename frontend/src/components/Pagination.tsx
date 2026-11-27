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
  /** Displays the compact numeric pattern used by the admin review catalog. */
  variant?: "standard" | "numbers";
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
  variant = "standard",
  onPageChange,
}: Props) {
  const { t } = useLocale();
  if (totalPages <= 1) return null;

  if (variant === "numbers") {
    const lastPage = totalPages - 1;
    const pageItems: Array<number | "ellipsis"> = totalPages <= 5
      ? Array.from({ length: totalPages }, (_, index) => index)
      : page <= 1 ? [0, 1, 2, "ellipsis", lastPage]
        : page >= lastPage - 1 ? [0, "ellipsis", lastPage - 2, lastPage - 1, lastPage]
          : [0, "ellipsis", page - 1, page, page + 1, "ellipsis", lastPage];

    return <nav className={className} aria-label={label} aria-busy={busy}>
      <span className="srOnly" role="status">{t("page")} {page + 1} {t("of")} {totalPages}{statusSuffix != null ? <> · {statusSuffix}</> : null}</span>
      {pageItems.map((item, index) => item === "ellipsis"
        ? <span key={`ellipsis-${index}`} aria-hidden="true">…</span>
        : <button key={item} type="button" disabled={busy} aria-current={page === item ? "page" : undefined}
          aria-label={`${t("page")} ${item + 1}`} onClick={() => onPageChange(item)}>{item + 1}</button>)}
    </nav>;
  }

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
