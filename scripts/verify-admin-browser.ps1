param([string]$BaseUrl = 'http://127.0.0.1:8081')

$ErrorActionPreference = 'Stop'
$suffix = [guid]::NewGuid().ToString('N').Substring(0, 12)
$username = "adminbrowser$suffix"
$email = "$username@example.invalid"
$password = 'E2e-admin-password-123!'
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

try {
    $null = Invoke-WebRequest -UseBasicParsing "$BaseUrl/api/auth/csrf" -WebSession $session
    $csrf = $session.Cookies.GetCookies([uri]"$BaseUrl/api/auth/csrf") | Where-Object Name -eq 'XSRF-TOKEN'
    if (-not $csrf) { throw 'CSRF cookie was not issued' }
    $headers = @{ 'X-XSRF-TOKEN' = $csrf.Value }
    $registration = Invoke-WebRequest -Method POST -UseBasicParsing "$BaseUrl/api/auth/register" -WebSession $session -Headers $headers -ContentType 'application/json' -Body (@{ username = $username; email = $email; password = $password } | ConvertTo-Json -Compress)
    if ($registration.StatusCode -ne 200) { throw "Registration returned HTTP $($registration.StatusCode)" }

    # The role change is performed only for this disposable dev fixture. The app
    # itself has no public role-escalation route.
    "UPDATE users SET role='ADMIN' WHERE email='$email';" | docker compose exec -T db sh -lc 'mysql -urewind -p"$MYSQL_PASSWORD" rewind'

    $frontend = Join-Path (Split-Path -Parent $PSScriptRoot) 'letterboxd/letterboxd-login-figma-final2'
    Push-Location $frontend
    try {
        $env:E2E_ADMIN_EMAIL = $email
        $env:E2E_ADMIN_PASSWORD = $password
        $env:E2E_ADMIN_USERNAME = $username
        npx playwright test tests/e2e/admin-flow.spec.ts
        if ($LASTEXITCODE -ne 0) { throw "Admin browser test failed with exit code $LASTEXITCODE" }
    }
    finally {
        Remove-Item Env:E2E_ADMIN_EMAIL, Env:E2E_ADMIN_PASSWORD, Env:E2E_ADMIN_USERNAME -ErrorAction SilentlyContinue
        Pop-Location
    }
    Write-Output 'Admin browser smoke passed'
}
finally {
    "DELETE FROM users WHERE email='$email';" | docker compose exec -T db sh -lc 'mysql -urewind -p"$MYSQL_PASSWORD" rewind' | Out-Null
}
