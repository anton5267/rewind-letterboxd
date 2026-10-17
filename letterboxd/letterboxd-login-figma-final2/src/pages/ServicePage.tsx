import { useLocale } from "../i18n";

type ServiceKind = "help" | "contact" | "rules" | "privacy" | "film-data" | "delete-account";
const content: Record<ServiceKind, { title: string; body: string }> = {
  help: { title: "helpTitle", body: "helpBody" }, contact: { title: "contactTitle", body: "contactBody" },
  rules: { title: "rulesTitle", body: "rulesBody" }, privacy: { title: "privacyTitle", body: "privacyBody" },
  "film-data": { title: "filmDataTitle", body: "filmDataBody" }, "delete-account": { title: "deleteAccountTitle", body: "deleteAccountBody" },
};

export default function ServicePage({ kind }: { kind: ServiceKind }) {
  const { t } = useLocale(); const copy = content[kind];
  return <main style={{ padding: "110px 5% 60px", minHeight: "70vh", background: "#151515", color: "white", maxWidth: 900 }}><h1>{t(copy.title)}</h1><p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{t(copy.body)}</p></main>;
}
