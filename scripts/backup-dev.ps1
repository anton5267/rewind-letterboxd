[CmdletBinding()]
param(
    [string]$Container = 'rewind-mysql',
    [string]$Database = 'rewind',
    [string]$Username = 'rewind',
    [string]$Password = 'rewinddev',
    [string]$OutputPath = (Join-Path (Get-Location) ("backups\rewind-{0}.sql" -f (Get-Date -Format 'yyyyMMdd-HHmmss')))
)

$ErrorActionPreference = 'Stop'
$output = [IO.Path]::GetFullPath($OutputPath)
$parent = Split-Path -Parent $output
New-Item -ItemType Directory -Force -Path $parent | Out-Null

docker inspect $Container *> $null
if ($LASTEXITCODE -ne 0) { throw "Docker container '$Container' was not found." }

$userArg = "-u$Username"
$passwordArg = "-p$Password"
docker exec $Container mysqldump --single-transaction --no-tablespaces --routines --events --triggers --hex-blob $userArg $passwordArg $Database | Set-Content -Path $output -Encoding UTF8
if ($LASTEXITCODE -ne 0) { throw 'mysqldump failed.' }
if ((Get-Item -LiteralPath $output).Length -lt 100) { throw 'Backup is unexpectedly small.' }
Write-Output "Backup created: $output"
