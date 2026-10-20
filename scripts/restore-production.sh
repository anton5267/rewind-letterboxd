#!/usr/bin/env sh
set -eu

if [ "$#" -ne 1 ]; then
  printf 'Usage: %s BACKUP.sql.gz\n' "$0" >&2
  exit 2
fi

COMPOSE_FILE="${COMPOSE_FILE:-compose.production.yaml}"
ENV_FILE="${ENV_FILE:-.env.production}"
backup="$1"

if [ ! -f "$backup" ]; then
  printf 'Backup not found: %s\n' "$backup" >&2
  exit 1
fi
case "${CONFIRM_RESTORE:-}" in
  YES) ;;
  *) printf 'Set CONFIRM_RESTORE=YES to restore the production database.\n' >&2; exit 2 ;;
esac

dump="$(mktemp "${TMPDIR:-/tmp}/rewind-restore.XXXXXX")"
trap 'rm -f "$dump"' 0
trap 'exit 1' HUP INT TERM
gzip -dc "$backup" > "$dump"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T db sh -lc \
  'exec mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' < "$dump"
printf 'Restored %s\n' "$backup"
