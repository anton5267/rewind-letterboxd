import styles from "./AdminLoading.module.css";

type Layout = "users" | "reviews" | "comments" | "lists" | "logs" | "movies" | "editor" | "detail" | "settings";

/** Geometry-only placeholders; never announce sample records or interactive controls. */
export default function AdminLoading({ label, layout = "logs" }: { label: string; layout?: Layout }) {
  const panel = layout === "editor" || layout === "detail" || layout === "settings";
  return <div className={styles.loading} role="status" aria-label={label}>
    <span className="srOnly">{label}</span>
    <div className={styles.placeholders} data-layout={layout} aria-hidden="true">
      {Array.from({ length: panel ? 1 : 3 }, (_, index) => <div className={styles.row} key={index}>
        {(layout === "movies" || layout === "detail") && <span className={styles.image} />}
        <div className={styles.copy}><span className={styles.heading} /><span className={styles.line} /><span className={styles.line} /><span className={styles.short} /></div>
        <div className={styles.meta}><span className={styles.short} /><span className={styles.line} /></div>
      </div>)}
    </div>
  </div>;
}
