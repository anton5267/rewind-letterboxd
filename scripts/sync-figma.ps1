[CmdletBinding()]
param(
    [string]$FileKey = 'orb73jiLJnIsZNCRtJsWgS',
    [string]$NodeId = '202:729',
    [string]$OutputDirectory = '',
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
    $OutputDirectory = Join-Path (Split-Path -Parent $PSScriptRoot) 'figma'
}

$outputPath = [IO.Path]::GetFullPath($OutputDirectory)
$designPath = Join-Path $outputPath 'design.json'
$selectedNodePath = Join-Path $outputPath 'selected-node.json'
$selectedImagePath = Join-Path $outputPath 'selected-node.png'

if (-not $Force) {
    $existing = @($designPath, $selectedNodePath, $selectedImagePath) |
        Where-Object { Test-Path -LiteralPath $_ -PathType Leaf }
    if ($existing.Count -gt 0) {
        throw "Snapshot files already exist in '$outputPath'. Re-run with -Force to refresh the local snapshot."
    }
}

function Find-FigmaNode {
    param(
        [AllowNull()][object]$Node,
        [Parameter(Mandatory = $true)][string]$WantedId
    )

    if ($null -eq $Node) { return $null }
    if ([string]$Node.id -eq $WantedId) { return $Node }

    foreach ($child in @($Node.children)) {
        $match = Find-FigmaNode -Node $child -WantedId $WantedId
        if ($null -ne $match) { return $match }
    }

    return $null
}

$secureToken = Read-Host 'Figma personal access token (input is hidden)' -AsSecureString
$token = [System.Net.NetworkCredential]::new('', $secureToken).Password
if ([string]::IsNullOrWhiteSpace($token)) {
    throw 'A non-empty Figma token is required.'
}

$headers = @{ 'X-Figma-Token' = $token }
$apiRoot = 'https://api.figma.com/v1'
$fileUri = "$apiRoot/files/$FileKey"
$encodedNodeId = [Uri]::EscapeDataString($NodeId)
$imageUri = "$apiRoot/images/$FileKey?ids=$encodedNodeId&format=png&scale=1"

try {
    $design = Invoke-RestMethod -Method Get -Uri $fileUri -Headers $headers
    $selectedNode = Find-FigmaNode -Node $design.document -WantedId $NodeId
    if ($null -eq $selectedNode) {
        throw "Node '$NodeId' was not found in Figma file '$FileKey'."
    }

    New-Item -ItemType Directory -Force -Path $outputPath | Out-Null
    $design | ConvertTo-Json -Depth 100 | Set-Content -LiteralPath $designPath -Encoding utf8
    $selectedNode | ConvertTo-Json -Depth 100 | Set-Content -LiteralPath $selectedNodePath -Encoding utf8

    $imageResult = Invoke-RestMethod -Method Get -Uri $imageUri -Headers $headers
    $imageProperty = $imageResult.images.PSObject.Properties[$NodeId]
    if ($null -eq $imageProperty -or [string]::IsNullOrWhiteSpace([string]$imageProperty.Value)) {
        throw "Figma returned no PNG URL for node '$NodeId'."
    }

    Invoke-WebRequest -Method Get -Uri ([string]$imageProperty.Value) -OutFile $selectedImagePath -UseBasicParsing
    Write-Output "Figma snapshot saved to '$outputPath' (file '$FileKey', node '$NodeId')."
}
finally {
    $token = $null
    $secureToken = $null
    $headers = $null
}
