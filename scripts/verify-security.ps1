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

    $adminWriteRoutes = @(
        @{ Name = 'POST /api/admin/movies'; Method = 'POST'; Route = '/api/admin/movies'; Body = '{}' },
        @{ Name = 'PATCH /api/admin/users/999999'; Method = 'PATCH'; Route = '/api/admin/users/999999'; Body = '{}' },
        @{ Name = 'GET /api/admin/users/999999'; Method = 'GET'; Route = '/api/admin/users/999999'; Body = '' },
        @{ Name = 'POST /api/admin/users/999999/activate'; Method = 'POST'; Route = '/api/admin/users/999999/activate'; Body = '' },
        @{ Name = 'POST /api/admin/users/999999/deactivate'; Method = 'POST'; Route = '/api/admin/users/999999/deactivate'; Body = '' },
        @{ Name = 'PUT /api/admin/users/999999/hq'; Method = 'PUT'; Route = '/api/admin/users/999999/hq'; Body = '{"enabled":true}' },
        @{ Name = 'POST /api/admin/reviews/999999/hide'; Method = 'POST'; Route = '/api/admin/reviews/999999/hide'; Body = '{"reason":"security smoke"}' },
        @{ Name = 'POST /api/admin/reviews/999999/unhide'; Method = 'POST'; Route = '/api/admin/reviews/999999/unhide'; Body = '' },
        @{ Name = 'DELETE /api/admin/reviews/999999'; Method = 'DELETE'; Route = '/api/admin/reviews/999999'; Body = '' },
        @{ Name = 'POST /api/admin/comments/999999/hide'; Method = 'POST'; Route = '/api/admin/comments/999999/hide'; Body = '{"reason":"security smoke"}' },
        @{ Name = 'POST /api/admin/comments/999999/unhide'; Method = 'POST'; Route = '/api/admin/comments/999999/unhide'; Body = '' },
        @{ Name = 'DELETE /api/admin/comments/999999'; Method = 'DELETE'; Route = '/api/admin/comments/999999'; Body = '' },
        @{ Name = 'PUT /api/admin/movies/999999'; Method = 'PUT'; Route = '/api/admin/movies/999999'; Body = '{}' },
        @{ Name = 'DELETE /api/admin/movies/999999'; Method = 'DELETE'; Route = '/api/admin/movies/999999'; Body = '' },
        @{ Name = 'POST /api/admin/movies/999999/tmdb-sync'; Method = 'POST'; Route = '/api/admin/movies/999999/tmdb-sync'; Body = '{}' },
        @{ Name = 'PUT /api/admin/lists/999999/visibility'; Method = 'PUT'; Route = '/api/admin/lists/999999/visibility'; Body = '{"isPublic":true}' },
        @{ Name = 'DELETE /api/admin/lists/999999'; Method = 'DELETE'; Route = '/api/admin/lists/999999'; Body = '' },
        @{ Name = 'POST /api/admin/moderation/review/999999/hide'; Method = 'POST'; Route = '/api/admin/moderation/review/999999/hide'; Body = '{"reason":"security smoke"}' },
        @{ Name = 'POST /api/admin/moderation/bulk-hide'; Method = 'POST'; Route = '/api/admin/moderation/bulk-hide'; Body = '{"items":[],"reason":"security smoke"}' },
        @{ Name = 'POST /api/admin/notifications'; Method = 'POST'; Route = '/api/admin/notifications'; Body = '{}' },
        @{ Name = 'PATCH /api/admin/notifications/999999/read'; Method = 'PATCH'; Route = '/api/admin/notifications/999999/read'; Body = '' },
        @{ Name = 'PATCH /api/admin/notifications/read-all'; Method = 'PATCH'; Route = '/api/admin/notifications/read-all'; Body = '' },
        @{ Name = 'DELETE /api/admin/notifications'; Method = 'DELETE'; Route = '/api/admin/notifications'; Body = '{}' },
        @{ Name = 'DELETE /api/admin/notifications/999999'; Method = 'DELETE'; Route = '/api/admin/notifications/999999'; Body = '' },
        @{ Name = 'DELETE /api/admin/conversations/999999'; Method = 'DELETE'; Route = '/api/admin/conversations/999999'; Body = '' },
        @{ Name = 'PUT /api/admin/settings/site_name'; Method = 'PUT'; Route = '/api/admin/settings/site_name'; Body = '{"value":"Security smoke"}' },
        @{ Name = 'POST /api/admin/journal/articles'; Method = 'POST'; Route = '/api/admin/journal/articles'; Body = '{}' },
        @{ Name = 'PUT /api/admin/journal/articles/999999'; Method = 'PUT'; Route = '/api/admin/journal/articles/999999'; Body = '{}' },
        @{ Name = 'POST /api/admin/journal/articles/999999/newsletter'; Method = 'POST'; Route = '/api/admin/journal/articles/999999/newsletter'; Body = '' }
    )
    foreach ($write in $adminWriteRoutes) {
        $writeHeaders = @{ 'X-XSRF-TOKEN' = $userCsrf.Value }
        $writeArgs = @{
            Method = $write.Method
            UseBasicParsing = $true
            Uri = "$BaseUrl$($write.Route)"
            WebSession = $userSession
            Headers = $writeHeaders
        }
        if ($write.Body) {
            $writeArgs.ContentType = 'application/json'
            $writeArgs.Body = $write.Body
        }
        Expect-Status "normal user $($write.Name)" (Get-Status { Invoke-WebRequest @writeArgs }) 403
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
