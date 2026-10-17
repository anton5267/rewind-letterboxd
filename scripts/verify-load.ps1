param(
    [string]$BaseUrl = "http://127.0.0.1:8081",
    [int]$Requests = 20,
    [int]$MaxSeconds = 10
)

$ErrorActionPreference = "Stop"
if ($Requests -lt 1 -or $Requests -gt 200) { throw "Requests must be between 1 and 200." }

$client = [System.Net.Http.HttpClient]::new()
$client.Timeout = [TimeSpan]::FromSeconds($MaxSeconds)
$endpoints = @(
    "$BaseUrl/api/movies?size=12",
    "$BaseUrl/api/movies/50/details"
)
$tasks = @()
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
try {
    for ($i = 0; $i -lt $Requests; $i++) {
        $tasks += $client.GetAsync($endpoints[$i % $endpoints.Count])
    }
    [System.Threading.Tasks.Task]::WaitAll([System.Threading.Tasks.Task[]]$tasks)
    $stopwatch.Stop()

    $statuses = @($tasks | ForEach-Object { $_.Result.StatusCode.value__ })
    $failed = @($statuses | Where-Object { $_ -lt 200 -or $_ -ge 300 })
    if ($failed.Count -gt 0) {
        throw "Load smoke returned non-2xx statuses: $($failed -join ', ')"
    }
    if ($stopwatch.Elapsed.TotalSeconds -gt $MaxSeconds) {
        throw "Load smoke exceeded ${MaxSeconds}s: $([math]::Round($stopwatch.Elapsed.TotalSeconds, 2))s"
    }

    Write-Output "Load smoke passed"
    Write-Output "requests=$Requests elapsedSeconds=$([math]::Round($stopwatch.Elapsed.TotalSeconds, 2)) status=2xx"
}
finally {
    $client.Dispose()
    $tasks | ForEach-Object { if ($_.Result) { $_.Result.Dispose() } }
}
