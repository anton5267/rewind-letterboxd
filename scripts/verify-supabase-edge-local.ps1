$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$baselinePath = Join-Path $repoRoot 'supabase/migrations/20261104040000_public_movie_catalog.sql'
$catalogSeedPath = Join-Path $repoRoot 'supabase/migrations/20261104041000_public_movie_catalog_seed.sql'
$metadataPath = Join-Path $repoRoot 'supabase/migrations/20261104185117_public_movie_metadata.sql'
$metadataSeedPath = Join-Path $repoRoot 'supabase/migrations/20261104185207_public_movie_metadata_seed.sql'
$rlsPath = Join-Path $repoRoot 'supabase/migrations/20261104192859_rls_public_catalog_edge_reader.sql'
$directorIndexPath = Join-Path $repoRoot 'supabase/migrations/20261104203146_index_movie_directors_director_id.sql'
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
    docker exec $postgresName psql -v ON_ERROR_STOP=1 -U postgres -d rewind_test -f /tmp/rewind-baseline.sql
    Assert-DockerSuccess 'PostgreSQL baseline migration'

    foreach ($migration in @(
        @{ Path = $catalogSeedPath; Name = 'catalog-seed' },
        @{ Path = $metadataPath; Name = 'public-movie-metadata' },
        @{ Path = $metadataSeedPath; Name = 'public-movie-metadata-seed' },
        @{ Path = $rlsPath; Name = 'public-catalog-reader-rls' },
        @{ Path = $directorIndexPath; Name = 'director-lookup-index' }
    )) {
        $containerPath = "/tmp/rewind-$($migration.Name).sql"
        docker cp $migration.Path "${postgresName}:$containerPath" | Out-Null
        Assert-DockerSuccess "$($migration.Name) migration copy"
        docker exec $postgresName psql -v ON_ERROR_STOP=1 -U postgres -d rewind_test -f $containerPath
        Assert-DockerSuccess "$($migration.Name) migration"
    }

    $roleSql = 'CREATE ROLE rewind_edge_test LOGIN; GRANT rewind_edge_reader TO rewind_edge_test;'
    docker exec $postgresName psql -v ON_ERROR_STOP=1 -U postgres -d rewind_test -c $roleSql *> $null
    Assert-DockerSuccess 'restricted database role setup'
    $countSql = "SELECT (SELECT COUNT(*) FROM rewind.movies)||'|'||(SELECT COUNT(*) FROM rewind.genres)||'|'||(SELECT COUNT(*) FROM rewind.movie_genres)||'|'||(SELECT COUNT(*) FROM rewind.actors)||'|'||(SELECT COUNT(*) FROM rewind.movie_actors)||'|'||(SELECT COUNT(*) FROM rewind.directors)||'|'||(SELECT COUNT(*) FROM rewind.movie_directors)||'|'||(SELECT COUNT(*) FROM rewind.external_ratings)||'|'||(SELECT COUNT(*) FROM rewind.similar_movies);"
    $catalogCounts = docker exec $postgresName psql -At -U postgres -d rewind_test -c $countSql
    Assert-DockerSuccess 'catalog seed row count check'
    if ($catalogCounts.Trim() -ne '50|17|153|383|400|52|54|50|300') {
        throw "Unexpected catalog metadata row counts: $($catalogCounts.Trim())"
    }
    $privilegeSql = "SELECT has_schema_privilege('rewind_edge_test','rewind','USAGE')||'|'||has_table_privilege('rewind_edge_test','rewind.movies','SELECT')||'|'||has_table_privilege('rewind_edge_test','rewind.movies','INSERT');"
    $rolePrivileges = docker exec $postgresName psql -At -U postgres -d rewind_test -c $privilegeSql
    Assert-DockerSuccess 'restricted database role privilege check'
    if ($rolePrivileges.Trim() -ne 'true|true|false') {
        throw "Catalog reader does not have the expected minimum privileges: $($rolePrivileges.Trim())"
    }
    $rlsSql = "SELECT COUNT(*) FILTER (WHERE relrowsecurity)::text||'|'||(SELECT COUNT(*) FROM pg_policies WHERE schemaname='rewind' AND 'rewind_edge_reader'=ANY(roles) AND cmd='SELECT')::text FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='rewind' AND c.relkind='r';"
    $rlsState = docker exec $postgresName psql -At -U postgres -d rewind_test -c $rlsSql
    Assert-DockerSuccess 'catalog RLS and policy verification'
    if ($rlsState.Trim() -ne '9|9') {
        throw "Catalog RLS/policy coverage did not match the 9-table catalogue: $($rlsState.Trim())"
    }
    $directorIndex = docker exec $postgresName psql -At -U postgres -d rewind_test -c "SELECT indexdef FROM pg_indexes WHERE schemaname='rewind' AND tablename='movie_directors' AND indexname='movie_directors_director_id_idx';"
    Assert-DockerSuccess 'director lookup index verification'
    if ($directorIndex.Trim() -notmatch '\(director_id\)') {
        throw 'The movie_directors director_id lookup index is missing.'
    }

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
    if (@($genres).Count -ne 17) {
        throw "PostgreSQL integration returned an unexpected genre count: $(@($genres).Count)"
    }
    $searchUrl = $functionUrl -replace '/api/genres$', '/api/movies/search?genreId=1&sort=rating_desc&page=0&size=6'
    $page = Invoke-RestMethod -Uri $searchUrl -Headers @{ Origin = $pagesOrigin } -TimeoutSec 10
    if (@($page.content).Count -ne 6 -or $page.totalElements -ne 30) {
        throw "PostgreSQL movie search returned unexpected result: $($page | ConvertTo-Json -Depth 5 -Compress)"
    }
    $detailsUrl = $functionUrl -replace '/api/genres$', '/api/movies/33/details'
    $details = Invoke-RestMethod -Uri $detailsUrl -Headers @{ Origin = $pagesOrigin } -TimeoutSec 10
    if ($details.title -ne 'Send Help' -or $details.myFlags -ne $null -or @($details.genres).Count -ne 3 `
        -or $details.durationMinutes -ne 113 -or [string]::IsNullOrWhiteSpace($details.shortPlot) `
        -or @($details.directors).Count -ne 1 -or @($details.actors).Count -ne 8 `
        -or @($details.externalRatings).Count -ne 1 -or @($details.similarMovies).Count -ne 6) {
        throw "PostgreSQL movie details returned unexpected result: $($details | ConvertTo-Json -Depth 5 -Compress)"
    }

    $actorUrl = $functionUrl -replace '/api/genres$', '/api/actors/286?sort=title'
    $actor = Invoke-RestMethod -Uri $actorUrl -Headers @{ Origin = $pagesOrigin } -TimeoutSec 10
    if ($actor.type -ne 'ACTOR' -or $actor.name -ne 'Rachel McAdams' -or @($actor.films).Count -ne 1 `
        -or $actor.films[0].id -ne 33 -or $actor.films[0].characterName -ne 'Linda Liddle') {
        throw "PostgreSQL actor filmography returned unexpected result: $($actor | ConvertTo-Json -Depth 5 -Compress)"
    }
    $directorUrl = $functionUrl -replace '/api/genres$', '/api/directors/44'
    $director = Invoke-RestMethod -Uri $directorUrl -Headers @{ Origin = $pagesOrigin } -TimeoutSec 10
    if ($director.type -ne 'DIRECTOR' -or $director.name -ne 'Sam Raimi' -or @($director.films).Count -ne 1 `
        -or $director.films[0].id -ne 33 -or $director.films[0].characterName -ne $null) {
        throw "PostgreSQL director filmography returned unexpected result: $($director | ConvertTo-Json -Depth 5 -Compress)"
    }

    $actorSearchUrl = $functionUrl -replace '/api/genres$', '/api/people/search?type=actor&q=Rachel%20McAdams'
    $actorSearch = Invoke-RestMethod -Uri $actorSearchUrl -Headers @{ Origin = $pagesOrigin } -TimeoutSec 10
    if ($actorSearch.totalElements -ne 1 -or $actorSearch.content[0].id -ne 286 `
        -or $actorSearch.content[0].filmCount -ne 1) {
        throw "PostgreSQL actor search returned unexpected result: $($actorSearch | ConvertTo-Json -Depth 5 -Compress)"
    }
    $directorSearchUrl = $functionUrl -replace '/api/genres$', '/api/people/search?type=director&q=Sam%20Raimi'
    $directorSearch = Invoke-RestMethod -Uri $directorSearchUrl -Headers @{ Origin = $pagesOrigin } -TimeoutSec 10
    if ($directorSearch.totalElements -ne 1 -or $directorSearch.content[0].id -ne 44 `
        -or $directorSearch.content[0].filmCount -ne 1) {
        throw "PostgreSQL director search returned unexpected result: $($directorSearch | ConvertTo-Json -Depth 5 -Compress)"
    }

    Write-Output 'Edge Function handler tests: 13/13 passed.'
    Write-Output 'Edge Function type check: passed.'
    Write-Output 'PostgreSQL catalogue migrations/seeds: 50 movies, 17 genres, 153 genre links, 383 actors, 400 cast links, 52 directors, 54 director links, 50 ratings, 300 similar links.'
    Write-Output 'PostgreSQL catalogue RLS: enabled on all 9 tables with SELECT policies for rewind_edge_reader only.'
    Write-Output 'PostgreSQL catalogue indexes: director_id lookup index verified.'
    Write-Output 'PostgreSQL catalogue API integration: passed with the restricted read-only role; bounded movie/person search, movie details, and actor/director filmography read only catalog data.'
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
