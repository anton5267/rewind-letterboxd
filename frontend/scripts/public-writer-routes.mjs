const LANGUAGES = ["uk", "en"];

export async function fetchPublishedWriterPeople(movies, requestCatalog, concurrency = 5) {
  if (!Array.isArray(movies) || typeof requestCatalog !== "function") {
    throw new TypeError("Published movies and a catalog request function are required.");
  }
  if (!Number.isSafeInteger(concurrency) || concurrency < 1 || concurrency > 10) {
    throw new RangeError("Catalog detail concurrency must be between 1 and 10.");
  }

  const writerById = new Map();
  let nextMovieIndex = 0;
  const worker = async () => {
    while (nextMovieIndex < movies.length) {
      const movie = movies[nextMovieIndex++];
      if (!movie || !Number.isSafeInteger(movie.id) || movie.id <= 0) {
        throw new Error("Published movie has an invalid ID; refusing to generate incomplete writer routes.");
      }

      const details = await requestCatalog(`/movies/${movie.id}/details?language=en`);
      if (!details || details.id !== movie.id) {
        throw new Error(`Catalog details did not match published movie ${movie.id}; refusing to generate incomplete writer routes.`);
      }
      if (!Array.isArray(details.writers)) {
        throw new Error(`Writer credits were missing for published movie ${movie.id}; refusing to generate incomplete writer routes.`);
      }

      for (const writer of details.writers) {
        if (!writer || !Number.isSafeInteger(writer.tmdbId) || writer.tmdbId <= 0
          || typeof writer.name !== "string" || !writer.name.trim()) {
          throw new Error(`Published movie ${movie.id} has an invalid writer credit; refusing to generate incomplete writer routes.`);
        }
        if (!writerById.has(writer.tmdbId)) {
          writerById.set(writer.tmdbId, {
            tmdbId: writer.tmdbId,
            name: writer.name.trim(),
            photoUrl: typeof writer.photoUrl === "string" ? writer.photoUrl : null,
          });
        }
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, movies.length) }, worker));
  return [...writerById.values()].sort((left, right) => left.tmdbId - right.tmdbId);
}

export function toWriterRoutePages(writers) {
  if (!Array.isArray(writers)) throw new TypeError("Writer credits must be an array.");
  return writers.flatMap(writer => LANGUAGES.map(language => ({
    route: `${language}/people/writer/${writer.tmdbId}`,
    language,
    title: writer.name,
    description: language === "uk"
      ? `Фільмографія сценариста ${writer.name} у публічному каталозі REWIND.`
      : `${writer.name}'s writer filmography in the public REWIND catalogue.`,
    imageUrl: writer.photoUrl,
  })));
}
