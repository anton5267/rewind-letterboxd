import { useEffect, useRef, useState } from "react";

interface Props {
  itemId: number;
  label: string;
  instructionsId?: string;
  className: string;
  disabled: boolean;
  onStep: (direction: -1 | 1) => void;
  onDrop: (targetItemId: number) => void;
}

export default function ListReorderHandle({ itemId, label, className, disabled, onStep, onDrop, instructionsId = "list-reorder-instructions" }: Props) {
  const pointer = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const cancelPointer = () => {
    pointer.current = null;
    setDragging(false);
  };

  useEffect(() => {
    if (disabled) cancelPointer();
  }, [disabled]);

  return <button
    className={className}
    type="button"
    data-list-reorder-item={itemId}
    data-reordering={dragging || undefined}
    draggable={!disabled}
    disabled={disabled}
    aria-label={label}
    aria-describedby={instructionsId}
    aria-keyshortcuts="ArrowUp ArrowDown"
    onKeyDown={event => {
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      event.preventDefault();
      onStep(event.key === "ArrowUp" ? -1 : 1);
    }}
    onDragStart={event => {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(itemId));
    }}
    onPointerDown={event => {
      if (disabled || event.pointerType === "mouse" || !event.isPrimary) return;
      event.preventDefault();
      pointer.current = event.pointerId;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.focus({ preventScroll: true });
      setDragging(true);
    }}
    onPointerUp={event => {
      const active = pointer.current === event.pointerId;
      cancelPointer();
      if (!active || disabled) return;
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-list-item-id]");
      const targetItemId = Number(target?.dataset.listItemId);
      if (Number.isSafeInteger(targetItemId) && targetItemId !== itemId) onDrop(targetItemId);
    }}
    onPointerCancel={cancelPointer}
    onLostPointerCapture={cancelPointer}
  >
    <img src="/images/list-entry-drag.png" width={31} height={31} alt="" />
  </button>;
}
