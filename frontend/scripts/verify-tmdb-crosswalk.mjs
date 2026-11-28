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

const expectedMovieIds = Array.from({ length: 50 }, (_, index) => index + 1);
const confirmedMovieTmdbIds = new Map([[36, 1147411]]);
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
  const confirmedTmdbId = confirmedMovieTmdbIds.get(movieId);
  if (confirmedTmdbId !== undefined && tmdbId !== confirmedTmdbId) {
    throw new Error(`TMDB crosswalk maps REWIND movie ${movieId} to ${tmdbId}; the TMDB search-confirmed ID is ${confirmedTmdbId}.`);
  }

  movieIds.add(movieId);
  tmdbIds.add(tmdbId);
}

console.log("TMDB crosswalk structure is valid: 50 rows for REWIND IDs 1–50, with unique positive IDs and the TMDB-confirmed mapping for movie 36.");
console.log("This structural check does not independently verify IMDb↔TMDB identity.");
