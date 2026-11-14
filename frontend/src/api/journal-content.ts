export type JournalContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string; level: 2 | 3 }
  | { type: "list"; items: string[] }
  | {
    type: "image";
    url: string;
    alt: string;
    caption: string | null;
    layout: "full" | "aside";
  };

export interface JournalMedia {
  coverImages?: string[] | null;
  contentBlocks?: JournalContentBlock[] | null;
}

export function journalContentText(blocks: JournalContentBlock[]): string {
  return blocks.map((block) => {
    if (block.type === "image") return block.caption ?? "";
    if (block.type === "list") {
      return block.items.map((item) => `• ${item}`).join("\n");
    }
    return block.text;
  }).filter(Boolean).join("\n\n");
}
