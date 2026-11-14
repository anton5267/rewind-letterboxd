import { parseAdminJournalArticle } from "./http/parsers/admin.ts";
import {
  journalPlainText,
  parseJournalContentBlocks,
  parseJournalCoverImages,
  parseJournalMedia,
  storedJournalMedia,
} from "./http/parsers/journal_media.ts";
import { toJournalArticle } from "./repositories/shared/journal_article.ts";
import { createRewindApiHandler, type RewindApiRepository } from "./handler.ts";
import { RewindApiError } from "./http/errors.ts";

function same(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

const covers = [
  "https://images.example.invalid/one.jpg",
  "https://images.example.invalid/two.jpg",
];
const blocks = [
  { type: "heading", text: "A heading", level: 2 },
  {
    type: "image",
    url: covers[0],
    alt: "An illustration",
    caption: "A caption",
    layout: "aside",
  },
  { type: "paragraph", text: "<script>Rendered as text</script>" },
  { type: "list", items: ["One", "Two"] },
];
const legacy = {
  slug: "article",
  language: "uk",
  category: "Community",
  title: "An article",
  content: "Legacy text",
  coverUrl: covers[0],
};

Deno.test("journal media keeps omission and explicit clearing distinct", () => {
  same(parseJournalMedia({}), {});
  same(parseJournalMedia({ coverImages: [], contentBlocks: null }), {
    coverImages: null,
    contentBlocks: null,
  });
  same(parseJournalMedia({ coverImages: undefined }), null);
  same(parseJournalCoverImages(covers), covers);
  for (
    const value of [
      false,
      {},
      ["javascript:alert(1)"],
      ["data:image/png;base64,a"],
      ["/relative.jpg"],
      Array(4).fill(covers[0]),
      ["https://a.invalid/" + "x".repeat(500)],
    ]
  ) {
    same(parseJournalCoverImages(value), false);
  }
});

Deno.test("journal content validates typed blocks and derives canonical searchable text", () => {
  const parsed = parseJournalContentBlocks(blocks);
  if (!parsed) throw new Error("Valid blocks were rejected");
  same(parsed, blocks);
  same(
    journalPlainText(parsed),
    "A heading\n\nA caption\n\n<script>Rendered as text</script>\n\n• One\n• Two",
  );
  same(
    parseJournalContentBlocks([{
      type: "image",
      url: covers[0],
      alt: "Artwork",
      caption: "   ",
    }]),
    [
      {
        type: "image",
        url: covers[0],
        alt: "Artwork",
        caption: null,
        layout: "full",
      },
    ],
  );
  same(parseJournalContentBlocks([{ type: "heading", text: " Trimmed " }]), [{
    type: "heading",
    text: "Trimmed",
    level: 2,
  }]);
});

Deno.test("journal content rejects malformed, unsafe and oversized blocks", () => {
  const invalid = [
    [],
    Array(65).fill(blocks[0]),
    [null],
    [{ type: "html", text: "<b>HTML</b>" }],
    [{ type: "paragraph", text: "\0" }],
    [{ type: "paragraph", text: " " }],
    [{ type: "heading", text: "Heading", level: 1 }],
    [{ type: "list", items: [] }],
    [{ type: "list", items: [""] }],
    [{ type: "list", items: Array(101).fill("item") }],
    [{ type: "image", url: "javascript:alert(1)", alt: "Artwork" }],
    [{ type: "image", url: covers[0], alt: "" }],
    [{ type: "image", url: covers[0], alt: "Artwork", caption: 3 }],
    [{ type: "image", url: covers[0], alt: "Artwork", layout: "unknown" }],
    [{ type: "paragraph", text: "x".repeat(100001) }],
    [{ type: "paragraph", text: "x".repeat(50000) }, {
      type: "paragraph",
      text: "x".repeat(50000),
    }],
  ];
  for (const value of invalid) same(parseJournalContentBlocks(value), false);
  const maximum = [{ type: "paragraph", text: "x".repeat(100000) }];
  same(parseJournalContentBlocks(maximum), maximum);
});

Deno.test("journal Admin parser preserves legacy bodies and uses media as canonical content and cover", () => {
  const original = parseAdminJournalArticle(legacy);
  same(Object.hasOwn(original!, "coverImages"), false);
  same(Object.hasOwn(original!, "contentBlocks"), false);
  const article = parseAdminJournalArticle({
    ...legacy,
    coverImages: covers,
    contentBlocks: blocks,
    content: "Stale plain body",
    coverUrl: "https://other.invalid/",
  });
  same(article?.coverUrl, covers[0]);
  same(
    article?.content,
    "A heading\n\nA caption\n\n<script>Rendered as text</script>\n\n• One\n• Two",
  );
  same(article?.contentBlocks, blocks);
  same(
    parseAdminJournalArticle({
      ...legacy,
      contentBlocks: [{ type: "image", url: covers[0], alt: "Artwork" }],
    }),
    null,
  );
  same(
    parseAdminJournalArticle({ ...legacy, coverImages: ["file:///image.jpg"] }),
    null,
  );
});

Deno.test("journal mapping accepts driver JSON and legacy rows and falls back for corrupt metadata", () => {
  same(
    storedJournalMedia({
      cover_images: JSON.stringify(covers),
      content_blocks: JSON.stringify(blocks),
    }),
    { coverImages: covers, contentBlocks: blocks },
  );
  same(storedJournalMedia({ cover_images: covers, content_blocks: blocks }), {
    coverImages: covers,
    contentBlocks: blocks,
  });
  same(
    storedJournalMedia({
      cover_images: "{broken",
      content_blocks: [{ type: "unknown" }],
    }),
    { coverImages: null, contentBlocks: null },
  );
  const row = {
    id: "17",
    slug: "article",
    language: "uk",
    category: "Community",
    title: "Legacy",
    excerpt: null,
    content: "Text",
    cover_url: covers[0],
    audio_url: null,
    published_at: null,
  };
  const mapped = toJournalArticle(row);
  same(mapped.id, 17);
  same(mapped.content, "Text");
  same(mapped.coverImages, null);
  same(mapped.contentBlocks, null);
});

Deno.test("journal HTTP entry validates media and preserves confirmed Admin authorization", async () => {
  const empty = { content: [], totalElements: 0, totalPages: 0, number: 0 };
  const writes: unknown[] = [];
  const repository: RewindApiRepository = {
    async listGenres() {
      return [];
    },
    async searchMovies() {
      return empty;
    },
    async getMovieDetails() {
      return null;
    },
    async searchPeople() {
      return empty;
    },
    async getPersonFilmography() {
      return null;
    },
    async createAdminJournalArticle(actor, article) {
      if (actor.id !== "admin") {
        throw new RewindApiError(403, "Administrator required");
      }
      writes.push(article);
      return { ...article, id: 17, publishedAt: null };
    },
    async updateAdminJournalArticle(actor, id, article) {
      if (actor.id !== "admin") {
        throw new RewindApiError(403, "Administrator required");
      }
      writes.push(article);
      return { ...article, id, publishedAt: null };
    },
  };
  const handler = createRewindApiHandler(repository, [], {
    async verifyAccessToken(token) {
      return token === "admin" || token === "user"
        ? { id: token, email: "fixture@example.invalid", username: null, emailConfirmed: true }
        : null;
    },
  });
  const request = (token: string, body: unknown, update = false) =>
    new Request(
      `https://project.supabase.co/api/admin/journal/articles${
        update ? "/17" : ""
      }`,
      {
        method: update ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
  const payload = { ...legacy, coverImages: covers, contentBlocks: blocks };
  same((await handler(request("guest", payload))).status, 401);
  same((await handler(request("user", payload))).status, 403);
  same(
    (await handler(
      request("admin", { ...payload, contentBlocks: [{ type: "html" }] }),
    )).status,
    400,
  );
  const created = await handler(request("admin", payload));
  same(created.status, 200);
  same((await created.json()).contentBlocks, blocks);
  same(
    (await handler(
      request(
        "admin",
        { ...payload, contentBlocks: null, coverImages: null },
        true,
      ),
    )).status,
    200,
  );
  same(writes.length, 2);
});
