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
