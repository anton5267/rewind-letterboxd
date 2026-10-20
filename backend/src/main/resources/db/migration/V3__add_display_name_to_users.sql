SET @db := DATABASE();

SET @exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = @db
    AND table_name = 'users'
    AND column_name = 'display_name'
);

SET @sql := IF(@exists = 0,
  'ALTER TABLE users ADD COLUMN display_name VARCHAR(60) NULL',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
