param([string]$ComposeFile = 'compose.yaml')

$ErrorActionPreference = 'Stop'

$mysqlPassword = $env:MYSQL_PASSWORD
if (-not $mysqlPassword) {
    $envFile = Join-Path (Split-Path -Parent $PSScriptRoot) '.env'
    if (Test-Path $envFile) {
        $mysqlPassword = ((Get-Content $envFile | Where-Object { $_ -match '^MYSQL_PASSWORD=' } | Select-Object -First 1) -split '=', 2)[1]
    }
}
if (-not $mysqlPassword) { throw 'MYSQL_PASSWORD is required; run scripts/init-dev-env.ps1 or set the environment variable.' }

$expectedTables = @(
    'users', 'movies', 'actors', 'directors', 'genres', 'movie_actors', 'movie_directors', 'movie_genres',
    'lists', 'list_items', 'reviews', 'review_archive', 'ratings', 'external_ratings', 'similar_movies',
    'comments', 'follows', 'review_likes', 'user_activities', 'tags', 'list_tags', 'notifications',
    'notification_preferences', 'password_reset_tokens', 'refresh_sessions', 'conversations', 'messages',
    'admin_audit_logs', 'journal_articles', 'newsletter_subscriptions', 'newsletter_deliveries', 'site_settings'
)

$tableOutput = docker compose -f $ComposeFile exec -T db mysql -N -B -urewind "-p$mysqlPassword" -D rewind -e "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY table_name;"
$actualTables = @($tableOutput | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$missing = @($expectedTables | Where-Object { $_ -notin $actualTables })
if ($missing.Count -gt 0) { throw "Missing schema tables: $($missing -join ', ')" }

$foreignKeyOutput = docker compose -f $ComposeFile exec -T db mysql -N -B -urewind "-p$mysqlPassword" -D rewind -e "SELECT COUNT(*) FROM information_schema.key_column_usage WHERE table_schema = DATABASE() AND referenced_table_name IS NOT NULL;"
$foreignKeyCount = [int]($foreignKeyOutput | Select-Object -First 1)
if ($foreignKeyCount -lt 30) { throw "Expected at least 30 foreign-key relationships, found $foreignKeyCount" }

Write-Output "ER schema verified: $($actualTables.Count) tables, $foreignKeyCount foreign-key relationships"
