param(
    [string]$BaseUrl = "http://127.0.0.1:8081",
    [int]$Requests = 20,
    [int]$MaxSeconds = 10
)

$ErrorActionPreference = "Stop"
if ($Requests -lt 1 -or $Requests -gt 200) { throw "Requests must be between 1 and 200." }

# Windows PowerShell 5.1 does not load System.Net.Http automatically.
Add-Type -AssemblyName System.Net.Http
$client = [System.Net.Http.HttpClient]::new()
$client.Timeout = [TimeSpan]::FromSeconds($MaxSeconds)
$endpoints = @(
    "$BaseUrl/api/movies?size=12",
    "$BaseUrl/api/movies/50/details",
    "$BaseUrl/api/movies/search?q=the&sort=newest&page=0&size=12",
    "$BaseUrl/api/genres",
    "$BaseUrl/api/lists/public?page=0&size=12",
    "$BaseUrl/api/journal/articles?language=uk&size=20",
    "$BaseUrl/api/journal/articles/archive?language=uk",
    "$BaseUrl/actuator/health"
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

    $distribution = $statuses | Group-Object | Sort-Object Name | ForEach-Object { "$($_.Name)=$($_.Count)" }
    Write-Output "Load smoke passed"
    Write-Output "requests=$Requests endpoints=$($endpoints.Count) elapsedSeconds=$([math]::Round($stopwatch.Elapsed.TotalSeconds, 2)) status=$($distribution -join ',')"
}
finally {
    $client.Dispose()
    $tasks | ForEach-Object { if ($_.Result) { $_.Result.Dispose() } }
}
