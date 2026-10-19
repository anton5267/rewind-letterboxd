param([string]$EnvFile = '.env.production', [string]$ComposeFile = 'compose.production.yaml')

$ErrorActionPreference = 'Stop'

$envPath = [IO.Path]::GetFullPath($EnvFile)
if (-not (Test-Path -LiteralPath $envPath -PathType Leaf)) {
    throw "Production env file '$envPath' was not found. Copy .env.production.example and replace every value."
}

$values = @{}
foreach ($line in Get-Content -LiteralPath $envPath) {
    if ($line -match '^\s*#' -or $line -notmatch '=') { continue }
    $parts = $line -split '=', 2
    $values[$parts[0].Trim()] = $parts[1].Trim().Trim('"').Trim("'")
}

$required = @('DB_PASSWORD', 'MYSQL_ROOT_PASSWORD', 'JWT_SECRET', 'PUBLIC_BASE_URL', 'MAIL_HOST', 'MAIL_FROM')
foreach ($key in $required) {
    if (-not $values.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($values[$key])) { throw "$key is missing from $envPath" }
    if ($values[$key] -match 'replace-with|example\.com|change-me|your-') { throw "$key still contains an example placeholder" }
}
if ($values['DB_PASSWORD'].Length -lt 24) { throw 'DB_PASSWORD must be at least 24 characters' }
if ($values['MYSQL_ROOT_PASSWORD'].Length -lt 24) { throw 'MYSQL_ROOT_PASSWORD must be at least 24 characters' }
if ($values['JWT_SECRET'].Length -lt 48) { throw 'JWT_SECRET must be at least 48 characters' }
if ($values['DB_PASSWORD'] -eq $values['MYSQL_ROOT_PASSWORD']) { throw 'DB_PASSWORD and MYSQL_ROOT_PASSWORD must differ' }
if ($values['PUBLIC_BASE_URL'] -notmatch '^https://') { throw 'PUBLIC_BASE_URL must use HTTPS' }
if ($values.ContainsKey('APP_CORS_ALLOWED_ORIGINS') -and -not [string]::IsNullOrWhiteSpace($values['APP_CORS_ALLOWED_ORIGINS'])) {
    foreach ($origin in $values['APP_CORS_ALLOWED_ORIGINS'] -split ',') {
        $normalizedOrigin = $origin.Trim()
        if ($normalizedOrigin -notmatch '^https://[^/]+$') {
            throw 'APP_CORS_ALLOWED_ORIGINS must contain only comma-separated HTTPS origins without paths'
        }
    }
}
if (-not $values.ContainsKey('HTTP_PORT')) { throw 'HTTP_PORT must bind the web service to a loopback port behind the HTTPS proxy' }
if ($values['HTTP_PORT'] -notmatch '^127\.0\.0\.1:\d+$') { throw 'HTTP_PORT must look like 127.0.0.1:8088 for the host HTTPS proxy' }
if ($values.ContainsKey('MAIL_PORT') -and ($values['MAIL_PORT'] -notmatch '^\d+$' -or [int]$values['MAIL_PORT'] -lt 1 -or [int]$values['MAIL_PORT'] -gt 65535)) { throw 'MAIL_PORT must be an integer between 1 and 65535' }
foreach ($booleanKey in @('MAIL_SMTP_AUTH', 'MAIL_SMTP_STARTTLS', 'TMDB_ENABLED', 'TMDB_SCHEDULER_ENABLED')) {
    if ($values.ContainsKey($booleanKey) -and $values[$booleanKey] -notmatch '^(?i:true|false)$') { throw "$booleanKey must be true or false" }
}
$smtpAuthEnabled = $values.ContainsKey('MAIL_SMTP_AUTH') -and $values['MAIL_SMTP_AUTH'] -match '^(?i:true)$'
if ($smtpAuthEnabled) {
    foreach ($key in @('MAIL_USERNAME', 'MAIL_PASSWORD')) {
        if (-not $values.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($values[$key])) { throw "$key is required when MAIL_SMTP_AUTH=true" }
        if ($values[$key] -match 'replace-with|example\.com|change-me|your-') { throw "$key still contains an example placeholder" }
    }
}
$tmdbEnabled = $values.ContainsKey('TMDB_ENABLED') -and $values['TMDB_ENABLED'] -match '^(?i:true)$'
$schedulerEnabled = $values.ContainsKey('TMDB_SCHEDULER_ENABLED') -and $values['TMDB_SCHEDULER_ENABLED'] -match '^(?i:true)$'
if ($schedulerEnabled -and -not $tmdbEnabled) { throw 'TMDB_SCHEDULER_ENABLED=true requires TMDB_ENABLED=true' }
if ($tmdbEnabled) {
    if (-not $values.ContainsKey('TMDB_API_KEY') -or [string]::IsNullOrWhiteSpace($values['TMDB_API_KEY'])) { throw 'TMDB_API_KEY is required when TMDB_ENABLED=true' }
    if ($values['TMDB_API_KEY'] -match 'replace-with|example|change-me|your-') { throw 'TMDB_API_KEY still contains an example placeholder' }
}
if ($values.ContainsKey('TMDB_SCHEDULER_BATCH_SIZE') -and $values['TMDB_SCHEDULER_BATCH_SIZE'] -notmatch '^([1-9]|1[0-9]|20)$') { throw 'TMDB_SCHEDULER_BATCH_SIZE must be between 1 and 20' }
if ($values.ContainsKey('TMDB_SCHEDULER_INTERVAL_MS') -and ([int64]$values['TMDB_SCHEDULER_INTERVAL_MS'] -lt 60000)) { throw 'TMDB_SCHEDULER_INTERVAL_MS must be at least 60000' }

$configJson = docker compose --env-file $envPath -f $ComposeFile config --format json | ConvertFrom-Json
if ($configJson.services.db.ports -or $configJson.services.redis.ports -or $configJson.services.api.ports) {
    throw 'Production database, Redis, and API services must not publish host ports'
}
if (-not $configJson.services.api.read_only) { throw 'Production API must use read_only: true' }
if (-not $configJson.services.web.read_only) { throw 'Production web must use read_only: true' }
$webTmpfs = @($configJson.services.web.tmpfs)
if (-not ($webTmpfs -contains '/var/cache/nginx') -or -not ($webTmpfs -contains '/var/run')) {
    throw 'Production web must provide tmpfs mounts for nginx cache and runtime state'
}
if ([string]$configJson.services.api.environment.COOKIE_SECURE -ne 'true') { throw 'Production API must set COOKIE_SECURE=true' }
$webPorts = @($configJson.services.web.ports)
if ($webPorts.Count -ne 1 -or [string]$webPorts[0].host_ip -ne '127.0.0.1' -or [string]$webPorts[0].published -notmatch '^\d+$' -or [int]$webPorts[0].target -ne 80) {
    throw 'Production web must publish exactly one loopback host port for the HTTPS proxy'
}

Write-Output "Production config verified: HTTPS base URL, strong secrets, private DB/Redis/API, read-only API/web, loopback web port"
