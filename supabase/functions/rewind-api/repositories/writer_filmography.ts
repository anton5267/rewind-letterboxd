import { pool } from "../runtime/database.ts";
import { readWriterFilmography } from "./shared/writer_filmography.ts";

export const writerFilmographyRepository = {
  async getWriterFilmography(tmdbPersonId: number, genreId: number | null, sort: string) {
    const connection = await pool.connect();
    try {
      return await readWriterFilmography(connection, tmdbPersonId, genreId, sort);
    } finally {
      connection.release();
    }
  },
};
