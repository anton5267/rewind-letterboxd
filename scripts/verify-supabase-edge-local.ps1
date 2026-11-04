$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$baselinePath = Join-Path $repoRoot 'supabase/migrations/20261104040000_public_movie_catalog.sql'
$functionPath = Join-Path $repoRoot 'supabase/functions/rewind-api'
$runId = [Guid]::NewGuid().ToString('N').Substring(0, 8)
$networkName = "rewind-edge-test-$runId"
$postgresName = "rewind-edge-postgres-$runId"
$functionName = "rewind-edge-function-$runId"
$denoImage = 'denoland/deno:alpine'
$postgresImage = 'postgres:17-alpine'
$pagesOrigin = 'https://anton5267.github.io'
$createdNetwork = $false
$startedPostgres = $false
$startedFunction = $false

function Assert-DockerSuccess([string]$step) {
    if ($LASTEXITCODE -ne 0) {
        throw "Docker failed during $step (exit code $LASTEXITCODE)."
    }
}

try {
    docker network create $networkName | Out-Null
    Assert-DockerSuccess 'network creation'
    $createdNetwork = $true

    docker run -d --rm --name $postgresName --network $networkName `
        --tmpfs /var/lib/postgresql/data:rw,size=1g `
        -e POSTGRES_DB=rewind_test `
        -e POSTGRES_PASSWORD=local_edge_test_only `
        -e POSTGRES_HOST_AUTH_METHOD=trust `
        $postgresImage | Out-Null
    Assert-DockerSuccess 'temporary PostgreSQL start'
    $startedPostgres = $true

    $postgresReady = $false
    for ($attempt = 0; $attempt -lt 45; $attempt++) {
        docker exec $postgresName pg_isready -U postgres -d rewind_test *> $null
        if ($LASTEXITCODE -eq 0) {
            $postgresReady = $true
            break
        }
        Start-Sleep -Seconds 1
    }
    if (-not $postgresReady) {
        throw 'Temporary PostgreSQL did not become ready.'
    }

    docker cp $baselinePath "${postgresName}:/tmp/rewind-baseline.sql" | Out-Null
    Assert-DockerSuccess 'PostgreSQL baseline copy'
    docker exec $postgresName psql -v ON_ERROR_STOP=1 -U postgres -d rewind_test -f /tmp/rewind-baseline.sql *> $null
    Assert-DockerSuccess 'PostgreSQL baseline migration'

    $roleSql = 'CREATE ROLE rewind_edge_test LOGIN; GRANT rewind_edge_reader TO rewind_edge_test;'
    docker exec $postgresName psql -v ON_ERROR_STOP=1 -U postgres -d rewind_test -c $roleSql *> $null
    Assert-DockerSuccess 'restricted database role setup'
    docker exec $postgresName psql -v ON_ERROR_STOP=1 -U postgres -d rewind_test `
        -c "INSERT INTO rewind.genres (name) VALUES ('Comedy'), ('Drama');" *> $null
    Assert-DockerSuccess 'temporary genre fixture setup'
    docker exec $postgresName psql -v ON_ERROR_STOP=1 -U postgres -d rewind_test `
        -c "INSERT INTO rewind.movies (id, title, release_date, rating, photo_url) VALUES (101, 'Comedy Film', '2024-01-10', 4.5, 'https://example.invalid/poster.jpg'), (102, 'Drama Film', '2023-01-10', 3.9, NULL); INSERT INTO rewind.movie_genres (movie_id, genre_id) SELECT 101, id FROM rewind.genres WHERE name = 'Comedy';" *> $null
    Assert-DockerSuccess 'temporary movie fixture setup'

    docker run --rm --mount "type=bind,source=$functionPath,target=/app" -w /app `
        $denoImage deno test --frozen-lockfile handler_test.ts
    Assert-DockerSuccess 'Edge Function handler tests'
    docker run --rm --mount "type=bind,source=$functionPath,target=/app" -w /app `
        $denoImage deno check --frozen-lockfile index.ts
    Assert-DockerSuccess 'Edge Function type check'

    docker run -d --rm --name $functionName --network $networkName `
        -p 127.0.0.1::8000 `
        --mount "type=bind,source=$functionPath,target=/app" -w /app `
        -e "SUPABASE_DB_URL=postgres://rewind_edge_test@${postgresName}:5432/rewind_test" `
        -e "REWIND_ALLOWED_ORIGINS=$pagesOrigin" `
        $denoImage deno run --frozen-lockfile --allow-net --allow-env=SUPABASE_DB_URL,REWIND_ALLOWED_ORIGINS index.ts | Out-Null
    Assert-DockerSuccess 'local Edge Function start'
    $startedFunction = $true

    $portMapping = docker port $functionName 8000/tcp
    Assert-DockerSuccess 'local Edge Function port lookup'
    if ($portMapping -notmatch '127\.0\.0\.1:(\d+)') {
        throw 'Could not determine the temporary Edge Function port.'
    }
    $functionUrl = "http://127.0.0.1:$($Matches[1])/functions/v1/rewind-api/api/genres"

    $genres = $null
    for ($attempt = 0; $attempt -lt 45; $attempt++) {
        try {
            $genres = Invoke-RestMethod -Uri $functionUrl -Headers @{ Origin = $pagesOrigin } -TimeoutSec 5
            break
        } catch {
            if ($attempt -eq 44) { throw }
            Start-Sleep -Seconds 1
        }
    }

    $actualNames = @($genres | ForEach-Object { $_.name }) -join ','
    if ($actualNames -ne 'Comedy,Drama') {
        throw "PostgreSQL integration returned unexpected genres: $actualNames"
    }
    if (@($genres).Count -ne 2) {
        throw "PostgreSQL integration returned an unexpected row count: $(@($genres).Count)"
    }

    $searchUrl = "http://127.0.0.1:$($Matches[1])/functions/v1/rewind-api/api/movies/search?genreId=1&sort=rating_desc&page=0&size=6"
    $searchUrl = $functionUrl -replace '/api/genres$', '/api/movies/search?genreId=1&sort=rating_desc&page=0&size=6'
    $page = Invoke-RestMethod -Uri $searchUrl -Headers @{ Origin = $pagesOrigin } -TimeoutSec 10
    if (@($page.content).Count -ne 1 -or $page.content[0].title -ne 'Comedy Film' -or $page.content[0].rating -ne 4.5) {
        throw "PostgreSQL movie search returned unexpected result: $($page | ConvertTo-Json -Depth 5 -Compress)"
    }
    $detailsUrl = $functionUrl -replace '/api/genres$', '/api/movies/101/details'
    $details = Invoke-RestMethod -Uri $detailsUrl -Headers @{ Origin = $pagesOrigin } -TimeoutSec 10
    if ($details.title -ne 'Comedy Film' -or $details.myFlags -ne $null -or @($details.genres).Count -ne 1 -or $details.genres[0].name -ne 'Comedy') {
        throw "PostgreSQL movie details returned unexpected result: $($details | ConvertTo-Json -Depth 5 -Compress)"
    }

    Write-Output 'Edge Function handler tests: 8/8 passed.'
    Write-Output 'Edge Function type check: passed.'
    Write-Output 'PostgreSQL catalogue API integration: passed with the restricted read-only role.'
} finally {
    if ($startedFunction) {
        docker rm -f $functionName *> $null
    }
    if ($startedPostgres) {
        docker rm -f $postgresName *> $null
    }
    if ($createdNetwork) {
        docker network rm $networkName *> $null
    }
}
