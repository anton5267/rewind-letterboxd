import type { RewindApiRepository } from "../contracts/repository.ts";
import { pool } from "../runtime/database.ts";
import { countPublicWatchedFilmEntries } from "./shared/public_stats.ts";

export const publicStatsRepository: Pick<RewindApiRepository, "getPublicWatchedFilmCount"> = {
  async getPublicWatchedFilmCount(): Promise<number> {
    const connection = await pool.connect();
    try {
      return await countPublicWatchedFilmEntries(connection);
    } finally {
      connection.release();
    }
  },
};
