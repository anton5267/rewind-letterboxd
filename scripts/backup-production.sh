#!/usr/bin/env sh
set -eu

COMPOSE_FILE="${COMPOSE_FILE:-compose.production.yaml}"
ENV_FILE="${ENV_FILE:-.env.production}"
BACKUP_DIR="${BACKUP_DIR:-./backups/production}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

mkdir -p "$BACKUP_DIR"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
output="$BACKUP_DIR/rewind-$timestamp.sql.gz"
dump="$(mktemp "$BACKUP_DIR/.rewind-dump.XXXXXX")"
trap 'rm -f "$dump"' 0
compressed="$(mktemp "$BACKUP_DIR/.rewind-compressed.XXXXXX")"
trap 'rm -f "$dump" "$compressed"' 0
trap 'exit 1' HUP INT TERM

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T db sh -lc \
  'exec mysqldump --single-transaction --no-tablespaces --routines --events -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' \
  > "$dump"
gzip -c "$dump" > "$compressed"
mv "$compressed" "$output"

find "$BACKUP_DIR" -type f -name 'rewind-*.sql.gz' -mtime "+$RETENTION_DAYS" -delete
printf 'Created %s\n' "$output"
