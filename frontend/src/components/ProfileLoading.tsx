import styles from "./ProfileLoading.module.css";

type Layout = "identity" | "films" | "reviews" | "rows" | "lists" | "settings";

export default function ProfileLoading({ label, layout = "films" }: { label: string; layout?: Layout }) {
  return <div role="status" aria-label={label}>
    <span className="srOnly">{label}</span>
    <div className={styles.geometry} data-profile-loading={layout} aria-hidden="true">
      {Array.from({ length: layout === "identity" ? 1 : layout === "films" ? 4 : 2 }, (_, index) => <div className={styles.item} key={index}><span className={styles.image} /><div className={styles.copy}><span /><span /><span /></div></div>)}
    </div>
  </div>;
}
