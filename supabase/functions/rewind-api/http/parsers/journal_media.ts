import type {
  JournalContentBlock,
  JournalMedia,
} from "../../contracts/journal_media.ts";

function text(value: unknown, limit: number): string | null {
  return typeof value === "string" && value.trim().length > 0 &&
      value.length <= limit && !value.includes("\0")
    ? value.trim()
    : null;
}
function imageUrl(value: unknown): string | null {
  const candidate = text(value, 500);
  if (!candidate) return null;
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.href
      : null;
  } catch {
    return null;
  }
}

export function parseJournalCoverImages(
  value: unknown,
): string[] | null | false {
  if (value === null) return null;
  if (!Array.isArray(value) || value.length > 3) return false;
  const images = value.map(imageUrl);
  if (images.some((image) => image === null)) return false;
  return images.length ? images as string[] : null;
}

export function journalPlainText(blocks: JournalContentBlock[]): string {
  return blocks.map((block) => {
    if (block.type === "list") {
      return block.items.map((item) => `• ${item}`).join("\n");
    }
    if (block.type === "image") return block.caption ?? "";
    return block.text;
  }).filter(Boolean).join("\n\n");
}

export function parseJournalContentBlocks(
  value: unknown,
): JournalContentBlock[] | null | false {
  if (value === null) return null;
  if (!Array.isArray(value) || value.length < 1 || value.length > 64) {
    return false;
  }
  const blocks: JournalContentBlock[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return false;
    }
    const block = entry as Record<string, unknown>;
    if (block.type === "paragraph") {
      const paragraph = text(block.text, 100000);
      if (!paragraph) return false;
      blocks.push({ type: "paragraph", text: paragraph });
    } else if (block.type === "heading") {
      const heading = text(block.text, 255);
      const level = block.level ?? 2;
      if (!heading || (level !== 2 && level !== 3)) return false;
      blocks.push({ type: "heading", text: heading, level });
    } else if (block.type === "list") {
      if (
        !Array.isArray(block.items) || !block.items.length ||
        block.items.length > 100
      ) return false;
      const items = block.items.map((item) => text(item, 4000));
      if (items.some((item) => item === null)) return false;
      blocks.push({ type: "list", items: items as string[] });
    } else if (block.type === "image") {
      const url = imageUrl(block.url);
      const alt = text(block.alt, 300);
      const layout = block.layout ?? "full";
      const emptyCaption = block.caption == null ||
        (typeof block.caption === "string" && block.caption.trim() === "");
      const caption = emptyCaption ? null : text(block.caption, 1000);
      if (
        !url || !alt || (layout !== "full" && layout !== "aside") ||
        (!emptyCaption && caption === null)
      ) return false;
      blocks.push({ type: "image", url, alt, caption, layout });
    } else return false;
  }
  return journalPlainText(blocks).length <= 100000 ? blocks : false;
}

export function parseJournalMedia(
  body: Record<string, unknown>,
): JournalMedia | null {
  const media: JournalMedia = {};
  if (Object.hasOwn(body, "coverImages")) {
    const images = parseJournalCoverImages(body.coverImages);
    if (images === false) return null;
    media.coverImages = images;
  }
  if (Object.hasOwn(body, "contentBlocks")) {
    const blocks = parseJournalContentBlocks(body.contentBlocks);
    if (blocks === false) return null;
    media.contentBlocks = blocks;
  }
  return media;
}

export function storedJournalMedia(
  row: { cover_images?: unknown; content_blocks?: unknown },
): JournalMedia {
  const decode = (value: unknown) => {
    if (typeof value !== "string") return value ?? null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };
  return {
    coverImages: parseJournalCoverImages(decode(row.cover_images)) || null,
    contentBlocks: parseJournalContentBlocks(decode(row.content_blocks)) ||
      null,
  };
}
