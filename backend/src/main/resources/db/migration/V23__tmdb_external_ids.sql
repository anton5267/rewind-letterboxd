-- Controlled TMDB synchronization identifiers. Existing rows remain valid because
-- NULL values are allowed until an administrator explicitly syncs a record.
ALTER TABLE movies ADD COLUMN tmdb_id BIGINT NULL;
ALTER TABLE movies ADD UNIQUE KEY uk_movies_tmdb_id (tmdb_id);

ALTER TABLE genres ADD COLUMN tmdb_id BIGINT NULL;
ALTER TABLE genres ADD UNIQUE KEY uk_genres_tmdb_id (tmdb_id);

ALTER TABLE actors ADD COLUMN tmdb_id BIGINT NULL;
ALTER TABLE actors ADD UNIQUE KEY uk_actors_tmdb_id (tmdb_id);

ALTER TABLE directors ADD COLUMN tmdb_id BIGINT NULL;
ALTER TABLE directors ADD UNIQUE KEY uk_directors_tmdb_id (tmdb_id);
