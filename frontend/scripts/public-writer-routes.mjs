const LANGUAGES = ["uk", "en"];

export function publicImageUrl(value) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export function toWriterRoutePages(writers) {
  if (!Array.isArray(writers)) throw new TypeError("Writer credits must be an array.");
  for (const writer of writers) {
    if (!writer || !Number.isSafeInteger(writer.id) || writer.id <= 0
      || typeof writer.name !== "string" || !writer.name.trim() || writer.type !== "WRITER") {
      throw new Error("Published writer search returned an invalid record; refusing to generate incomplete writer routes.");
    }
  }
  return writers.flatMap(writer => LANGUAGES.map(language => ({
    route: `${language}/people/writer/${writer.id}`,
    language,
    title: writer.name.trim(),
    description: language === "uk"
      ? `Фільмографія сценариста ${writer.name.trim()} у публічному каталозі REWIND.`
      : `${writer.name.trim()}'s writer filmography in the public REWIND catalogue.`,
    imageUrl: publicImageUrl(writer.photoUrl),
  })));
}
