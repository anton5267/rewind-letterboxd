import { useLocale } from "../../i18n";
import styles from "../../pages/Person.module.css";

export default function PersonLoading(
  { identity = false }: { identity?: boolean },
) {
  const { t } = useLocale();
  const posters = (
    <div className={styles.grid} aria-hidden="true">
      {Array.from(
        { length: 12 },
        (_, index) => (
          <span className={`${styles.poster} ${styles.skeleton}`} key={index} />
        ),
      )}
    </div>
  );
  return (
    <div role="status" aria-label={t("loading")}>
      <span className="srOnly">{t("loading")}</span>
      {identity
        ? (
          <>
            <section className={styles.hero} aria-hidden="true">
              <div className={styles.mobileToolbar} />
              <div className={styles.heroIdentity}>
                <span
                  className={`${styles.avatarFallback} ${styles.skeleton}`}
                />
                <span
                  className={`${styles.skeletonTitle} ${styles.skeleton}`}
                />
              </div>
            </section>
            <section className={styles.content}>{posters}</section>
          </>
        )
        : posters}
    </div>
  );
}
