param(
    [string]$Caddyfile = 'Caddyfile.example',
    [string]$CaddyImage = 'caddy:2-alpine'
)

$ErrorActionPreference = 'Stop'

$caddyPath = [IO.Path]::GetFullPath($Caddyfile)
if (-not (Test-Path -LiteralPath $caddyPath -PathType Leaf)) {
    throw "Caddyfile '$caddyPath' was not found."
}

docker image inspect $CaddyImage *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Output "Pulling $CaddyImage for syntax validation..."
    docker pull $CaddyImage
    if ($LASTEXITCODE -ne 0) { throw "Unable to pull $CaddyImage" }
}

docker run --rm -v "${caddyPath}:/etc/caddy/Caddyfile:ro" $CaddyImage caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
if ($LASTEXITCODE -ne 0) { throw 'Caddyfile validation failed.' }

Write-Output "Caddyfile verified: $caddyPath"
