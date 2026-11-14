import type { JournalContentBlock } from "../../api/journal-content";
import { useLocale } from "../../i18n";
import ResilientImage from "../ResilientImage";
import styles from "./JournalBody.module.css";

export default function JournalBody(
  { text, blocks }: { text: string; blocks?: JournalContentBlock[] | null },
) {
  const { t } = useLocale();
  if (!Array.isArray(blocks) || blocks.length === 0) return <>{text}</>;
  return (
    <div className={styles.body}>
      {blocks.map((block, index) => {
        if (block.type === "paragraph") return <p key={index}>{block.text}</p>;
        if (block.type === "heading") {
          return block.level === 3
            ? <h3 key={index}>{block.text}</h3>
            : <h2 key={index}>{block.text}</h2>;
        }
        if (block.type === "list") {
          return (
            <ul key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          );
        }
        return (
          <figure
            key={index}
            className={`${styles.figure} ${
              block.layout === "aside" ? styles.aside : ""
            }`}
          >
            <div className={styles.media}>
              <ResilientImage
                src={block.url}
                alt={block.alt}
                loading="lazy"
                fallback={
                  <span
                    className={styles.unavailable}
                    role="img"
                    aria-label={block.alt}
                  >
                    {t("journalImageUnavailable")}
                  </span>
                }
              />
            </div>
            {block.caption && <figcaption>{block.caption}</figcaption>}
          </figure>
        );
      })}
    </div>
  );
}
