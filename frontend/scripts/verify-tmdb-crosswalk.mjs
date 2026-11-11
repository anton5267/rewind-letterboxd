import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const csvPath = resolve(repositoryRoot, "docs/project/TMDB_VERIFIED_CROSSWALK.csv");
const contents = readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "").trimEnd();
const lines = contents.split(/\r?\n/);

if (lines[0] !== "movie_id,tmdb_id") {
  throw new Error("TMDB crosswalk must start with the exact movie_id,tmdb_id header.");
}

const expectedMovieIds = [
  ...Array.from({ length: 35 }, (_, index) => index + 1),
  ...Array.from({ length: 14 }, (_, index) => index + 37),
];
const movieIds = new Set();
const tmdbIds = new Set();

if (lines.length - 1 !== expectedMovieIds.length) {
  throw new Error(`TMDB crosswalk must contain exactly ${expectedMovieIds.length} data rows; found ${lines.length - 1}.`);
}

for (const [index, line] of lines.slice(1).entries()) {
  const match = /^(0|[1-9]\d*),(0|[1-9]\d*)$/.exec(line);
  if (!match) {
    throw new Error(`TMDB crosswalk row ${index + 2} must contain two canonical positive integer IDs.`);
  }

  const movieId = Number(match[1]);
  const tmdbId = Number(match[2]);
  if (!Number.isSafeInteger(movieId) || movieId <= 0 || !Number.isSafeInteger(tmdbId) || tmdbId <= 0) {
    throw new Error(`TMDB crosswalk row ${index + 2} contains an invalid ID.`);
  }
  if (movieIds.has(movieId)) {
    throw new Error(`TMDB crosswalk contains duplicate REWIND movie ID ${movieId}.`);
  }
  if (movieId !== expectedMovieIds[index]) {
    throw new Error(`TMDB crosswalk row ${index + 2} must map REWIND movie ${expectedMovieIds[index]}; found ${movieId}.`);
  }
  if (tmdbIds.has(tmdbId)) {
    throw new Error(`TMDB crosswalk contains duplicate TMDB ID ${tmdbId}.`);
  }

  movieIds.add(movieId);
  tmdbIds.add(tmdbId);
}

console.log("TMDB crosswalk structure is valid: 49 rows for REWIND IDs 1–35 and 37–50, with unique positive IDs.");
console.log("This structural check does not independently verify IMDb↔TMDB identity.");
