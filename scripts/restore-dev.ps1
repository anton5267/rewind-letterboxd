[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory = $true)][string]$BackupPath,
    [string]$Container = 'rewind-mysql',
    [string]$Database = 'rewind',
    [string]$Username = 'rewind',
    [string]$Password = 'rewinddev'
)

$ErrorActionPreference = 'Stop'
$backup = [IO.Path]::GetFullPath($BackupPath)
if (-not (Test-Path -LiteralPath $backup -PathType Leaf)) { throw "Backup '$backup' was not found." }
if (-not $PSCmdlet.ShouldProcess("$Container/$Database", "restore $backup")) { return }

$userArg = "-u$Username"
$passwordArg = "-p$Password"
Get-Content -LiteralPath $backup -Raw | docker exec -i $Container mysql $userArg $passwordArg $Database
if ($LASTEXITCODE -ne 0) { throw 'mysql restore failed.' }
Write-Output "Backup restored into database '$Database'."
