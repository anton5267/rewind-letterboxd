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

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$null = Invoke-WebRequest -UseBasicParsing "$BaseUrl/api/auth/csrf" -WebSession $session
$csrfStatus = Get-Status {
    Invoke-WebRequest -Method POST -UseBasicParsing "$BaseUrl/api/auth/login" -WebSession $session -ContentType 'application/json' -Body '{"email":"unknown@example.invalid","password":"wrong-password"}'
}
Expect-Status 'login without CSRF header' $csrfStatus 403

Write-Output 'Backend security smoke passed'
