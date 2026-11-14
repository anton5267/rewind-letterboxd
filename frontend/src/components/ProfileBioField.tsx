import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDialogFocusTrap } from "../hooks/useDialogFocusTrap";
import { useLocale } from "../i18n";
import styles from "./ProfileBioField.module.css";

interface Props {
  className?: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

export default function ProfileBioField({ value, disabled, onChange, className }: Props) {
  const { t } = useLocale();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const sheetRef = useDialogFocusTrap<HTMLElement>(open, () => setOpen(false), { initialFocusRef: editorRef });

  useEffect(() => {
    if (!open) return;
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [open]);

  return <div className={className}>
    <label className={styles.desktopLabel} htmlFor={`${id}-desktop`}>{t("bio")}</label>
    <textarea
      id={`${id}-desktop`}
      className={styles.desktopEditor}
      value={value}
      disabled={disabled}
      maxLength={500}
      aria-describedby={`${id}-hint`}
      onChange={event => onChange(event.target.value)}
    />
    <p id={`${id}-hint`} className={styles.desktopHint}>{t("bioHint")} {value.length}/500</p>
    <button
      type="button"
      className={styles.mobileTrigger}
      disabled={disabled}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={open ? `${id}-dialog` : undefined}
      onClick={() => { setDraft(value); setOpen(true); }}
    >
      {t("bio")}
    </button>
    {open && createPortal(
      <section
        ref={sheetRef}
        id={`${id}-dialog`}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
      >
        <header className={styles.toolbar}>
          <button type="button" onClick={() => setOpen(false)}>{t("cancel")}</button>
          <h2 id={`${id}-title`}>{t("bio")}</h2>
          <button type="button" onClick={() => { onChange(draft); setOpen(false); }}>{t("done")}</button>
        </header>
        <textarea
          ref={editorRef}
          className={styles.editor}
          value={draft}
          maxLength={500}
          aria-labelledby={`${id}-title`}
          aria-describedby={`${id}-editor-hint`}
          onChange={event => setDraft(event.target.value)}
        />
        <p id={`${id}-editor-hint`} className="srOnly">{t("bioHint")} {draft.length}/500</p>
      </section>,
      document.body,
    )}
  </div>;
}
