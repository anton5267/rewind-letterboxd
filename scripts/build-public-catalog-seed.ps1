param(
  [Parameter(Mandatory = $true)]
  [string]$CatalogJson,
  [Parameter(Mandatory = $true)]
  [string]$OutputPath
)

$ErrorActionPreference = 'Stop'
$catalog = @(Get-Content -LiteralPath $CatalogJson -Raw | ConvertFrom-Json)
if ($catalog.Count -eq 0) { throw 'The catalog export is empty.' }
if (@($catalog | Where-Object { $null -ne $_.myFlags }).Count -gt 0) {
  throw 'The export contains personalized movie flags; refusing to seed it.'
}

function ConvertTo-SqlLiteral($value) {
  if ($null -eq $value) { return 'NULL' }
  if ($value -is [bool]) { return $(if ($value) { 'TRUE' } else { 'FALSE' }) }
  if ($value -is [datetime]) {
    $utc = $value.ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss.ffffff'Z'", [System.Globalization.CultureInfo]::InvariantCulture)
    return "'$utc'"
  }
  if ($value -is [string]) { return "'$(($value -replace "'", "''"))'" }
  if ($value -is [System.IFormattable]) {
    return $value.ToString($null, [System.Globalization.CultureInfo]::InvariantCulture)
  }
  throw "Unsupported SQL value type: $($value.GetType().FullName)"
}

$movieIds = @($catalog | ForEach-Object id | Sort-Object -Unique)
if ($movieIds.Count -ne $catalog.Count) { throw 'The export contains duplicate movie IDs.' }

$actors = @{}
$directors = @{}
$movieActorRows = [System.Collections.Generic.List[string]]::new()
$movieDirectorRows = [System.Collections.Generic.List[string]]::new()
$ratingRows = [System.Collections.Generic.List[string]]::new()
$similarRows = [System.Collections.Generic.List[string]]::new()
$similarKeys = [System.Collections.Generic.HashSet[string]]::new()

$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('-- Public movie metadata from the unauthenticated local movie-details API.')
$lines.Add('-- No accounts, user flags, reviews, lists, messages, or other user data are included.')
$lines.Add('BEGIN;')
$lines.Add('INSERT INTO rewind.movies (id, imdb_id, tmdb_id, title, duration_minutes, release_date, age_rating, rating, short_plot, photo_url, backdrop_url, trailer_url) VALUES')

$movieRows = foreach ($movie in ($catalog | Sort-Object id)) {
  $values = @(
    $movie.id, $movie.imdbId, $movie.tmdbId, $movie.title, $movie.durationMinutes,
    $movie.releaseDate, $movie.ageRating, $movie.rating, $movie.shortPlot,
    $movie.photoUrl, $movie.backdropUrl, $movie.trailerUrl
  ) | ForEach-Object { ConvertTo-SqlLiteral $_ }
  '(' + ($values -join ', ') + ')'

  foreach ($person in $movie.actors) {
    if ($actors.ContainsKey([string]$person.id)) {
      $known = $actors[[string]$person.id]
      if ($known.name -ne $person.name -or $known.tmdbId -ne $person.tmdbId) {
        throw "Actor ID $($person.id) has conflicting public metadata."
      }
    } else {
      $actors[[string]$person.id] = $person
    }
    $movieActorRows.Add(('({0}, {1}, {2}, {3})' -f $movie.id, $person.id,
      (ConvertTo-SqlLiteral $person.characterName), (ConvertTo-SqlLiteral $person.castOrder)))
  }
  foreach ($person in $movie.directors) {
    if ($directors.ContainsKey([string]$person.id)) {
      $known = $directors[[string]$person.id]
      if ($known.name -ne $person.name -or $known.tmdbId -ne $person.tmdbId) {
        throw "Director ID $($person.id) has conflicting public metadata."
      }
    } else {
      $directors[[string]$person.id] = $person
    }
    $movieDirectorRows.Add(('({0}, {1})' -f $movie.id, $person.id))
  }
  foreach ($rating in $movie.externalRatings) {
    $ratingRows.Add(('({0}, {1}, {2}, {3}, {4})' -f $movie.id,
      (ConvertTo-SqlLiteral $rating.source), (ConvertTo-SqlLiteral $rating.rating),
      (ConvertTo-SqlLiteral $rating.votesCount), (ConvertTo-SqlLiteral $rating.lastUpdatedAt)))
  }
  foreach ($similar in $movie.similarMovies) {
    if ($movie.id -eq $similar.id) { throw "Movie $($movie.id) lists itself as similar." }
    if ($similar.id -notin $movieIds) { continue }
    $key = "$($movie.id):$($similar.id)"
    if ($similarKeys.Add($key)) { $similarRows.Add("($($movie.id), $($similar.id))") }
  }
}

$lines.Add(($movieRows -join ",`n") + @'
ON CONFLICT (id) DO UPDATE SET
  imdb_id = EXCLUDED.imdb_id,
  tmdb_id = EXCLUDED.tmdb_id,
  title = EXCLUDED.title,
  duration_minutes = EXCLUDED.duration_minutes,
  release_date = EXCLUDED.release_date,
  age_rating = EXCLUDED.age_rating,
  rating = EXCLUDED.rating,
  short_plot = EXCLUDED.short_plot,
  photo_url = EXCLUDED.photo_url,
  backdrop_url = EXCLUDED.backdrop_url,
  trailer_url = EXCLUDED.trailer_url;
'@)

foreach ($entry in @(@{ Table = 'actors'; Items = $actors.Values }, @{ Table = 'directors'; Items = $directors.Values })) {
  $items = @($entry.Items | Sort-Object id)
  if ($items.Count -eq 0) { continue }
  $rows = foreach ($item in $items) {
    '({0}, {1}, {2}, {3})' -f $item.id, (ConvertTo-SqlLiteral $item.name),
      (ConvertTo-SqlLiteral $item.tmdbId), (ConvertTo-SqlLiteral $item.photoUrl)
  }
  $lines.Add("INSERT INTO rewind.$($entry.Table) (id, name, tmdb_id, photo_url) VALUES`n$($rows -join ",`n")`nON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, tmdb_id = EXCLUDED.tmdb_id, photo_url = EXCLUDED.photo_url;")
}

foreach ($relation in @(
  @{ Table = 'movie_actors'; Columns = 'movie_id, actor_id, character_name, cast_order'; Rows = $movieActorRows },
  @{ Table = 'movie_directors'; Columns = 'movie_id, director_id'; Rows = $movieDirectorRows }
)) {
  if ($relation.Rows.Count -eq 0) { continue }
  $lines.Add("INSERT INTO rewind.$($relation.Table) ($($relation.Columns)) VALUES`n$($relation.Rows -join ",`n")`nON CONFLICT DO NOTHING;")
}

if ($ratingRows.Count -gt 0) {
  $lines.Add("INSERT INTO rewind.external_ratings (movie_id, source, rating, votes_count, last_updated_at) VALUES`n$($ratingRows -join ",`n")`nON CONFLICT (movie_id, source) DO UPDATE SET rating = EXCLUDED.rating, votes_count = EXCLUDED.votes_count, last_updated_at = EXCLUDED.last_updated_at;")
}
if ($similarRows.Count -gt 0) {
  $lines.Add("INSERT INTO rewind.similar_movies (movie_id, similar_movie_id) VALUES`n$($similarRows -join ",`n")`nON CONFLICT DO NOTHING;")
}

$lines.Add("SELECT setval(pg_get_serial_sequence('rewind.actors', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM rewind.actors;")
$lines.Add("SELECT setval(pg_get_serial_sequence('rewind.directors', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM rewind.directors;")
$lines.Add('COMMIT;')
Set-Content -LiteralPath $OutputPath -Value ($lines -join "`n") -Encoding utf8
"Wrote $OutputPath; movies=$($catalog.Count), actors=$($actors.Count), movie_actor_links=$($movieActorRows.Count), directors=$($directors.Count), movie_director_links=$($movieDirectorRows.Count), ratings=$($ratingRows.Count), similar_links=$($similarRows.Count)."
