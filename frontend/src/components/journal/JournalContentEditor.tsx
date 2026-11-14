import { useRef, useState } from "react";
import {
  type JournalContentBlock,
  journalContentText,
} from "../../api/journal-content";
import { useLocale } from "../../i18n";
import ConfirmDialog from "../ConfirmDialog";
import JournalBlockFields from "./JournalBlockFields";
import styles from "./JournalEditor.module.css";

interface Props {
  text: string;
  blocks: JournalContentBlock[] | null;
  disabled: boolean;
  onChange(text: string, blocks: JournalContentBlock[] | null): void;
}

const blockLabels = {
  paragraph: "journalParagraph",
  heading: "journalHeading",
  list: "journalList",
  image: "journalImage",
} as const;

function emptyBlock(type: JournalContentBlock["type"]): JournalContentBlock {
  switch (type) {
    case "paragraph":
      return { type, text: "" };
    case "heading":
      return { type, text: "", level: 2 };
    case "list":
      return { type, items: [""] };
    case "image":
      return { type, url: "", alt: "", caption: null, layout: "full" };
  }
}

export default function JournalContentEditor(
  { text, blocks, disabled, onChange }: Props,
) {
  const { t } = useLocale();
  const [nextType, setNextType] = useState<JournalContentBlock["type"]>(
    "paragraph",
  );
  const [convertTrigger, setConvertTrigger] = useState<HTMLElement | null>(
    null,
  );
  const plainInput = useRef<HTMLTextAreaElement>(null);
  const blockKeys = useRef(new WeakMap<JournalContentBlock, string>());
  const keyFor = (block: JournalContentBlock) => {
    let key = blockKeys.current.get(block);
    if (!key) {
      key = crypto.randomUUID();
      blockKeys.current.set(block, key);
    }
    return key;
  };
  const changeBlocks = (value: JournalContentBlock[]) =>
    onChange(journalContentText(value), value);
  const updateBlock = (index: number, value: JournalContentBlock) => {
    if (!blocks) return;
    blockKeys.current.set(value, keyFor(blocks[index]));
    changeBlocks(
      blocks.map((block, position) => position === index ? value : block),
    );
  };
  const removeBlock = (index: number, trigger: HTMLButtonElement) => {
    if (!blocks) return;
    const container = trigger.closest("fieldset")?.parentElement;
    changeBlocks(blocks.filter((_, position) => position !== index));
    window.requestAnimationFrame(() => {
      if (!container?.isConnected) return;
      const active = document.activeElement;
      if (active !== document.body && active !== trigger) return;
      const groups = container.querySelectorAll<HTMLFieldSetElement>(":scope > fieldset");
      const group = groups[Math.min(index, groups.length - 1)];
      group?.querySelector<HTMLElement>(
        "input:not(:disabled), textarea:not(:disabled), select:not(:disabled), button:not(:disabled)",
      )?.focus();
    });
  };
  const moveBlock = (index: number, offset: number, trigger: HTMLButtonElement) => {
    if (!blocks) return;
    const group = trigger.closest("fieldset");
    const reordered = [...blocks];
    [reordered[index], reordered[index + offset]] = [
      reordered[index + offset],
      reordered[index],
    ];
    changeBlocks(reordered);
    window.requestAnimationFrame(() => {
      if (!group?.isConnected) return;
      const active = document.activeElement;
      if (active !== document.body && active !== trigger) return;
      // A boundary move disables its trigger. Keep focus in the moved block.
      const target = trigger.matches(":disabled")
        ? group.querySelector<HTMLButtonElement>("button:not(:disabled)")
        : trigger;
      target?.focus();
    });
  };

  return (
    <>
      <fieldset className={styles.group} disabled={disabled}>
        <legend>{t("articleContent")}</legend>
        {blocks === null
          ? (
            <>
              <textarea
                ref={plainInput}
                className={styles.textarea}
                required
                maxLength={100000}
                rows={8}
                aria-label={t("articleContent")}
                value={text}
                onChange={(event) => onChange(event.target.value, null)}
              />
              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={() => changeBlocks([{ type: "paragraph", text }])}
                >
                  {t("journalRichContent")}
                </button>
              </div>
            </>
          )
          : (
            <>
              <div className={styles.blocks}>
                {blocks.map((block, index) => (
                  <fieldset className={styles.block} key={keyFor(block)}>
                    <legend>
                      {`${index + 1}. ${t(blockLabels[block.type])}`}
                    </legend>
                    <JournalBlockFields
                      block={block}
                      onChange={(value) =>
                        updateBlock(index, value)}
                    />
                    <div className={styles.actions}>
                      <button
                        type="button"
                        disabled={disabled || index === 0}
                        onClick={(event) =>
                          moveBlock(index, -1, event.currentTarget)}
                      >
                        {t("journalMoveUp")}
                      </button>
                      <button
                        type="button"
                        disabled={disabled || index === blocks.length - 1}
                        onClick={(event) => moveBlock(index, 1, event.currentTarget)}
                      >
                        {t("journalMoveDown")}
                      </button>
                      <button
                        type="button"
                        disabled={disabled || blocks.length === 1}
                        onClick={(event) => removeBlock(index, event.currentTarget)}
                      >
                        {t("journalRemoveBlock")}
                      </button>
                    </div>
                  </fieldset>
                ))}
              </div>
              <div className={styles.actions}>
                <label className={styles.field}>
                  {t("journalBlockType")}
                  <select
                    aria-label={t("journalBlockType")}
                    className={styles.select}
                    value={nextType}
                    onChange={(event) =>
                      setNextType(
                        event.target.value as JournalContentBlock["type"],
                      )}
                  >
                    {Object.entries(blockLabels).map(([type, label]) => (
                      <option key={type} value={type}>{t(label)}</option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  disabled={disabled || blocks.length >= 64}
                  onClick={() =>
                    changeBlocks([...blocks, emptyBlock(nextType)])}
                >
                  {t("journalAddBlock")}
                </button>
                <button
                  type="button"
                  onClick={(event) => setConvertTrigger(event.currentTarget)}
                >
                  {t("journalPlainContent")}
                </button>
              </div>
              <p className={styles.hint}>{t("journalContentLimit")}</p>
            </>
          )}
      </fieldset>
      <ConfirmDialog
        open={convertTrigger !== null}
        title={t("journalPlainContent")}
        description={t("journalPlainContentConfirm")}
        cancelLabel={t("cancel")}
        confirmLabel={t("journalPlainContent")}
        trigger={convertTrigger}
        busy={disabled}
        onCancel={() => setConvertTrigger(null)}
        onConfirm={() => {
          onChange(text, null);
          setConvertTrigger(null);
          window.requestAnimationFrame(() => plainInput.current?.focus());
        }}
      />
    </>
  );
}
