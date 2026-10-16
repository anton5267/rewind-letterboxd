$envFile = Join-Path $PSScriptRoot '..\.env'
if (Test-Path -LiteralPath $envFile) {
    Write-Output '.env already exists; keeping its values.'
    exit 0
}

function New-HexSecret([int]$byteCount) {
    $bytes = New-Object byte[] $byteCount
    $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $generator.GetBytes($bytes) } finally { $generator.Dispose() }
    return [BitConverter]::ToString($bytes).Replace('-', '').ToLowerInvariant()
}

$lines = @(
    "MYSQL_PASSWORD=$(New-HexSecret 24)"
    "MYSQL_ROOT_PASSWORD=$(New-HexSecret 24)"
    "JWT_SECRET=$(New-HexSecret 48)"
)
[System.IO.File]::WriteAllLines($envFile, $lines)
Write-Output 'Created .env with random local development credentials.'
