import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { isAxiosError } from "axios";
import { getCurrentUser } from "../api/auth.api";
import { requestEmailChange } from "../api/emailChange.api";
import { getProfile } from "../api/profile.api";
import { useDialogFocusTrap } from "../hooks/useDialogFocusTrap";
import { useLocale } from "../i18n";
import styles from "./ProfileEmailField.module.css";

interface Props {
  className?: string;
  email: string;
  userId: number;
  disabled: boolean;
  onConfirmed: (email: string) => void;
}

type Feedback = "emailChangeSent" | "emailChangeRequestError" | "emailChangeRateLimit"
  | "emailChangeWaiting" | "emailChangeConfirmed" | "emailChangeCheckError";

export default function ProfileEmailField({ email, userId, disabled, onConfirmed, className = "" }: Props) {
  const { t, lang } = useLocale();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(email);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const feedbackRef = useRef<HTMLParagraphElement>(null);
  const feedbackOrigin = useRef<Element | null>(null);
  const alive = useRef(false);
  const request = useRef(0);
  const inFlight = useRef(false);
  const dialog = useDialogFocusTrap<HTMLElement>(open, () => setOpen(false), { initialFocusRef: input });
  const failed = feedback === "emailChangeRequestError"
    || feedback === "emailChangeRateLimit"
    || feedback === "emailChangeCheckError";

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      request.current += 1;
    };
  }, []);

  useEffect(() => {
    if (busy || !failed) return;
    const active = document.activeElement;
    if (active === feedbackOrigin.current || active === document.body) {
      feedbackRef.current?.focus();
    }
  }, [busy, failed, feedback]);

  const run = async (check: boolean) => {
    if (inFlight.current) return;
    inFlight.current = true;
    const sequence = ++request.current;
    feedbackOrigin.current = document.activeElement;
    const current = () => alive.current && request.current === sequence;
    setBusy(true);
    setFeedback(null);
    try {
      if (check) {
        await getCurrentUser();
        if (!current()) return;
        const { data } = await getProfile();
        if (!current()) return;
        if (data.id !== userId) throw new Error("The signed-in account has changed");
        if (data.email.toLowerCase() === email.toLowerCase()) {
          setFeedback("emailChangeWaiting");
        } else {
          onConfirmed(data.email);
          setPending(false);
          setFeedback("emailChangeConfirmed");
        }
      } else {
        const { data } = await requestEmailChange(draft, lang, userId);
        if (!current()) return;
        if (!data.confirmationRequired) throw new Error("Email confirmation was not requested");
        setPending(true);
        setFeedback("emailChangeSent");
        setOpen(false);
      }
    } catch (error) {
      if (!current()) return;
      const rateLimited = isAxiosError(error) && error.response?.status === 429;
      let message: Feedback = "emailChangeRequestError";
      if (rateLimited) message = "emailChangeRateLimit";
      if (check) message = "emailChangeCheckError";
      setFeedback(message);
    } finally {
      if (current()) {
        inFlight.current = false;
        setBusy(false);
      }
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (draft.trim() && draft.trim().toLowerCase() !== email.toLowerCase()) void run(false);
  };
  const notice = feedback && (
    <p ref={feedbackRef} tabIndex={-1} className={styles.notice} role={failed ? "alert" : "status"}>
      {t(feedback)}
    </p>
  );
  const checkButton = pending && (
    <button type="button" className={styles.check} disabled={busy} onClick={() => void run(true)}>
      {busy ? t("loading") : t("emailChangeCheck")}
    </button>
  );

  return (
    <div className={`${styles.field} ${className}`}>
      <label htmlFor="settings-email">{t("email")}</label>
      <button
        id="settings-email"
        type="button"
        className={styles.trigger}
        aria-label={t("changeEmail")}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled || busy}
        onClick={() => {
          setDraft(email);
          setFeedback(null);
          setOpen(true);
        }}
      >
        {email}
      </button>
      {!open && <>{notice}{checkButton}</>}
      {open && createPortal(
        <div className={styles.backdrop}>
          <section
            ref={dialog}
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-title`}
            aria-busy={busy}
          >
            <header className={styles.toolbar}>
              <button type="button" onClick={() => setOpen(false)}>
                <img src="/images/profile-pronoun-back.png" width={22} height={22} alt="" />
                {t("return")}
              </button>
              <h2 id={`${id}-title`}>{t("settings")}</h2>
              <button
                type="submit"
                form={`${id}-form`}
                aria-disabled={busy}
                disabled={!draft.trim() || draft.trim().toLowerCase() === email.toLowerCase()}
              >
                {busy ? t("loading") : t("done")}
              </button>
            </header>
            <form id={`${id}-form`} onSubmit={submit}>
              <div className={styles.emailRow}>
                <label htmlFor={`${id}-email`}>{t("email")}</label>
                <input
                  ref={input}
                  id={`${id}-email`}
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={150}
                  value={draft}
                  readOnly={busy}
                  onChange={event => setDraft(event.target.value)}
                  aria-describedby={`${id}-hint`}
                />
              </div>
              <p id={`${id}-hint`} className={styles.hint}>{t("emailChangeHint")}</p>
              {notice}{checkButton}
            </form>
          </section>
        </div>,
        document.body,
      )}
    </div>
  );
}
