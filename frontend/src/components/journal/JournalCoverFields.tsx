import { useLocale } from "../../i18n";
import styles from "./JournalEditor.module.css";

export default function JournalCoverFields(
  { values, disabled, onChange }: {
    values: string[];
    disabled: boolean;
    onChange(values: string[]): void;
  },
) {
  const { t } = useLocale();
  return (
    <fieldset className={styles.group} disabled={disabled}>
      <legend>{t("journalCoverImages")}</legend>
      {values.map((value, index) => (
        <div className={styles.field} key={index}>
          <label className={styles.field}>
            {`${t("articleCoverUrl")} ${index + 1}`}
            <input
              className={styles.input}
              type="url"
              maxLength={500}
              required={values.length > 1}
              value={value}
              onChange={(event) =>
                onChange(
                  values.map((image, position) =>
                    position === index ? event.target.value : image
                  ),
                )}
            />
          </label>
          {values.length > 1 && (
            <button
              type="button"
              onClick={() =>
                onChange(values.filter((_, position) => position !== index))}
            >
              {t("journalRemoveCover")}
            </button>
          )}
        </div>
      ))}
      {values.length < 3 && (
        <div className={styles.actions}>
          <button type="button" onClick={() => onChange([...values, ""])}>
            {t("journalAddCover")}
          </button>
        </div>
      )}
    </fieldset>
  );
}
