param(
    [string]$BaseUrl = 'http://localhost:8080',
    [string]$MailpitUrl = 'http://localhost:8025'
)

$ErrorActionPreference = 'Stop'
$suffix = [guid]::NewGuid().ToString('N').Substring(0, 12)
$email = "reset-$suffix@example.invalid"
$oldPassword = 'OldVerification123!'
$newPassword = 'NewVerification123!'

function Post([string]$Path, $Body) {
    Invoke-WebRequest -Method POST -Uri "$BaseUrl/api$Path" -ContentType 'application/json' -Body ($Body | ConvertTo-Json -Compress) -UseBasicParsing
}

$registered = Post '/auth/register' @{ username = "reset$suffix"; email = $email; password = $oldPassword }
if ($registered.StatusCode -ne 200) { throw 'Registration failed' }
$unknown = Post '/auth/forgot-password' @{ email = 'missing@example.invalid' }
$requested = Post '/auth/forgot-password' @{ email = $email }
if ($unknown.StatusCode -ne 202 -or $requested.StatusCode -ne 202 -or $unknown.Content -ne $requested.Content) {
    throw 'Password reset responses reveal account existence'
}

$body = (Invoke-WebRequest -Uri "$MailpitUrl/view/latest.txt" -UseBasicParsing).Content
if ($body -notmatch '/uk/reset-password\?token=') { throw 'Email does not link to the localized reset page' }
if ($body -notmatch 'token=([A-Za-z0-9_-]+)') { throw 'No reset token in captured email' }
$token = $Matches[1]
$changed = Post '/auth/reset-password' @{ token = $token; newPassword = $newPassword }
if ($changed.StatusCode -ne 204) { throw 'Password reset failed' }

try {
    $null = Post '/auth/reset-password' @{ token = $token; newPassword = $oldPassword }
    throw 'Reset link was accepted twice'
} catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 400) { throw }
}

$login = Post '/auth/login' @{ email = $email; password = $newPassword }
if ($login.StatusCode -ne 200) { throw 'Login with new password failed' }
Write-Output 'HTTP password reset flow passed: same generic response, email delivered, one-time link, new login.'
