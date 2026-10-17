param(
    [string]$BaseUrl = "http://127.0.0.1:8081",
    [long]$MovieId = 0
)

$ErrorActionPreference = "Stop"

function Invoke-RedisCli {
    param([Parameter(Mandatory = $true)][string[]]$Arguments)
    $output = & docker compose exec -T redis redis-cli @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "redis-cli failed: $($Arguments -join ' ')"
    }
    return ($output -join "`n").Trim()
}

function Get-RedisStat {
    param([Parameter(Mandatory = $true)][string]$Name)
    $stats = Invoke-RedisCli -Arguments @("INFO", "stats")
    $line = ($stats -split "`n" |
        Where-Object { $_ -like "${Name}:*" } | Select-Object -First 1)
    if (-not $line) { throw "Redis stat '$Name' was not found" }
    return [long](($line -split ":", 2)[1])
}

$moviesResponse = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/movies?page=0&size=1"
$movies = $moviesResponse.Content | ConvertFrom-Json
if ($MovieId -le 0) {
    $MovieId = [long]$movies.content[0].id
}
if ($MovieId -le 0) { throw "No movie id was available for cache verification" }

$cacheKey = "movieDetails::$MovieId"
[void](Invoke-RedisCli -Arguments @("DEL", $cacheKey))

$missesBefore = Get-RedisStat -Name "keyspace_misses"
$hitsBefore = Get-RedisStat -Name "keyspace_hits"
$first = Invoke-WebRequest -UseBasicParsing -SkipHttpErrorCheck -Uri "$BaseUrl/api/movies/$MovieId/details"
$missesAfterFirst = Get-RedisStat -Name "keyspace_misses"
$firstKeyExists = [int](Invoke-RedisCli -Arguments @("EXISTS", $cacheKey))
$ttl = [int](Invoke-RedisCli -Arguments @("TTL", $cacheKey))

$second = Invoke-WebRequest -UseBasicParsing -SkipHttpErrorCheck -Uri "$BaseUrl/api/movies/$MovieId/details"
$hitsAfterSecond = Get-RedisStat -Name "keyspace_hits"

if ($first.StatusCode -ne 200 -or $second.StatusCode -ne 200) {
    throw "Movie details did not return HTTP 200 (first=$($first.StatusCode), second=$($second.StatusCode))"
}
if ($firstKeyExists -ne 1 -or $ttl -le 0) {
    throw "Redis cache key '$cacheKey' was not stored with a positive TTL (exists=$firstKeyExists, ttl=$ttl)"
}
if (($missesAfterFirst - $missesBefore) -lt 1) {
    throw "The first request did not produce a Redis cache miss"
}
if (($hitsAfterSecond - $hitsBefore) -lt 1) {
    throw "The second request did not produce a Redis cache hit"
}

Write-Host "Redis cache verification passed"
Write-Host "movieId=$MovieId key=$cacheKey ttlSeconds=$ttl"
Write-Host "missDelta=$($missesAfterFirst - $missesBefore) hitDelta=$($hitsAfterSecond - $hitsBefore)"
