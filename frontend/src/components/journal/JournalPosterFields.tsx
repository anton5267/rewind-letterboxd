import { useLocale } from "../../i18n";
import styles from "./JournalEditor.module.css";

export default function JournalPosterFields(
  { values, disabled, onChange }: {
    values: string[];
    disabled: boolean;
    onChange(values: string[]): void;
  },
) {
  const { t } = useLocale();
  const removePoster = (index: number, trigger: HTMLButtonElement) => {
    const group = trigger.closest("fieldset");
    onChange(values.filter((_, position) => position !== index));
    window.requestAnimationFrame(() => {
      if (!group?.isConnected) return;
      const active = document.activeElement;
      if (active !== document.body && active !== trigger) return;
      const inputs = group.querySelectorAll<HTMLInputElement>('input[type="url"]:not(:disabled)');
      if (inputs.length) inputs[Math.min(index, inputs.length - 1)]?.focus();
      else group.querySelector<HTMLButtonElement>("[data-add-poster]")?.focus();
    });
  };

  return (
    <fieldset className={styles.group} disabled={disabled}>
      <legend>{t("journalPosterImages")}</legend>
      <p className={styles.hint}>{t("journalPosterOrderHint")}</p>
      {values.map((value, index) => (
        <div className={styles.field} key={index}>
          <label className={styles.field}>
            {`${t("journalPosterImage")} ${index + 1}`}
            <input
              className={styles.input}
              type="url"
              maxLength={500}
              value={value}
              onChange={(event) => onChange(values.map((image, position) =>
                position === index ? event.target.value : image
              ))}
            />
          </label>
          <button
            type="button"
            aria-label={`${t("journalRemovePoster")} ${index + 1}`}
            onClick={(event) => removePoster(index, event.currentTarget)}
          >
            {t("journalRemovePoster")}
          </button>
        </div>
      ))}
      {values.length < 3 && (
        <div className={styles.actions}>
          <button type="button" data-add-poster onClick={() => onChange([...values, ""])}>
            {t("journalAddPoster")}
          </button>
        </div>
      )}
    </fieldset>
  );
}
