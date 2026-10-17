param([string]$BaseUrl = 'http://127.0.0.1:8081')

$ErrorActionPreference = 'Stop'

function Get-Status([scriptblock]$Request) {
    try {
        $response = & $Request
        return [int]$response.StatusCode
    } catch {
        if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode.value__ }
        throw
    }
}

function Expect-Status([string]$Name, [int]$Actual, [int]$Expected) {
    if ($Actual -ne $Expected) { throw "$Name returned HTTP $Actual (expected $Expected)" }
    Write-Output "$Name : $Actual"
}

Expect-Status 'public catalog' (Get-Status { Invoke-WebRequest -UseBasicParsing "$BaseUrl/api/movies?size=1" }) 200
Expect-Status 'guest profile' (Get-Status { Invoke-WebRequest -UseBasicParsing "$BaseUrl/api/profile/me" }) 401
Expect-Status 'guest admin dashboard' (Get-Status { Invoke-WebRequest -UseBasicParsing "$BaseUrl/api/admin/dashboard" }) 401
Expect-Status 'protected metrics' (Get-Status { Invoke-WebRequest -UseBasicParsing "$BaseUrl/actuator/metrics" }) 401
Expect-Status 'public health' (Get-Status { Invoke-WebRequest -UseBasicParsing "$BaseUrl/actuator/health" }) 200

$userSuffix = [guid]::NewGuid().ToString('N').Substring(0, 12)
$userEmail = "security$userSuffix@example.invalid"
$userPassword = 'Security-user-password-123!'
$userSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
    $null = Invoke-WebRequest -UseBasicParsing "$BaseUrl/api/auth/csrf" -WebSession $userSession
    $userCsrf = $userSession.Cookies.GetCookies([uri]"$BaseUrl/api/auth/csrf") | Where-Object Name -eq 'XSRF-TOKEN'
    if (-not $userCsrf) { throw 'CSRF cookie was not issued for normal-user fixture' }
    $userHeaders = @{ 'X-XSRF-TOKEN' = $userCsrf.Value }
    $null = Invoke-WebRequest -Method POST -UseBasicParsing "$BaseUrl/api/auth/register" -WebSession $userSession -Headers $userHeaders -ContentType 'application/json' -Body (@{ username = "security$userSuffix"; email = $userEmail; password = $userPassword } | ConvertTo-Json -Compress)
    $null = Invoke-WebRequest -Method POST -UseBasicParsing "$BaseUrl/api/auth/login" -WebSession $userSession -Headers $userHeaders -ContentType 'application/json' -Body (@{ email = $userEmail; password = $userPassword } | ConvertTo-Json -Compress)
    $adminReadRoutes = @(
        '/api/admin/dashboard',
        '/api/admin/users?size=1',
        '/api/admin/comments?size=1',
        '/api/admin/reviews?size=1',
        '/api/admin/movies?size=1',
        '/api/admin/lists?size=1',
        '/api/admin/conversations?size=1',
        '/api/admin/notifications?size=1',
        '/api/admin/moderation/queue?size=1',
        '/api/admin/settings',
        '/api/admin/audit-logs?size=1'
    )
    foreach ($route in $adminReadRoutes) {
        Expect-Status "normal user $route" (Get-Status { Invoke-WebRequest -UseBasicParsing "$BaseUrl$route" -WebSession $userSession }) 403
    }
}
finally {
    "DELETE FROM users WHERE email='$userEmail';" | docker compose exec -T db sh -lc 'mysql -urewind -p"$MYSQL_PASSWORD" rewind' | Out-Null
}

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$null = Invoke-WebRequest -UseBasicParsing "$BaseUrl/api/auth/csrf" -WebSession $session
$csrfStatus = Get-Status {
    Invoke-WebRequest -Method POST -UseBasicParsing "$BaseUrl/api/auth/login" -WebSession $session -ContentType 'application/json' -Body '{"email":"unknown@example.invalid","password":"wrong-password"}'
}
Expect-Status 'login without CSRF header' $csrfStatus 403

Write-Output 'Backend security smoke passed'
