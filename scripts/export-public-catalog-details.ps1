param(
  [string]$ApiBaseUrl = 'http://localhost:8081/api',
  [string]$OutputPath = (Join-Path ([System.IO.Path]::GetTempPath()) 'rewind-public-catalog-details.json'),
  [ValidateRange(1, 50)]
  [int]$PageSize = 50
)

$ErrorActionPreference = 'Stop'
$api = $ApiBaseUrl.TrimEnd('/')
$first = Invoke-RestMethod -Uri "$api/movies/search?page=0&size=$PageSize&sort=newest" -TimeoutSec 20
$ids = [System.Collections.Generic.List[long]]::new()
foreach ($movie in $first.content) { $ids.Add([long]$movie.id) }
for ($page = 1; $page -lt $first.totalPages; $page++) {
  $result = Invoke-RestMethod -Uri "$api/movies/search?page=$page&size=$PageSize&sort=newest" -TimeoutSec 20
  foreach ($movie in $result.content) { $ids.Add([long]$movie.id) }
}
if ($ids.Count -ne $first.totalElements -or @($ids | Sort-Object -Unique).Count -ne $ids.Count) {
  throw 'The public catalog changed while its pages were being enumerated.'
}

$details = $ids | ForEach-Object -Parallel {
  $movieId = $_
  $endpoint = "$using:api/movies/$movieId/details"
  try {
    $item = Invoke-RestMethod -Uri $endpoint -TimeoutSec 30
    if ($null -ne $item.myFlags) { throw "Movie $movieId returned personalized flags." }
    [pscustomobject]@{
      id = $item.id
      imdbId = $item.imdbId
      tmdbId = $item.tmdbId
      title = $item.title
      durationMinutes = $item.durationMinutes
      releaseDate = $item.releaseDate
      ageRating = $item.ageRating
      rating = $item.rating
      shortPlot = $item.shortPlot
      photoUrl = $item.photoUrl
      backdropUrl = $item.backdropUrl
      trailerUrl = $item.trailerUrl
      genres = @($item.genres | ForEach-Object { [pscustomobject]@{ id = $_.id; name = $_.name } })
      directors = @($item.directors | ForEach-Object { [pscustomobject]@{ id = $_.id; name = $_.name; photoUrl = $_.photoUrl } })
      actors = @($item.actors | ForEach-Object { [pscustomobject]@{ id = $_.id; name = $_.name; photoUrl = $_.photoUrl; characterName = $_.characterName; castOrder = $_.castOrder } })
      externalRatings = @($item.externalRatings | ForEach-Object { [pscustomobject]@{ source = $_.source; rating = $_.rating; votesCount = $_.votesCount; lastUpdatedAt = $_.lastUpdatedAt } })
      similarMovies = @($item.similarMovies | ForEach-Object { [pscustomobject]@{ id = $_.id; title = $_.title; releaseDate = $_.releaseDate; rating = $_.rating; photoUrl = $_.photoUrl } })
      myFlags = $null
    }
  } catch {
    throw "Could not export public movie details for ID $movieId from $endpoint. $($_.Exception.Message)"
  }
} -ThrottleLimit 8

if (@($details).Count -ne $ids.Count) {
  throw "Expected $($ids.Count) detail rows, received $(@($details).Count)."
}
$details | Sort-Object id | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $OutputPath -Encoding utf8
"Exported $($details.Count) public movie detail rows to $OutputPath; user flags are null and all other fields were allow-listed."
