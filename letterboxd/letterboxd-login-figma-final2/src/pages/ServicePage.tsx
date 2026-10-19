import { useLocale } from "../i18n";
import styles from "./ServicePage.module.css";

type ServiceKind = "help" | "contact" | "rules" | "privacy" | "film-data" | "delete-account";
const content: Record<ServiceKind, { title: string; body: string }> = {
  help: { title: "helpTitle", body: "helpBody" }, contact: { title: "contactTitle", body: "contactBody" },
  rules: { title: "rulesTitle", body: "rulesBody" }, privacy: { title: "privacyTitle", body: "privacyBody" },
  "film-data": { title: "filmDataTitle", body: "filmDataBody" }, "delete-account": { title: "deleteAccountTitle", body: "deleteAccountBody" },
};

export default function ServicePage({ kind }: { kind: ServiceKind }) {
  const { t } = useLocale(); const copy = content[kind];
  return <main className={styles.page}>
    <article className={styles.content} aria-labelledby="service-page-title">
      <h1 className={styles.title} id="service-page-title">{t(copy.title)}</h1>
      <p className={styles.body}>{t(copy.body)}</p>
    </article>
  </main>;
}
