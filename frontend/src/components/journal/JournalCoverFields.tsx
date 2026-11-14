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
  const removeCover = (index: number, trigger: HTMLButtonElement) => {
    const group = trigger.closest("fieldset");
    onChange(values.filter((_, position) => position !== index));
    window.requestAnimationFrame(() => {
      if (!group?.isConnected) return;
      const active = document.activeElement;
      if (active !== document.body && active !== trigger) return;
      const inputs = group.querySelectorAll<HTMLInputElement>('input[type="url"]:not(:disabled)');
      inputs[Math.min(index, inputs.length - 1)]?.focus();
    });
  };
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
              onClick={(event) => removeCover(index, event.currentTarget)}
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
