import { useEffect, useId, useRef } from "react";
import styles from "./AdminConfirmDialog.module.css";

type Props = {
  open: boolean;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  trigger: HTMLElement | null;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({ open, title, description, cancelLabel, confirmLabel, trigger, busy = false, onCancel, onConfirm }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (open) cancelButton.current?.focus();
    if (!open && element.open) element.close();
  }, [open]);

  const cancel = () => {
    if (dialog.current?.open) dialog.current.close();
    onCancel();
    window.requestAnimationFrame(() => { if (trigger?.isConnected) trigger.focus(); });
  };

  const confirm = () => {
    if (busy) return;
    if (dialog.current?.open) dialog.current.close();
    onConfirm();
  };

  return <dialog className={styles.deleteDialog} ref={dialog} role="alertdialog" aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={event => { event.preventDefault(); cancel(); }}>
    <h3 id={titleId}>{title}</h3>
    <p id={descriptionId}>{description}</p>
    <div className={styles.deleteDialogActions}>
      <button type="button" ref={cancelButton} disabled={busy} onClick={cancel}>{cancelLabel}</button>
      <button type="button" className={styles.deleteDialogConfirm} disabled={busy} aria-busy={busy} onClick={confirm}>{confirmLabel}</button>
    </div>
  </dialog>;
}
