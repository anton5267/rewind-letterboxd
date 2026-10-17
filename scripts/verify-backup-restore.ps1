[CmdletBinding()]
param(
    [string]$ComposeFile = 'compose.yaml',
    [string]$EnvFile = '.env',
    [string]$Database = 'rewind',
    [string]$OutputPath,
    [switch]$KeepBackup
)

$ErrorActionPreference = 'Stop'

function Assert-Identifier([string]$Value, [string]$Name) {
    if ([string]::IsNullOrWhiteSpace($Value) -or $Value -notmatch '^[A-Za-z0-9_]+$') {
        throw "$Name must contain only letters, numbers, and underscores."
    }
}

function Invoke-ComposeDb([string]$Command, [string[]]$InputLines = @()) {
    $args = @('--env-file', $envPath, '-f', $composePath, 'exec', '-T', 'db', 'sh', '-lc', $Command)
    if ($InputLines.Count -gt 0) {
        $InputLines -join [Environment]::NewLine | & docker compose @args
    } else {
        & docker compose @args
    }
    if ($LASTEXITCODE -ne 0) { throw "Docker Compose database command failed with exit code $LASTEXITCODE." }
}

function Invoke-ComposeQuery([string]$TargetDatabase, [string]$Sql) {
    Assert-Identifier $TargetDatabase 'Database'
    $command = 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" --batch --skip-column-names --database=' + $TargetDatabase + ' -e ''' + $Sql + ''''
    $result = Invoke-ComposeDb $command
    return (($result | Select-Object -Last 1).ToString().Trim())
}

$composePath = [IO.Path]::GetFullPath($ComposeFile)
$envPath = [IO.Path]::GetFullPath($EnvFile)
if (-not (Test-Path -LiteralPath $composePath -PathType Leaf)) { throw "Compose file '$composePath' was not found." }
if (-not (Test-Path -LiteralPath $envPath -PathType Leaf)) { throw "Environment file '$envPath' was not found." }
Assert-Identifier $Database 'Database'

$tempDatabase = "${Database}_restore_verify_$([guid]::NewGuid().ToString('N').Substring(0, 12))"
$backupWasProvided = -not [string]::IsNullOrWhiteSpace($OutputPath)
if ($backupWasProvided) {
    $backupPath = [IO.Path]::GetFullPath($OutputPath)
    $backupParent = Split-Path -Parent $backupPath
    New-Item -ItemType Directory -Force -Path $backupParent | Out-Null
} else {
    $backupPath = Join-Path ([IO.Path]::GetTempPath()) "rewind-$([guid]::NewGuid().ToString('N')).sql"
}

$tempCreated = $false
try {
    $baseline = Invoke-ComposeQuery $Database 'SELECT CONCAT((SELECT COUNT(*) FROM movies), CHAR(124), (SELECT COUNT(*) FROM users), CHAR(124), (SELECT COUNT(*) FROM flyway_schema_history));'
    if ([string]::IsNullOrWhiteSpace($baseline)) { throw 'Could not read baseline row counts.' }

    $dumpCommand = 'exec mysqldump --single-transaction --no-tablespaces --routines --events --triggers --hex-blob -uroot -p"$MYSQL_ROOT_PASSWORD" ' + $Database
    Invoke-ComposeDb $dumpCommand | Set-Content -LiteralPath $backupPath -Encoding utf8
    if ($LASTEXITCODE -ne 0) { throw "mysqldump failed with exit code $LASTEXITCODE." }
    if (-not (Test-Path -LiteralPath $backupPath -PathType Leaf) -or (Get-Item -LiteralPath $backupPath).Length -lt 100) {
        throw 'Backup is unexpectedly small.'
    }

    $createCommand = 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" --batch --skip-column-names -e ''CREATE DATABASE ' + $tempDatabase + ';'''
    Invoke-ComposeDb $createCommand | Out-Null
    $tempCreated = $true

    $restoreCommand = 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" --database=' + $tempDatabase
    Get-Content -LiteralPath $backupPath -Raw | & docker compose --env-file $envPath -f $composePath exec -T db sh -lc $restoreCommand
    if ($LASTEXITCODE -ne 0) { throw "mysql restore failed with exit code $LASTEXITCODE." }

    $restored = Invoke-ComposeQuery $tempDatabase 'SELECT CONCAT((SELECT COUNT(*) FROM movies), CHAR(124), (SELECT COUNT(*) FROM users), CHAR(124), (SELECT COUNT(*) FROM flyway_schema_history));'
    if ($baseline -ne $restored) { throw "Backup restore row counts differ: baseline=$baseline restored=$restored" }

    Write-Output 'Backup/restore verification passed'
    Write-Output "database=$Database temporaryDatabase=$tempDatabase counts=$restored backup=$backupPath"
}
finally {
    if ($tempCreated) {
        try {
            $dropCommand = 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" --batch --skip-column-names -e ''DROP DATABASE IF EXISTS ' + $tempDatabase + ';'''
            Invoke-ComposeDb $dropCommand | Out-Null
        } catch {
            Write-Warning "Could not remove temporary database '$tempDatabase': $($_.Exception.Message)"
        }
    }
    if (-not $KeepBackup -and -not $backupWasProvided -and (Test-Path -LiteralPath $backupPath)) {
        Remove-Item -LiteralPath $backupPath -Force
    }
}
