# Production deployment runbook

This runbook prepares a Linux VPS deployment. It does not claim that a public VPS, domain, or SMTP account already exists.

## 1. VPS and DNS

Use a current Ubuntu LTS host with Docker Engine and the Compose v2 plugin. Point the domain's `A`/`AAAA` records to the VPS and allow inbound TCP 80 and 443. Keep SSH restricted to the administrator's network or key based access.

```sh
git clone https://github.com/anton5267/rewind-letterboxd.git
cd rewind-letterboxd
cp .env.production.example .env.production
```

Set strong, unique values in `.env.production`. Generate them on the VPS instead of committing them:

```sh
openssl rand -base64 36       # DB_PASSWORD
openssl rand -base64 36       # MYSQL_ROOT_PASSWORD
openssl rand -base64 64       # JWT_SECRET
```

Set `PUBLIC_BASE_URL=https://your-domain`, real SMTP values, and `HTTP_PORT=127.0.0.1:8088`. The web container is intentionally loopback-only so the host HTTPS proxy owns ports 80/443.

TMDB synchronization is disabled by default. Enable the provider only after setting a newly rotated `TMDB_API_KEY`; enable the scheduled crawl separately and keep its batch/interval bounded:

```dotenv
TMDB_ENABLED=true
TMDB_API_KEY=<rotated-provider-key>
TMDB_SCHEDULER_ENABLED=true
TMDB_SCHEDULER_BATCH_SIZE=10
TMDB_SCHEDULER_INTERVAL_MS=86400000
TMDB_SCHEDULER_INITIAL_DELAY_MS=60000
```

The scheduler refreshes at most 20 already-linked movies per run, oldest `updatedAt` first, and isolates failures per movie. Leave `TMDB_SCHEDULER_ENABLED=false` until the provider quota, key rotation, and first controlled run have been verified.

Before starting services on the VPS, run the PowerShell validator on a Windows checkout or reproduce its checks in CI. It rejects example secrets, HTTP base URLs, published DB/Redis/API ports, insecure cookies, writable API containers, and non-loopback web binding:

```powershell
./scripts/verify-production-config.ps1 -EnvFile .env.production
```

The validator also checks the SMTP port range and the SMTP/TMDB boolean flags before Compose resolution. When `MAIL_SMTP_AUTH=true`, it requires non-placeholder `MAIL_USERNAME` and `MAIL_PASSWORD`; set both to the real provider credentials or explicitly use an unauthenticated relay with `MAIL_SMTP_AUTH=false`.

## 2. Start the stack

```sh
docker compose --env-file .env.production -f compose.production.yaml up -d --build
docker compose --env-file .env.production -f compose.production.yaml ps
docker compose --env-file .env.production -f compose.production.yaml logs --tail=100 api web
```

The API and database are internal Compose services. Check API readiness from the container network and check the public web URL after the HTTPS proxy is active. Flyway applies pending migrations during API startup; never edit an already-applied migration.

## 3. HTTPS reverse proxy

Put Caddy, Nginx, or another managed TLS proxy on the host. The repository includes [`Caddyfile.example`](../Caddyfile.example); copy it to `/etc/caddy/Caddyfile`, replace `rewind.example.com`, and validate/reload Caddy. Proxy the domain to `127.0.0.1:8088`, enable automatic certificate renewal, and preserve the `Host` and `X-Forwarded-Proto` headers. Keep `PUBLIC_BASE_URL` aligned with the canonical HTTPS URL. Do not expose port 8088 publicly.

```sh
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

For local validation, the repository includes a reproducible wrapper that runs Caddy in a container and does not require a Windows binary installation:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-caddy.ps1
```

After DNS and TLS are ready, verify:

```sh
curl -fsS https://your-domain/uk/home >/dev/null
curl -fsS https://your-domain/api/movies?size=1 >/dev/null
```

The application uses HttpOnly secure cookies and CSRF headers for state changing requests. Do not disable `COOKIE_SECURE` in production.

## 4. Backups and restore drills

Create a protected backup directory outside the web root and schedule the backup script with a service account. Keep at least 14 days and copy encrypted backups to separate storage.

```sh
mkdir -p /var/backups/rewind
BACKUP_DIR=/var/backups/rewind ENV_FILE=/srv/rewind/.env.production \
  /srv/rewind/scripts/backup-production.sh
```

The script uses `mysqldump --single-transaction`, includes routines/events, compresses output, and removes files older than `RETENTION_DAYS`. Test restoration into an isolated database or temporary VPS before relying on a backup:

```sh
CONFIRM_RESTORE=YES ENV_FILE=/srv/rewind/.env.production \
  /srv/rewind/scripts/restore-production.sh /var/backups/rewind/rewind-YYYYMMDDTHHMMSSZ.sql.gz
```

Record the restore date, migration version, row counts, and application health result. A backup is not considered verified until a restore drill succeeds.

## 5. Updates and rollback

```sh
git fetch origin
git checkout <reviewed-commit>
docker compose --env-file .env.production -f compose.production.yaml up -d --build
docker compose --env-file .env.production -f compose.production.yaml ps
```

Take a backup before schema changes. If a deployment fails, stop at the previous reviewed commit and restore the last known-good image/backup according to the restore drill. Keep application and database logs outside the container lifecycle.

## 6. Operational checks

- monitor container health, disk space, MySQL/Redis memory, certificate expiry, and backup freshness;
- keep API metrics private and expose only the public web proxy;
- rotate database, JWT, SMTP, and TMDB credentials independently;
- review admin audit logs and rate-limit alerts;
- run the browser smoke and security smoke against the deployment before calling it public.
