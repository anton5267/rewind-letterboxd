import type { RewindApiRepository } from "../contracts/repository.ts";
import { beginUserTransaction } from "../runtime/transactions.ts";
import { moveOwnedFavorite } from "./shared/profile_favorite_order.ts";

export const profileFavoriteRepository: Pick<RewindApiRepository, "moveMyFavorite"> = {
  async moveMyFavorite(authUser, move) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const found = await moveOwnedFavorite(connection, userId, move);
      await connection.queryObject("COMMIT");
      return found;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
};
