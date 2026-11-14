import type {
  ProfileMediaKind,
  ProfileMediaResponse,
} from "../contracts/profile_media.ts";
import type { RewindApiRepository } from "../contracts/repository.ts";
import { RewindApiError } from "../http/errors.ts";
import { type PgConnection, pool } from "../runtime/database.ts";
import { beginUserTransaction } from "../runtime/transactions.ts";
import { profileStorage } from "../runtime/profile_media.ts";

async function lockProfile(connection: PgConnection, userId: number) {
  const result = await connection.queryObject({
    text: "SELECT id FROM rewind.users WHERE id = $1 AND is_active FOR UPDATE",
    args: [userId],
  });
  if (!result.rows.length) throw new RewindApiError(404, "Profile not found");
}

async function updateImageUrl(
  connection: PgConnection,
  userId: number,
  kind: ProfileMediaKind,
  url: string | null,
): Promise<ProfileMediaResponse> {
  const column = kind === "avatar" ? "avatar_url" : "banner_url";
  const result = await connection.queryObject<
    { avatar_url: string | null; banner_url: string | null }
  >({
    text:
      `UPDATE rewind.users SET ${column} = $2 WHERE id = $1 RETURNING avatar_url, banner_url`,
    args: [userId, url],
  });
  const row = result.rows[0];
  if (!row) throw new RewindApiError(404, "Profile not found");
  return { avatarUrl: row.avatar_url, bannerUrl: row.banner_url };
}

async function abandonPendingObject(path: string) {
  const connection = await pool.connect();
  try {
    await connection.queryObject("BEGIN");
    await connection.queryObject("SET LOCAL ROLE rewind_edge_app");
    await connection.queryObject(
      "SELECT set_config('rewind.media_cleanup_worker', 'true', TRUE)",
    );
    // An uncertain COMMIT may already have adopted this object. Active images stay in place.
    await connection.queryObject({
      text:
        `UPDATE rewind.profile_media_objects SET status = 'DELETE', next_attempt_at = CURRENT_TIMESTAMP
             WHERE object_path = $1 AND status = 'PENDING'`,
      args: [path],
    });
    await connection.queryObject("COMMIT");
  } catch (error) {
    try {
      await connection.queryObject("ROLLBACK");
    } catch { /* transaction may already be closed */ }
    throw error;
  } finally {
    connection.release();
  }
}

export const profileMediaRepository: Pick<
  RewindApiRepository,
  "updateMyProfileMedia"
> = {
  async updateMyProfileMedia(authUser, kind, image, expectedUserId) {
    profileStorage.ensureConfigured();
    const { connection, userId } = await beginUserTransaction(authUser);
    let path: string | null = null;
    let publicUrl: string | null = null;
    try {
      if (userId !== expectedUserId) {
        throw new RewindApiError(409, "The signed-in account has changed");
      }
      await lockProfile(connection, userId);
      if (image === null) {
        const result = await updateImageUrl(connection, userId, kind, null);
        await connection.queryObject("COMMIT");
        return result;
      }
      await connection.queryObject({
        text:
          `UPDATE rewind.profile_media_objects SET status = 'DELETE', next_attempt_at = CURRENT_TIMESTAMP
               WHERE user_id = $1 AND status = 'PENDING' AND next_attempt_at <= CURRENT_TIMESTAMP`,
        args: [userId],
      });
      const pending = await connection.queryObject<{ total: string }>({
        text:
          "SELECT COUNT(*)::text AS total FROM rewind.profile_media_objects WHERE user_id = $1 AND status = 'PENDING'",
        args: [userId],
      });
      if (Number(pending.rows[0]?.total ?? 0) >= 3) {
        throw new RewindApiError(429, "Too many image uploads in progress");
      }
      path = `${userId}/${kind}/${crypto.randomUUID()}.${image.extension}`;
      publicUrl = profileStorage.publicUrl(path);
      await connection.queryObject({
        text:
          `INSERT INTO rewind.profile_media_objects (object_path, user_id, supabase_user_id, kind, public_url)
               VALUES ($1, $2, $3, $4, $5)`,
        args: [path, userId, authUser.id, kind, publicUrl],
      });
      await connection.queryObject("COMMIT");
    } catch (error) {
      try {
        await connection.queryObject("ROLLBACK");
      } catch { /* transaction may already be closed */ }
      throw error;
    } finally {
      connection.release();
    }

    try {
      // The committed pending record makes a failed/abandoned upload discoverable by cleanup.
      await profileStorage.upload(path!, image!);
      const saved = await beginUserTransaction(authUser);
      try {
        if (saved.userId !== expectedUserId) {
          throw new RewindApiError(409, "The signed-in account has changed");
        }
        await lockProfile(saved.connection, saved.userId);
        const ticket = await saved.connection.queryObject({
          text:
            `SELECT object_path FROM rewind.profile_media_objects WHERE object_path = $1
                 AND user_id = $2 AND status = 'PENDING' AND locked_until IS NULL
                 AND next_attempt_at > CURRENT_TIMESTAMP FOR UPDATE`,
          args: [path, saved.userId],
        });
        if (!ticket.rows.length) {
          throw new RewindApiError(409, "The image upload has expired");
        }
        const result = await updateImageUrl(
          saved.connection,
          saved.userId,
          kind,
          publicUrl,
        );
        await saved.connection.queryObject({
          text:
            "UPDATE rewind.profile_media_objects SET status = 'ACTIVE' WHERE object_path = $1",
          args: [path],
        });
        await saved.connection.queryObject("COMMIT");
        return result;
      } catch (error) {
        try {
          await saved.connection.queryObject("ROLLBACK");
        } catch { /* transaction may already be closed */ }
        throw error;
      } finally {
        saved.connection.release();
      }
    } catch (error) {
      // If cleanup cannot be scheduled now, the original pending lease still expires.
      await abandonPendingObject(path!).catch(() => undefined);
      throw error;
    }
  },
};
