import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

interface DialogFocusTrapOptions {
  initialFocusRef?: RefObject<HTMLElement | null>;
}

const openDialogs: HTMLElement[] = [];
const backgroundState = new Map<HTMLElement, boolean>();
let originalBodyOverflow = "";

function updateModalBackground() {
  for (const [element, wasInert] of backgroundState) element.inert = wasInert;
  backgroundState.clear();
  const activeDialog = openDialogs.at(-1);
  if (!activeDialog) return;
  // Also works for dialogs rendered inside a page rather than through a portal.
  let branch: HTMLElement = activeDialog;
  while (branch.parentElement) {
    for (const sibling of branch.parentElement.children) {
      if (!(sibling instanceof HTMLElement) || sibling === branch) continue;
      backgroundState.set(sibling, sibling.inert);
      sibling.inert = true;
    }
    if (branch.parentElement === document.body) break;
    branch = branch.parentElement;
  }
}

function getFocusable(dialog: HTMLElement) {
  return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(element =>
    element.tabIndex >= 0 && !element.matches(":disabled") && !element.closest("[inert], [hidden]") &&
    element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden",
  );
}

/** Keeps keyboard focus inside an open modal and restores the trigger focus on close. */
export function useDialogFocusTrap<T extends HTMLElement>(
  enabled: boolean,
  onClose: () => void,
  { initialFocusRef }: DialogFocusTrapOptions = {},
) {
  const dialogRef = useRef<T>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!enabled || !dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousTabIndex = dialog.getAttribute("tabindex");
    if (previousTabIndex === null) dialog.tabIndex = -1;
    if (openDialogs.length === 0) originalBodyOverflow = document.body.style.overflow;
    openDialogs.push(dialog);
    document.body.style.overflow = "hidden";
    updateModalBackground();
    const focusFirst = () => (getFocusable(dialog)[0] ?? dialog).focus();
    const initial = initialFocusRef?.current;
    if (initial && dialog.contains(initial)) initial.focus();
    else focusFirst();
    const observer = new MutationObserver(updateModalBackground);
    observer.observe(document.body, { childList: true, subtree: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (openDialogs.at(-1) !== dialog) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey ? active === first || !dialog.contains(active) : active === last || !dialog.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    const onFocusIn = (event: FocusEvent) => {
      if (openDialogs.at(-1) === dialog && !dialog.contains(event.target as Node)) focusFirst();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
      const wasTop = openDialogs.at(-1) === dialog;
      const index = openDialogs.lastIndexOf(dialog);
      if (index !== -1) openDialogs.splice(index, 1);
      updateModalBackground();
      if (openDialogs.length === 0) document.body.style.overflow = originalBodyOverflow;
      if (previousTabIndex === null) dialog.removeAttribute("tabindex");
      if (wasTop && previousFocus?.isConnected && !previousFocus.closest("[inert]")) previousFocus.focus();
    };
  }, [enabled, initialFocusRef]);

  return dialogRef;
}
