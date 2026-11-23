#!/usr/bin/env bash
set -euo pipefail

artifact_dir="${1:?Usage: restore-supabase-backup.sh ARTIFACT_DIRECTORY}"
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
run_id="${RESTORE_RUN_ID:?RESTORE_RUN_ID is required}"
: "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE is required}"
: "${PGHOST:?PGHOST is required}"
: "${PGPORT:?PGPORT is required}"
: "${PGDATABASE:?PGDATABASE is required}"
: "${PGUSER:?PGUSER is required}"
: "${PGPASSWORD:?PGPASSWORD is required}"

# Restore is deliberately limited to the disposable PostgreSQL service in the
# GitHub Actions workflow. Refuse remote hosts or differently named databases
# so a misconfigured invocation cannot overwrite a hosted environment.
if [[ "$PGHOST" != "127.0.0.1" || "$PGPORT" != "5432" || "$PGDATABASE" != "rewind_restore" ]]; then
  echo "Refusing restore: target must be disposable PostgreSQL at 127.0.0.1:5432/rewind_restore" >&2
  exit 2
fi

if [[ ! "$run_id" =~ ^[0-9]+$ ]]; then
  echo "RESTORE_RUN_ID must contain digits only" >&2
  exit 2
fi

archive="$artifact_dir/rewind.dump.gpg"
checksum="$artifact_dir/rewind.dump.gpg.sha256"
rowset_archive="$artifact_dir/rewind-rowset.tsv.gpg"
rowset_checksum="$artifact_dir/rewind-rowset.tsv.gpg.sha256"
if [[ ! -s "$archive" || ! -s "$checksum" ]]; then
  echo "Encrypted archive or checksum is missing" >&2
  exit 1
fi

(cd "$artifact_dir" && sha256sum --check --status "$(basename "$checksum")")

work="$(mktemp -d "${RUNNER_TEMP:-${TMPDIR:-/tmp}}/rewind-restore.XXXXXX")"
chmod 700 "$work"
trap 'rm -rf -- "$work"' EXIT

has_rowset_manifest=false
if [[ -e "$rowset_archive" || -e "$rowset_checksum" ]]; then
  if [[ ! -s "$rowset_archive" || ! -s "$rowset_checksum" ]]; then
    echo "Encrypted rowset manifest or checksum is incomplete" >&2
    exit 1
  fi
  (cd "$artifact_dir" && sha256sum --check --status "$(basename "$rowset_checksum")")
  printf '%s' "$BACKUP_PASSPHRASE" \
    | gpg --batch --quiet --pinentry-mode loopback --passphrase-fd 0 \
        --decrypt "$rowset_archive" > "$work/expected-rowset.tsv"
  test -s "$work/expected-rowset.tsv"
  has_rowset_manifest=true
fi

printf '%s' "$BACKUP_PASSPHRASE" \
  | gpg --batch --quiet --pinentry-mode loopback --passphrase-fd 0 \
      --decrypt "$archive" > "$work/rewind.dump"
test -s "$work/rewind.dump"

docker run --rm --network host \
  -e PGPASSWORD="$PGPASSWORD" \
  postgres:17.11 psql -X -v ON_ERROR_STOP=1 \
    --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" \
    --dbname="$PGDATABASE" \
    --command='CREATE ROLE rewind_edge_app NOLOGIN; CREATE ROLE rewind_edge_reader NOLOGIN;'

docker run --rm --network host \
  -e PGPASSWORD="$PGPASSWORD" \
  -v "$work/rewind.dump:/rewind.dump:ro" \
  postgres:17.11 pg_restore --exit-on-error --single-transaction \
    --no-owner --no-acl --host="$PGHOST" --port="$PGPORT" \
    --username="$PGUSER" --dbname="$PGDATABASE" /rewind.dump

if [[ "$has_rowset_manifest" == true ]]; then
  docker run --rm --network host \
    -e PGPASSWORD="$PGPASSWORD" \
    -v "$script_dir/rewind-rowset-manifest.sql:/rewind-rowset-manifest.sql:ro" \
    postgres:17.11 psql -X -q -A -t -F '|' -v ON_ERROR_STOP=1 \
      --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" \
      --dbname="$PGDATABASE" --file=/rewind-rowset-manifest.sql \
      > "$work/actual-rowset.tsv"
  if ! cmp --silent "$work/expected-rowset.tsv" "$work/actual-rowset.tsv"; then
    echo "Restored rowsets do not match the encrypted snapshot manifest" >&2
    exit 1
  fi
fi

cat > "$work/verify.sql" <<'SQL'
\set ON_ERROR_STOP on
SELECT format('SELECT count(*) FROM %I.%I;', table_schema, table_name)
FROM information_schema.tables
WHERE table_schema = 'rewind' AND table_type = 'BASE TABLE'
ORDER BY table_name
\gexec
SQL

# Run a count scan on every restored table without emitting private table counts to public Actions logs.
docker run --rm --network host \
  -e PGPASSWORD="$PGPASSWORD" \
  -v "$work/verify.sql:/verify.sql:ro" \
  postgres:17.11 psql -X -qAt -v ON_ERROR_STOP=1 \
    --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" \
    --dbname="$PGDATABASE" --file=/verify.sql > /dev/null

metadata="$(docker run --rm --network host \
  -e PGPASSWORD="$PGPASSWORD" \
  postgres:17.11 psql -X -qAt -v ON_ERROR_STOP=1 \
    --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" \
    --dbname="$PGDATABASE" \
    --command="SELECT (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'rewind' AND table_type = 'BASE TABLE') || '|' || (SELECT count(*) FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace WHERE n.nspname = 'rewind' AND c.contype = 'f') || '|' || (SELECT count(*) FROM pg_sequences WHERE schemaname = 'rewind');")"

IFS='|' read -r table_count foreign_key_count sequence_count <<< "$metadata"
if [[ ! "$table_count" =~ ^[0-9]+$ || "$table_count" -lt 1 \
   || ! "$foreign_key_count" =~ ^[0-9]+$ || "$foreign_key_count" -lt 1 \
   || ! "$sequence_count" =~ ^[0-9]+$ || "$sequence_count" -lt 1 ]]; then
  echo "Restored schema is missing tables, foreign keys, or sequences" >&2
  exit 1
fi

if [[ "$has_rowset_manifest" == true ]]; then
  printf 'Restore verification passed for run %s: encrypted rowset manifest matches; schema tables, row scans, foreign keys, and sequences are present. Private row counts were not logged.\n' "$run_id"
else
  printf 'Restore verification passed for run %s: legacy archive schema tables, row scans, foreign keys, and sequences are present. Private row counts were not logged.\n' "$run_id"
fi
