param(
    [string]$BaseUrl = 'http://127.0.0.1:8081',
    [switch]$Headed,
    [string]$Grep = '',
    [string[]]$ComposeFile = @('compose.yaml'),
    [string]$ProjectName = ''
)

$ErrorActionPreference = 'Stop'
$repositoryPath = Split-Path -Parent $PSScriptRoot
$apiUri = $null
if (-not [Uri]::TryCreate($BaseUrl, [UriKind]::Absolute, [ref]$apiUri) -or
    -not $apiUri.IsLoopback -or $apiUri.Scheme -notin @('http', 'https') -or
    $apiUri.AbsolutePath -ne '/' -or $apiUri.Query -or $apiUri.Fragment) {
    throw 'BaseUrl must be a loopback HTTP(S) origin for the selected local Compose API.'
}
if ($apiUri.Port -ne 8081 -and [string]::IsNullOrWhiteSpace($ProjectName)) {
    throw 'A non-default BaseUrl requires an explicit ProjectName before any fixture is created.'
}
if ($ProjectName -and $ProjectName -notmatch '^[a-z0-9][a-z0-9_-]*$') {
    throw 'ProjectName must be a valid lowercase Compose project name.'
}

$composeArguments = @('--project-directory', $repositoryPath)
foreach ($file in $ComposeFile) {
    $composePath = if ([IO.Path]::IsPathRooted($file)) { [IO.Path]::GetFullPath($file) } else { Join-Path $repositoryPath $file }
    if (-not (Test-Path -LiteralPath $composePath -PathType Leaf)) { throw "Compose file not found: $composePath" }
    $composeArguments += @('-f', $composePath)
}
if ($ProjectName) { $composeArguments += @('-p', $ProjectName) }

$selectedProject = $ProjectName
foreach ($service in @('api', 'db', 'web')) {
    $containerIds = @(docker compose @composeArguments ps -q $service | Where-Object { $_.Trim() })
    if ($LASTEXITCODE -ne 0 -or $containerIds.Count -ne 1) { throw "Expected exactly one running $service container in the selected Compose project." }
    $owner = docker inspect $containerIds[0] --format '{{index .Config.Labels "com.docker.compose.project"}}'
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($owner)) { throw "Could not verify the $service project identity." }
    if (-not $selectedProject) { $selectedProject = $owner.Trim() }
    if ($owner.Trim() -ne $selectedProject) { throw "The $service container belongs to a different Compose project." }
}
if (-not $ProjectName) { $composeArguments += @('-p', $selectedProject) }

function Get-PublishedPort([string]$Service, [int]$ContainerPort) {
    $bindings = @(docker compose @composeArguments port $Service $ContainerPort | Where-Object { $_.Trim() })
    if ($LASTEXITCODE -ne 0 -or $bindings.Count -ne 1) {
        throw "Could not identify one published port for $Service/$ContainerPort."
    }
    $binding = [regex]::Match($bindings[0], ':(\d+)$')
    if (-not $binding.Success) { throw "Invalid published port for $Service/$ContainerPort." }
    return [int]$binding.Groups[1].Value
}

if ((Get-PublishedPort 'api' 8080) -ne $apiUri.Port) {
    throw 'BaseUrl does not match the API port published by the selected Compose project.'
}
$webPort = Get-PublishedPort 'web' 80
$webOrigin = ([UriBuilder]::new($apiUri.Scheme, $apiUri.Host, $webPort)).Uri.GetLeftPart([UriPartial]::Authority)
$BaseUrl = $apiUri.GetLeftPart([UriPartial]::Authority)

function Invoke-FixtureSql([string]$Sql) {
    $Sql | docker compose @composeArguments exec -T db sh -lc 'mysql -urewind -p"$MYSQL_PASSWORD" rewind'
    if ($LASTEXITCODE -ne 0) { throw 'The fixture SQL command failed in the selected Compose project.' }
}

$suffix = [guid]::NewGuid().ToString('N').Substring(0, 12)
$username = "adminbrowser$suffix"
$email = "$username@example.invalid"
$password = 'E2e-admin-password-123!'
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$fixtureUserId = $null
$environmentBefore = @{}
foreach ($name in @('E2E_ADMIN_EMAIL', 'E2E_ADMIN_PASSWORD', 'E2E_ADMIN_USERNAME', 'E2E_BASE_URL')) {
    $environmentBefore[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
}

try {
    $null = Invoke-WebRequest -UseBasicParsing "$BaseUrl/api/auth/csrf" -WebSession $session
    $csrf = $session.Cookies.GetCookies([uri]"$BaseUrl/api/auth/csrf") | Where-Object Name -eq 'XSRF-TOKEN'
    if (-not $csrf) { throw 'CSRF cookie was not issued' }
    $headers = @{ 'X-XSRF-TOKEN' = $csrf.Value }
    $registration = Invoke-WebRequest -Method POST -UseBasicParsing "$BaseUrl/api/auth/register" -WebSession $session -Headers $headers -ContentType 'application/json' -Body (@{ username = $username; email = $email; password = $password } | ConvertTo-Json -Compress)
    if ($registration.StatusCode -ne 200) { throw "Registration returned HTTP $($registration.StatusCode)" }
    $fixtureUserId = [long]($registration.Content | ConvertFrom-Json).id
    if ($fixtureUserId -le 0) { throw 'Registration did not return a valid fixture user ID.' }

    # The role change is performed only for this disposable dev fixture. The app
    # itself has no public role-escalation route.
    Invoke-FixtureSql "UPDATE users SET role='ADMIN' WHERE id=$fixtureUserId AND email='$email';"

    $frontend = Join-Path (Split-Path -Parent $PSScriptRoot) 'frontend'
    Push-Location $frontend
    try {
        $env:E2E_ADMIN_EMAIL = $email
        $env:E2E_ADMIN_PASSWORD = $password
        $env:E2E_ADMIN_USERNAME = $username
        $env:E2E_BASE_URL = $webOrigin
        $playwrightArgs = @('playwright', 'test', 'tests/e2e/admin-flow.spec.ts')
        if ($Headed) { $playwrightArgs += '--headed' }
        if ($Grep) { $playwrightArgs += @('-g', $Grep) }
        npx @playwrightArgs
        if ($LASTEXITCODE -ne 0) { throw "Admin browser test failed with exit code $LASTEXITCODE" }
    }
    finally {
        Pop-Location
    }
    Write-Output 'Admin browser smoke passed'
}
finally {
    try {
        if ($fixtureUserId -gt 0) {
            Invoke-FixtureSql "DELETE FROM users WHERE id=$fixtureUserId AND email='$email';" | Out-Null
        }
    } finally {
        foreach ($name in $environmentBefore.Keys) {
            if ($null -eq $environmentBefore[$name]) {
                Remove-Item "Env:\$name" -ErrorAction SilentlyContinue
            } else {
                [Environment]::SetEnvironmentVariable($name, $environmentBefore[$name], 'Process')
            }
        }
    }
}
