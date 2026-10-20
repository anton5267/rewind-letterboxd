# Compatibility entrypoint for the canonical workspace-level Figma exporter.
# The implementation lives in ../figma-codex-complete-export; keep one sync
# contract so this legacy path cannot drift from npm run figma:sync.
$ErrorActionPreference = 'Stop'
$canonicalScript = Join-Path (Split-Path -Parent $PSScriptRoot) '..\figma-codex-complete-export\run-sync.ps1'

if (-not (Test-Path -LiteralPath $canonicalScript -PathType Leaf)) {
    throw "Canonical Figma exporter was not found at '$canonicalScript'."
}

$powershell = (Get-Command powershell.exe -ErrorAction Stop).Source
& $powershell -NoProfile -ExecutionPolicy Bypass -File $canonicalScript @args
exit $LASTEXITCODE
