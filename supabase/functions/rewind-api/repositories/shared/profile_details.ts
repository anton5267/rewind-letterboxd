import type { ProfileUpdateRequest } from "../../contracts/profile.ts";
import type { PgConnection } from "../../runtime/database.ts";

export async function getProfileDetails(connection: PgConnection, userId: number) {
  const result = await connection.queryObject<{ given_name: string | null; family_name: string | null }>({
    text: "SELECT given_name, family_name FROM rewind.profile_details WHERE user_id = $1",
    args: [userId],
  });
  return {
    givenName: result.rows[0]?.given_name ?? null,
    familyName: result.rows[0]?.family_name ?? null,
  };
}

export async function saveProfileDetails(connection: PgConnection, userId: number, update: ProfileUpdateRequest) {
  if (update.givenName === undefined && update.familyName === undefined) return;
  await connection.queryObject({
    text: `INSERT INTO rewind.profile_details (user_id, given_name, family_name)
           VALUES ($1, NULLIF(BTRIM($3), ''), NULLIF(BTRIM($5), ''))
           ON CONFLICT (user_id) DO UPDATE SET
               given_name = CASE WHEN $2 THEN EXCLUDED.given_name ELSE profile_details.given_name END,
               family_name = CASE WHEN $4 THEN EXCLUDED.family_name ELSE profile_details.family_name END`,
    args: [userId, update.givenName !== undefined, update.givenName ?? null,
      update.familyName !== undefined, update.familyName ?? null],
  });
}
