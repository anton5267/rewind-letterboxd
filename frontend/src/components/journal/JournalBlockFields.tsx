import type { JournalContentBlock } from "../../api/journal-content";
import { useLocale } from "../../i18n";
import styles from "./JournalEditor.module.css";

export default function JournalBlockFields(
  { block, onChange }: {
    block: JournalContentBlock;
    onChange(block: JournalContentBlock): void;
  },
) {
  const { t } = useLocale();
  if (block.type === "paragraph") {
    return (
      <label className={styles.field}>
        {t("journalParagraph")}
        <textarea
          aria-label={t("journalParagraph")}
          className={styles.textarea}
          required
          rows={5}
          maxLength={100000}
          value={block.text}
          onChange={(event) => onChange({ ...block, text: event.target.value })}
        />
      </label>
    );
  }
  if (block.type === "heading") {
    return (
      <>
        <label className={styles.field}>
          {t("journalHeading")}
          <input
            aria-label={t("journalHeading")}
            className={styles.input}
            required
            maxLength={255}
            value={block.text}
            onChange={(event) =>
              onChange({ ...block, text: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          {t("journalHeadingLevel")}
          <select
            aria-label={t("journalHeadingLevel")}
            className={styles.select}
            value={block.level}
            onChange={(event) =>
              onChange({ ...block, level: event.target.value === "3" ? 3 : 2 })}
          >
            <option value="2">H2</option>
            <option value="3">H3</option>
          </select>
        </label>
      </>
    );
  }
  if (block.type === "list") {
    return (
      <label className={styles.field}>
        {t("journalListItems")}
        <textarea
          aria-label={t("journalListItems")}
          className={styles.textarea}
          required
          rows={4}
          value={block.items.join("\n")}
          onChange={(event) =>
            onChange({ ...block, items: event.target.value.split("\n") })}
        />
      </label>
    );
  }
  return (
    <>
      <label className={styles.field}>
        {t("journalImageUrl")}
        <input
          aria-label={t("journalImageUrl")}
          className={styles.input}
          type="url"
          required
          maxLength={500}
          value={block.url}
          onChange={(event) => onChange({ ...block, url: event.target.value })}
        />
      </label>
      <label className={styles.field}>
        {t("journalImageAlt")}
        <input
          aria-label={t("journalImageAlt")}
          className={styles.input}
          required
          maxLength={300}
          value={block.alt}
          onChange={(event) => onChange({ ...block, alt: event.target.value })}
        />
      </label>
      <label className={styles.field}>
        {t("journalImageCaption")}
        <input
          aria-label={t("journalImageCaption")}
          className={styles.input}
          maxLength={1000}
          value={block.caption ?? ""}
          onChange={(event) =>
            onChange({ ...block, caption: event.target.value || null })}
        />
      </label>
      <label className={styles.field}>
        {t("journalImageLayout")}
        <select
          aria-label={t("journalImageLayout")}
          className={styles.select}
          value={block.layout}
          onChange={(event) =>
            onChange({
              ...block,
              layout: event.target.value === "aside" ? "aside" : "full",
            })}
        >
          <option value="full">{t("journalImageFull")}</option>
          <option value="aside">{t("journalImageAside")}</option>
        </select>
      </label>
    </>
  );
}
