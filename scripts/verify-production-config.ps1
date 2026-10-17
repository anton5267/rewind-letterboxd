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
if (-not $values.ContainsKey('HTTP_PORT')) { throw 'HTTP_PORT must bind the web service to a loopback port behind the HTTPS proxy' }
if ($values['HTTP_PORT'] -notmatch '^127\.0\.0\.1:\d+$') { throw 'HTTP_PORT must look like 127.0.0.1:8088 for the host HTTPS proxy' }

$configJson = docker compose --env-file $envPath -f $ComposeFile config --format json | ConvertFrom-Json
if ($configJson.services.db.ports -or $configJson.services.redis.ports -or $configJson.services.api.ports) {
    throw 'Production database, Redis, and API services must not publish host ports'
}
if (-not $configJson.services.api.read_only) { throw 'Production API must use read_only: true' }
if ([string]$configJson.services.api.environment.COOKIE_SECURE -ne 'true') { throw 'Production API must set COOKIE_SECURE=true' }
$webPorts = @($configJson.services.web.ports)
if ($webPorts.Count -ne 1 -or [string]$webPorts[0].host_ip -ne '127.0.0.1' -or [string]$webPorts[0].published -notmatch '^\d+$' -or [int]$webPorts[0].target -ne 80) {
    throw 'Production web must publish exactly one loopback host port for the HTTPS proxy'
}

Write-Output "Production config verified: HTTPS base URL, strong secrets, private DB/Redis/API, read-only API, loopback web port"
