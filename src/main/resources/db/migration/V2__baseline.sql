-- V2__baseline.sql (safe / idempotent)

-- add imdb_id if missing
SET @db := DATABASE();
SET @exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = @db
    AND table_name = 'movies'
    AND column_name = 'imdb_id'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE movies ADD COLUMN imdb_id VARCHAR(20) UNIQUE',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- add trailer_url if missing
SET @exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = @db
    AND table_name = 'movies'
    AND column_name = 'trailer_url'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE movies ADD COLUMN trailer_url VARCHAR(255)',
  'SELECT 1'
);
PREPARE stmt2 FROM @sql;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
