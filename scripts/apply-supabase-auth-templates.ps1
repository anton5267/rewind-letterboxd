param(
    [switch]$Apply,
    [ValidateSet('All', 'EmailChange')]
    [string]$Template = 'All'
)

$ErrorActionPreference = 'Stop'
$projectRef = 'cuirmicbzspomijgkkwo'
$managementUri = "https://api.supabase.com/v1/projects/$projectRef/config/auth"
$scriptRoot = Split-Path -Parent $PSCommandPath
$confirmationPath = Join-Path $scriptRoot '..\supabase\templates\confirmation.html'
$recoveryPath = Join-Path $scriptRoot '..\supabase\templates\recovery.html'
$emailChangePath = Join-Path $scriptRoot '..\supabase\templates\email-change.html'

foreach ($path in @($confirmationPath, $recoveryPath, $emailChangePath)) {
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        throw "Required Auth template is missing: $path"
    }
}

$confirmationHtml = Get-Content -LiteralPath $confirmationPath -Raw -Encoding UTF8
$recoveryHtml = Get-Content -LiteralPath $recoveryPath -Raw -Encoding UTF8
$emailChangeHtml = Get-Content -LiteralPath $emailChangePath -Raw -Encoding UTF8
if ([string]::IsNullOrWhiteSpace($confirmationHtml) -or [string]::IsNullOrWhiteSpace($recoveryHtml) -or [string]::IsNullOrWhiteSpace($emailChangeHtml)) {
    throw 'An Auth email template is empty.'
}

$recoverySubject = '{{ $uk := eq .RedirectTo (printf "%suk/reset-password/" .SiteURL) }}{{ if or (eq .RedirectTo (printf "%sen/reset-password/" .SiteURL)) (and (not $uk) (eq .Data.language "en")) }}Reset your REWIND password{{ else }}Відновіть пароль REWIND{{ end }}'
if ($recoverySubject.Length -gt 255) {
    throw "Recovery subject exceeds Supabase's 255-character limit ($($recoverySubject.Length))."
}

$emailChangeSubject = '{{ $uk := eq .RedirectTo (printf "%suk/login/" .SiteURL) }}{{ if or (eq .RedirectTo (printf "%sen/login/" .SiteURL)) (and (not $uk) (eq .Data.language "en")) }}Confirm REWIND email change{{ else }}Підтвердьте зміну пошти{{ end }}'
if ($emailChangeSubject.Length -gt 255) {
    throw "Email change subject exceeds Supabase's 255-character limit ($($emailChangeSubject.Length))."
}

$templates = @{
    mailer_subjects_confirmation = '{{ if eq .Data.language "en" }}Confirm your REWIND email{{ else }}Підтвердьте пошту REWIND{{ end }}'
    mailer_templates_confirmation_content = $confirmationHtml
    mailer_subjects_recovery = $recoverySubject
    mailer_templates_recovery_content = $recoveryHtml
    mailer_subjects_email_change = $emailChangeSubject
    mailer_templates_email_change_content = $emailChangeHtml
}
if ($Template -eq 'EmailChange') {
    $templates = @{
        mailer_subjects_email_change = $templates.mailer_subjects_email_change
        mailer_templates_email_change_content = $templates.mailer_templates_email_change_content
    }
}
$payload = $templates | ConvertTo-Json -Depth 4 -Compress

if (-not $Apply) {
    Write-Output "Prepared Auth templates ($Template) for Supabase project $projectRef. No network request or hosted setting change was made."
    Write-Output 'Review the source templates, then rerun with -Apply. If the process token is absent, PowerShell will request it with hidden input.'
    return
}

$accessToken = [Environment]::GetEnvironmentVariable('SUPABASE_ACCESS_TOKEN', 'Process')
$secureAccessToken = $null
$accessTokenBstr = [IntPtr]::Zero
if ([string]::IsNullOrWhiteSpace($accessToken)) {
    $secureAccessToken = Read-Host 'Enter the scoped Supabase token (input hidden)' -AsSecureString
    if ($null -eq $secureAccessToken -or $secureAccessToken.Length -eq 0) {
        throw 'No Supabase token was provided. No hosted request was made.'
    }

    $accessTokenBstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureAccessToken)
    $accessToken = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($accessTokenBstr)
}

$headers = @{ Authorization = "Bearer $accessToken" }
$accessToken = $null
try {
    $null = Invoke-RestMethod -Uri $managementUri -Method Patch -Headers $headers -ContentType 'application/json; charset=utf-8' -Body $payload
    $current = Invoke-RestMethod -Uri $managementUri -Method Get -Headers $headers
} catch {
    $statusCode = 'unknown status'
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
        $statusCode = [string][int]$_.Exception.Response.StatusCode
    }
    throw "Supabase Auth template update or read-back failed ($statusCode). Response body and credential details were suppressed."
} finally {
    $headers = $null
    $accessToken = $null
    if ($accessTokenBstr -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($accessTokenBstr)
    }
    if ($null -ne $secureAccessToken) {
        $secureAccessToken.Dispose()
    }
}

$expected = $payload | ConvertFrom-Json
foreach ($key in $expected.PSObject.Properties.Name) {
    $actualProperty = $current.PSObject.Properties[$key]
    if (-not $actualProperty -or $actualProperty.Value -cne $expected.$key) {
        throw "Supabase Auth template read-back did not match the source for '$key'. No template content was printed."
    }
}

Write-Output "Supabase Auth templates ($Template) were updated and verified for project $projectRef."
