-- Older local seed imports used a latin1 client against a UTF-8 database.
-- Reinterpret only names containing the resulting double-encoded sequence.
UPDATE actors
SET name = CONVERT(CAST(CONVERT(name USING latin1) AS BINARY) USING utf8mb4)
WHERE HEX(name) LIKE '%C383C2%';

UPDATE directors
SET name = CONVERT(CAST(CONVERT(name USING latin1) AS BINARY) USING utf8mb4)
WHERE HEX(name) LIKE '%C383C2%';
