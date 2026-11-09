$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$migrationDir = Join-Path $repoRoot 'supabase/migrations'
$runId = [Guid]::NewGuid().ToString('N').Substring(0, 8)
$networkName = "rewind-review-test-$runId"
$postgresName = "rewind-review-postgres-$runId"
$authMockName = "rewind-review-auth-$runId"
$functionName = "rewind-review-edge-$runId"
$authMockPath = Join-Path $env:TEMP "rewind-review-auth-$runId.ts"
$postgresImage = 'postgres:17-alpine'
$denoImage = 'denoland/deno:alpine'
$pagesOrigin = 'https://anton5267.github.io'
$createdNetwork = $false
$startedPostgres = $false
$startedAuthMock = $false
$startedFunction = $false

function Assert-DockerSuccess([string]$step) {
    if ($LASTEXITCODE -ne 0) { throw "Docker failed during $step (exit code $LASTEXITCODE)." }
}

function Invoke-Postgres([string]$sql, [string]$step) {
    $output = docker exec $postgresName psql -v ON_ERROR_STOP=1 -U postgres -d rewind_test -At -c $sql
    Assert-DockerSuccess $step
    return ($output -join "`n").Trim()
}

function Invoke-Edge([string]$method, [string]$path, [string]$token, [object]$body = $null) {
    $headers = @{ Origin = $pagesOrigin }
    if ($token) { $headers.Authorization = "Bearer $token" }
    $parameters = @{
        Uri = "$script:edgeUrl$path"
        Method = $method
        Headers = $headers
        SkipHttpErrorCheck = $true
        TimeoutSec = 15
    }
    if ($null -ne $body) {
        $parameters.ContentType = 'application/json'
        $parameters.Body = if ($body -is [string]) { $body } else { $body | ConvertTo-Json -Depth 10 -Compress }
    }
    return Invoke-WebRequest @parameters
}

try {
    docker network create $networkName | Out-Null
    Assert-DockerSuccess 'network creation'
    $createdNetwork = $true

    docker run -d --rm --name $postgresName --network $networkName `
        --tmpfs /var/lib/postgresql/data:rw,size=1g `
        -e POSTGRES_DB=rewind_test -e POSTGRES_PASSWORD=local_review_test_only `
        -e POSTGRES_HOST_AUTH_METHOD=trust $postgresImage | Out-Null
    Assert-DockerSuccess 'temporary PostgreSQL start'
    $startedPostgres = $true

    $ready = $false
    for ($attempt = 0; $attempt -lt 45; $attempt++) {
        try { docker exec $postgresName psql -U postgres -d rewind_test -At -c 'SELECT 1' *>&1 | Out-Null } catch { }
        if ($LASTEXITCODE -eq 0) { $ready = $true; break }
        Start-Sleep -Seconds 1
    }
    if (-not $ready) { throw 'Temporary PostgreSQL did not become ready.' }

    $migrationNames = @(
        '20261104021259_revoke_public_execution_from_rls_event_trigger.sql',
        '20261104182022_rewind_public_movie_catalog.sql',
        '20261104182045_rewind_public_movie_catalog_seed.sql',
        '20261104190525_public_movie_metadata.sql',
        '20261104190729_public_movie_metadata_seed.sql',
        '20261104192953_rls_public_catalog_edge_reader.sql',
        '20261104203146_index_movie_directors_director_id.sql'
    )
    foreach ($name in $migrationNames) {
        $source = Join-Path $migrationDir $name
        $target = "/tmp/$name"
        docker cp $source "${postgresName}:$target" | Out-Null
        Assert-DockerSuccess "$name copy"
        docker exec $postgresName psql -v ON_ERROR_STOP=1 -U postgres -d rewind_test -f $target | Out-Null
        Assert-DockerSuccess "$name apply"
    }

    Invoke-Postgres @'
CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY);
INSERT INTO auth.users VALUES
 ('11111111-1111-4111-8111-111111111111'),
 ('22222222-2222-4222-8222-222222222222'),
 ('33333333-3333-4333-8333-333333333333');
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
'@ 'Supabase local role fixture' | Out-Null

    foreach ($name in @(
        '20261104221452_auth_user_private_data.sql',
        '20261104221625_auth_user_private_indexes.sql',
        '20261109145515_rewind_full_application_schema.sql',
        '20261109145711_supabase_rating_api.sql',
        '20261109190528_edge_public_list_access.sql',
        '20261109190530_edge_review_comment_api.sql',
        '20261109190531_edge_social_api.sql',
        '20261109190533_edge_notifications_messages.sql',
        '20261109190534_edge_journal_newsletter.sql',
        '20261109190536_edge_admin_users.sql',
        '20261109190540_edge_admin_lists.sql',
        '20261109190542_edge_admin_settings_audit.sql',
        '20261109190543_edge_admin_newsletter_queue.sql',
        '20261109190545_edge_admin_movies.sql',
        '20261109190546_edge_tmdb_sync.sql',
        '20261109201052_edge_account_deletion.sql'
    )) {
        $source = Join-Path $migrationDir $name
        $target = "/tmp/$name"
        docker cp $source "${postgresName}:$target" | Out-Null
        Assert-DockerSuccess "$name copy"
        docker exec $postgresName psql -v ON_ERROR_STOP=1 -U postgres -d rewind_test -f $target | Out-Null
        Assert-DockerSuccess "$name apply"
    }

    Invoke-Postgres 'CREATE ROLE rewind_edge_test LOGIN; GRANT rewind_edge_reader, rewind_edge_app TO rewind_edge_test;' 'test role setup' | Out-Null

    $seedOwners = @'
BEGIN;
SET LOCAL ROLE rewind_edge_app;
SELECT set_config('rewind.supabase_user_id','11111111-1111-4111-8111-111111111111',true);
INSERT INTO rewind.users(username,email,password_hash,supabase_user_id)
VALUES ('review-owner','owner@example.invalid','!supabase-managed!','11111111-1111-4111-8111-111111111111');
SELECT set_config('rewind.user_id','1',true);
INSERT INTO rewind.reviews(user_id,movie_id,content,rating) VALUES
 (1,1,'owner review',5),(1,2,'second review',4),(1,3,'third review',3);
INSERT INTO rewind.ratings(user_id,movie_id,rating) VALUES (1,1,5),(1,2,4),(1,3,3)
ON CONFLICT (user_id,movie_id) DO UPDATE SET rating=EXCLUDED.rating;
INSERT INTO rewind.comments(review_id,user_id,content) VALUES (1,1,'owner comment');
INSERT INTO rewind.user_activities(user_id,activity_type,movie_id,review_id) VALUES (1,'REVIEW',1,1);
SELECT set_config('rewind.supabase_user_id','22222222-2222-4222-8222-222222222222',true);
SELECT set_config('rewind.user_id','',true);
INSERT INTO rewind.users(username,email,password_hash,supabase_user_id)
VALUES ('review-actor','actor@example.invalid','!supabase-managed!','22222222-2222-4222-8222-222222222222');
SELECT set_config('rewind.user_id','2',true);
INSERT INTO rewind.review_likes(review_id,user_id) VALUES (1,2)
ON CONFLICT (review_id,user_id) DO NOTHING;
INSERT INTO rewind.notifications(recipient_id,actor_id,notification_type,review_id)
VALUES (1,2,'REVIEW_LIKED',1);
COMMIT;
'@
    Invoke-Postgres $seedOwners 'owner, comment, rating, activity, like, and notification inserts' | Out-Null
    Invoke-Postgres "INSERT INTO rewind.users(username,email,password_hash,supabase_user_id) VALUES ('review-admin','admin@example.invalid','!supabase-managed!','33333333-3333-4333-8333-333333333333'); UPDATE rewind.users SET role='ADMIN' WHERE id=3;" 'dedicated admin fixture' | Out-Null

    Invoke-Postgres @'
INSERT INTO rewind.journal_articles(slug,language,category,title,excerpt,content,is_published,published_at) VALUES
 ('uk-only','uk','Essays','Українська стаття','Коротко','Текст українською',TRUE,'2025-03-12T10:00:00Z'),
 ('translated','uk','Essays','Переклад','Українською','Український текст',TRUE,'2025-03-15T10:00:00Z'),
 ('translated','en','Essays','Translated','In English','English text',TRUE,'2025-03-16T10:00:00Z'),
 ('draft','uk','Essays','Чернетка',NULL,'Не має бути публічною',FALSE,'2025-03-17T10:00:00Z'),
 ('other-month','uk','News','Березнева новина',NULL,'Новина',TRUE,'2024-11-02T10:00:00Z');
'@ 'published journal fixture rows' | Out-Null

    Invoke-Postgres @'
INSERT INTO rewind.lists(user_id,name,list_type,is_public) VALUES
 (1,'Owner Watchlist','WATCHLIST',FALSE),(1,'Owner Watched','WATCHED',FALSE),
 (1,'Owner Favorites','FAVORITES',FALSE),(1,'Public picks','CUSTOM',TRUE);
INSERT INTO rewind.list_items(list_id,movie_id,position) VALUES (1,1,1),(2,2,1),(3,3,1),(4,1,1);
INSERT INTO rewind.user_activities(user_id,activity_type,movie_id) VALUES (1,'WATCHED',2);
INSERT INTO rewind.user_activities(user_id,activity_type,list_id) VALUES (1,'LIST',4);
'@ 'social profile and feed fixtures' | Out-Null

    Invoke-Postgres @'
INSERT INTO rewind.lists(user_id,name,list_type,is_public) VALUES (2,'Admin delete fixture','CUSTOM',FALSE);
INSERT INTO rewind.list_items(list_id,movie_id,position) VALUES (5,4,1);
'@ 'admin custom list delete fixture' | Out-Null

    Invoke-Postgres @'
INSERT INTO rewind.notification_preferences(user_id,review_likes_enabled) VALUES (1,FALSE);
UPDATE rewind.reviews SET is_hidden=TRUE WHERE id=2;
INSERT INTO rewind.comments(review_id,user_id,content,is_hidden) VALUES (2,1,'hidden comment',TRUE);
'@ 'moderation fixtures' | Out-Null

    $actorCheck = Invoke-Postgres @'
BEGIN;
SET LOCAL ROLE rewind_edge_app;
SELECT set_config('rewind.supabase_user_id','22222222-2222-4222-8222-222222222222',true);
SELECT set_config('rewind.user_id','2',true);
WITH hidden_review AS (SELECT COUNT(*) AS n FROM rewind.reviews WHERE id=2),
     hidden_comment AS (SELECT COUNT(*) AS n FROM rewind.comments WHERE id=2),
     foreign_update AS (UPDATE rewind.comments SET content='tampered' WHERE id=1 RETURNING id),
     foreign_delete AS (DELETE FROM rewind.comments WHERE id=1 RETURNING id)
SELECT (SELECT n FROM hidden_review)||'|'||(SELECT n FROM hidden_comment)||'|'
    ||(SELECT COUNT(*) FROM foreign_update)||'|'||(SELECT COUNT(*) FROM foreign_delete);
COMMIT;
'@ 'owner isolation RLS check'
    if ($actorCheck -notmatch '(^|\r?\n)0\|0\|0\|0($|\r?\n)') {
        throw "Hidden rows or another user's comment escaped RLS: $actorCheck"
    }

    $preferenceCheck = Invoke-Postgres @'
BEGIN;
SET LOCAL ROLE rewind_edge_app;
SELECT set_config('rewind.supabase_user_id','22222222-2222-4222-8222-222222222222',true);
SELECT set_config('rewind.user_id','2',true);
INSERT INTO rewind.review_likes(review_id,user_id) VALUES (3,2)
ON CONFLICT (review_id,user_id) DO NOTHING;
SELECT COALESCE((SELECT review_likes_enabled FROM rewind.notification_preferences WHERE user_id=1),TRUE);
COMMIT;
'@ 'notification preference owner scope'
    if ($preferenceCheck -notmatch '(^|\r?\n)(false|f)($|\r?\n)') {
        throw "The Edge role could not read the liked review owner's preference: $preferenceCheck"
    }

    $notificationCount = Invoke-Postgres 'SELECT COUNT(*) FROM rewind.notifications;' 'notification preference check'
    if ($notificationCount -ne '1') { throw "A disabled review-like preference was ignored: $notificationCount notification(s)." }

    $adminCheck = Invoke-Postgres @'
BEGIN;
SET LOCAL ROLE rewind_edge_app;
SELECT set_config('rewind.supabase_user_id','33333333-3333-4333-8333-333333333333',true);
SELECT set_config('rewind.user_id','3',true);
WITH seen AS (SELECT COUNT(*) AS n FROM rewind.comments WHERE id=2),
     seen_review AS (SELECT COUNT(*) AS n FROM rewind.reviews WHERE id=2)
SELECT (SELECT n FROM seen_review)||'|'||(SELECT n FROM seen);
COMMIT;
'@ 'admin hidden-comment moderation check'
    if ($adminCheck -notmatch '(^|\r?\n)1\|1($|\r?\n)') {
        throw "Admin moderation access did not match the policy: $adminCheck"
    }

    Set-Content -LiteralPath $authMockPath -Encoding utf8 -Value @'
Deno.serve({ port: 8001 }, (request) => {
  const users: Record<string, { id: string; email: string; username: string; password?: string }> = {
    "Bearer owner-token": { id: "11111111-1111-4111-8111-111111111111", email: "owner@example.invalid", username: "review-owner" },
    "Bearer actor-token": { id: "22222222-2222-4222-8222-222222222222", email: "actor@example.invalid", username: "review-actor" },
    "Bearer admin-token": { id: "33333333-3333-4333-8333-333333333333", email: "admin@example.invalid", username: "review-admin" },
    "Bearer delete-token": { id: "44444444-4444-4444-8444-444444444444", email: "delete@example.invalid", username: "review-delete", password: "delete-current-password" },
  };
  const url = new URL(request.url);
  if (request.method === "POST" && url.pathname === "/auth/v1/token") {
    return request.json().then((body) => {
      const identity = Object.values(users).find((candidate) => candidate.email === body.email && candidate.password === body.password);
      if (!identity) return Response.json({ message: "invalid credentials" }, { status: 400 });
      return Response.json({ access_token: "fresh-delete-token", user: { id: identity.id } });
    });
  }
  const deleteIdentityMatch = url.pathname.match(/^\/auth\/v1\/admin\/users\/([0-9a-f-]+)$/i);
  if (request.method === "DELETE" && deleteIdentityMatch) {
    if (request.headers.get("apikey") !== "local-delete-secret"
      || request.headers.get("Authorization") !== "Bearer local-delete-secret") {
      return Response.json({ message: "forbidden" }, { status: 403 });
    }
    return new Response(null, { status: 204 });
  }
  const movieMatch = url.pathname.match(/^\/3\/movie\/(\d+)$/);
  if (request.method === "GET" && movieMatch) {
    const id = Number(movieMatch[1]);
    return Response.json({
      id, title: `TMDB Fixture ${id}`, release_date: "2024-03-04", runtime: 111,
      overview: "Fixture overview", poster_path: "/fixture-poster.jpg", backdrop_path: "/fixture-backdrop.jpg",
      vote_average: 7.6, vote_count: 123, external_ids: { imdb_id: `tt99${id}` },
      genres: [{ id: 880001, name: "TMDB Fixture Genre" }],
      credits: {
        cast: [{ id: 880011, name: "Fixture Actor", profile_path: "/actor.jpg", character: "Lead", order: 0 }],
        crew: [{ id: 880012, name: "Fixture Director", job: "Director", profile_path: "/director.jpg" },
          { id: 880013, name: "Fixture Producer", job: "Producer", profile_path: "/producer.jpg" }],
      },
      videos: { results: [{ site: "YouTube", type: "Trailer", key: "fixtureTrailer", official: true }] },
      similar: { results: [{ id: 900001 }, { id }] },
    });
  }
  if (request.method === "GET" && url.pathname === "/3/discover/movie") {
    return Response.json({ page: 1, total_pages: 1, total_results: 1, results: [{ id: 900003 }] });
  }
  const token = request.headers.get("Authorization");
  const user = token ? users[token] : undefined;
  if (!user) return Response.json({ message: "unauthorized" }, { status: 401 });
  return Response.json({ ...user, email_confirmed_at: "2026-11-09T00:00:00Z", user_metadata: { username: user.username } });
});
'@
    docker run -d --rm --name $authMockName --network $networkName `
        --mount "type=bind,source=$authMockPath,target=/app/auth_mock.ts,readonly" `
        $denoImage deno run --allow-net=0.0.0.0:8001 /app/auth_mock.ts | Out-Null
    Assert-DockerSuccess 'local Auth mock start'
    $startedAuthMock = $true

    $supabaseUrlForTest = "SUPABASE_URL=http://${authMockName}:8001"
    docker run -d --name $functionName --network $networkName `
        -p 127.0.0.1::8000 `
        --mount "type=bind,source=$(Join-Path $repoRoot 'supabase/functions/rewind-api'),target=/app" -w /app `
        -e "SUPABASE_DB_URL=postgres://rewind_edge_test@${postgresName}:5432/rewind_test" `
        -e $supabaseUrlForTest `
        -e 'SUPABASE_ANON_KEY=local-review-test-key' `
        -e 'SUPABASE_SERVICE_ROLE_KEY=local-delete-secret' `
        -e 'TMDB_API_KEY=local-review-tmdb-fixture' `
        -e "TMDB_API_BASE_URL=http://${authMockName}:8001/3" `
        -e "REWIND_ALLOWED_ORIGINS=$pagesOrigin" `
        $denoImage deno run --frozen-lockfile --allow-net --allow-env=SUPABASE_DB_URL,SUPABASE_URL,SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,REWIND_ALLOWED_ORIGINS,TMDB_API_KEY,TMDB_API_BASE_URL index.ts | Out-Null
    Assert-DockerSuccess 'local Edge Function start'
    $startedFunction = $true
    $portMapping = docker port $functionName 8000/tcp
    Assert-DockerSuccess 'Edge Function port lookup'
    if ($portMapping -notmatch '127\.0\.0\.1:(\d+)') { throw 'Could not determine the temporary Edge Function port.' }
    $script:edgeUrl = "http://127.0.0.1:$($Matches[1])/functions/v1/rewind-api"

    $edgeReady = $false
    $edgeProbeFailure = 'No response received.'
    for ($attempt = 0; $attempt -lt 45; $attempt++) {
        try {
            $probe = Invoke-Edge 'GET' '/api/movies/1/reviews' ''
            if ($probe.StatusCode -eq 200) { $edgeReady = $true; break }
            $edgeProbeFailure = "HTTP $($probe.StatusCode): $($probe.Content)"
        } catch { $edgeProbeFailure = $_.Exception.Message }
        Start-Sleep -Seconds 1
    }
    if (-not $edgeReady) {
        $edgeStartupLog = @()
        try { $edgeStartupLog = @(docker logs $functionName 2>&1 | ForEach-Object { "$($_)" }) } catch { $edgeStartupLog += $_.Exception.Message }
        throw "Temporary Edge API did not become ready. Last probe: $edgeProbeFailure`n$($edgeStartupLog -join "`n")"
    }

    $globalSearchResponse = Invoke-Edge 'GET' '/api/search/global?q=owner&language=en&size=6' ''
    $globalSearch = $globalSearchResponse.Content | ConvertFrom-Json
    if ($globalSearchResponse.StatusCode -ne 200 -or $globalSearch.users.totalElements -lt 1 -or
        -not ($globalSearch.users.content | Where-Object { $_.username -eq 'review-owner' }) -or
        $globalSearch.lists.totalElements -lt 1 -or
        -not ($globalSearch.lists.content | Where-Object { $_.name -eq 'Public picks' }) -or
        $globalSearch.reviews.totalElements -lt 1 -or
        -not ($globalSearch.reviews.content | Where-Object { $_.content -eq 'owner review' }) -or
        $null -eq $globalSearch.films -or $null -eq $globalSearch.lists -or $null -eq $globalSearch.tags -or
        $null -eq $globalSearch.people -or $null -eq $globalSearch.journal) {
        throw "Global search failed to return its public result groups or seeded visible matches: $($globalSearchResponse.Content)"
    }

    $reviewPageResponse = Invoke-Edge 'GET' '/api/movies/1/reviews?page=0&size=5' ''
    $reviewPage = $reviewPageResponse.Content | ConvertFrom-Json
    if ($reviewPageResponse.StatusCode -ne 200 -or $reviewPage.totalElements -lt 1 -or $reviewPage.content[0].id -ne 1) {
        throw "Movie review HTTP query returned an unexpected page: $($reviewPageResponse.Content)"
    }

    $publicProfileResponse = Invoke-Edge 'GET' '/api/users/1/profile' ''
    $publicProfile = $publicProfileResponse.Content | ConvertFrom-Json
    if ($publicProfileResponse.StatusCode -ne 200 -or $publicProfile.id -ne 1 -or $publicProfile.stats.reviews -ne 2 -or
        $publicProfile.stats.watched -ne 1 -or $publicProfile.recentReviews.Count -ne 2) {
        throw "Public profile HTTP query returned an unexpected response: $($publicProfileResponse.Content)"
    }
    $collectionResponse = Invoke-Edge 'GET' '/api/users/1/collections/watched?page=0&size=10' ''
    $collection = $collectionResponse.Content | ConvertFrom-Json
    if ($collectionResponse.StatusCode -ne 200 -or $collection.totalElements -ne 1 -or $collection.content[0].id -ne 2) {
        throw "Public watched collection returned an unexpected page: $($collectionResponse.Content)"
    }
    $profileListsResponse = Invoke-Edge 'GET' '/api/users/1/lists?page=0&size=10' ''
    $profileLists = $profileListsResponse.Content | ConvertFrom-Json
    if ($profileListsResponse.StatusCode -ne 200 -or $profileLists.totalElements -ne 1 -or $profileLists.content[0].previewMovies[0].id -ne 1) {
        throw "Public profile lists returned an unexpected page: $($profileListsResponse.Content)"
    }
    $likedReviewsResponse = Invoke-Edge 'GET' '/api/users/2/liked-reviews?page=0&size=10' ''
    $likedReviews = $likedReviewsResponse.Content | ConvertFrom-Json
    if ($likedReviewsResponse.StatusCode -ne 200 -or $likedReviews.totalElements -ne 2 -or $likedReviews.content.Count -ne 2) {
        throw "Liked review profile page returned an unexpected response: $($likedReviewsResponse.Content)"
    }
    $profileActivityResponse = Invoke-Edge 'GET' '/api/users/1/activity?page=0&size=10' ''
    $profileActivity = $profileActivityResponse.Content | ConvertFrom-Json
    if ($profileActivityResponse.StatusCode -ne 200 -or $profileActivity.totalElements -lt 3 -or
        -not ($profileActivity.content | Where-Object type -eq 'WATCHED')) {
        throw "Public activity page returned an unexpected response: $($profileActivityResponse.Content)"
    }
    $recentWatchedResponse = Invoke-Edge 'GET' '/api/activity/recent-watched?size=6' ''
    $recentWatched = $recentWatchedResponse.Content | ConvertFrom-Json
    if ($recentWatchedResponse.StatusCode -ne 200 -or $recentWatched.content[0].actor.id -ne 1 -or $recentWatched.content[0].movie.id -ne 2) {
        throw "Recent watched feed returned an unexpected response: $($recentWatchedResponse.Content)"
    }
    $popularReviewersResponse = Invoke-Edge 'GET' '/api/users/popular-reviewers?size=6' ''
    $popularReviewers = $popularReviewersResponse.Content | ConvertFrom-Json
    if ($popularReviewersResponse.StatusCode -ne 200 -or $popularReviewers[0].id -ne 1 -or $popularReviewers[0].likes -ne 2 -or
        $popularReviewers[0].reviewCount -ne 2 -or $popularReviewers[0].watchedCount -ne 1 -or $popularReviewers[0].listCount -ne 1) {
        throw "Popular reviewers query returned an unexpected response: $($popularReviewersResponse.Content)"
    }
    $directoryResponse = Invoke-Edge 'GET' '/api/users/directory?q=owner&page=0&size=12' ''
    $directory = $directoryResponse.Content | ConvertFrom-Json
    if ($directoryResponse.StatusCode -ne 200 -or $directory.totalElements -ne 1 -or $directory.content[0].id -ne 1) {
        throw "Community directory query returned an unexpected response: $($directoryResponse.Content)"
    }
    $hqResponse = Invoke-Edge 'GET' '/api/users/hq?page=0&size=12' ''
    if ($hqResponse.StatusCode -ne 200 -or ($hqResponse.Content | ConvertFrom-Json).totalElements -ne 0) {
        throw "HQ users endpoint returned an unexpected response: $($hqResponse.Content)"
    }
    $socialLinksSave = Invoke-Edge 'PUT' '/api/profile/me/social-links' 'actor-token' '[{"platform":" Website ","url":"https://example.test/actor"}]'
    $socialLinksGet = Invoke-Edge 'GET' '/api/profile/me/social-links' 'actor-token'
    $actorPublicProfile = (Invoke-Edge 'GET' '/api/users/2/profile' '').Content | ConvertFrom-Json
    if ($socialLinksSave.StatusCode -ne 200 -or ($socialLinksSave.Content | ConvertFrom-Json)[0].platform -ne 'website' -or
        $socialLinksGet.StatusCode -ne 200 -or ($socialLinksGet.Content | ConvertFrom-Json)[0].url -ne 'https://example.test/actor' -or
        $actorPublicProfile.socialLinks[0].platform -ne 'website') {
        throw "Profile social links failed: save=$($socialLinksSave.StatusCode) $($socialLinksSave.Content); get=$($socialLinksGet.StatusCode) $($socialLinksGet.Content); public=$($actorPublicProfile | ConvertTo-Json -Depth 4 -Compress)"
    }
    $invalidSocialLink = Invoke-Edge 'PUT' '/api/profile/me/social-links' 'actor-token' '[{"platform":"website","url":"javascript:alert(1)"}]'
    if ($invalidSocialLink.StatusCode -ne 400) { throw 'An unsafe social link was accepted.' }
    $followResponse = Invoke-Edge 'POST' '/api/users/1/follow' 'actor-token'
    $duplicateFollow = Invoke-Edge 'POST' '/api/users/1/follow' 'actor-token'
    $followStatusResponse = Invoke-Edge 'GET' '/api/users/1/follow-status' 'actor-token'
    $followStatus = $followStatusResponse.Content | ConvertFrom-Json
    $followersResponse = Invoke-Edge 'GET' '/api/users/1/followers?page=0&size=8' ''
    $followingResponse = Invoke-Edge 'GET' '/api/users/2/following?page=0&size=8' ''
    $followingActivityResponse = Invoke-Edge 'GET' '/api/activity/following?page=0&size=10' 'actor-token'
    $followingActivity = $followingActivityResponse.Content | ConvertFrom-Json
    $selfFollow = Invoke-Edge 'POST' '/api/users/2/follow' 'actor-token'
    if ($followResponse.StatusCode -ne 204 -or $duplicateFollow.StatusCode -ne 204 -or
        $followStatusResponse.StatusCode -ne 200 -or -not $followStatus.following -or $followStatus.followers -ne 1 -or
        $followersResponse.StatusCode -ne 200 -or ($followersResponse.Content | ConvertFrom-Json).content[0].id -ne 2 -or
        $followingResponse.StatusCode -ne 200 -or ($followingResponse.Content | ConvertFrom-Json).content[0].id -ne 1 -or
        $followingActivityResponse.StatusCode -ne 200 -or $followingActivity.totalElements -lt 3 -or
        $selfFollow.StatusCode -ne 400) {
        throw 'Follow, relationship status, following activity, or self-follow guards failed.'
    }
    $followSideEffects = Invoke-Postgres "SELECT (SELECT COUNT(*) FROM rewind.follows WHERE follower_id=2 AND following_id=1)||'|'||(SELECT COUNT(*) FROM rewind.user_activities WHERE user_id=2 AND related_user_id=1 AND activity_type='FOLLOW')||'|'||(SELECT COUNT(*) FROM rewind.notifications WHERE recipient_id=1 AND actor_id=2 AND notification_type='FOLLOW');" 'follow side effects'
    if ($followSideEffects -ne '1|1|1') { throw "Idempotent follow side effects are wrong: $followSideEffects" }

    $ownerNotifications = Invoke-Edge 'GET' '/api/notifications?page=0&size=10' 'owner-token'
    $ownerNotificationsPage = $ownerNotifications.Content | ConvertFrom-Json
    $ownerUnreadBefore = Invoke-Edge 'GET' '/api/notifications/unread-count' 'owner-token'
    $ownerUnreadBeforeCount = ($ownerUnreadBefore.Content | ConvertFrom-Json).count
    $ownerPreferences = Invoke-Edge 'GET' '/api/notifications/preferences' 'owner-token'
    $ownerPreferencesValue = $ownerPreferences.Content | ConvertFrom-Json
    $preferenceSave = Invoke-Edge 'PUT' '/api/notifications/preferences' 'owner-token' @{ followsEnabled = $false; reviewLikesEnabled = $false }
    $actorPreferences = Invoke-Edge 'GET' '/api/notifications/preferences' 'actor-token'
    $actorPreferencesValue = $actorPreferences.Content | ConvertFrom-Json
    $ownerFollowNotification = $ownerNotificationsPage.content | Where-Object type -eq 'FOLLOW' | Select-Object -First 1
    if ($ownerNotifications.StatusCode -ne 200 -or $ownerNotificationsPage.totalElements -ne 2 -or
        -not $ownerFollowNotification -or $ownerFollowNotification.actor.id -ne 2 -or
        $ownerUnreadBefore.StatusCode -ne 200 -or $ownerUnreadBeforeCount -ne 2 -or
        $ownerPreferences.StatusCode -ne 200 -or $ownerPreferencesValue.followsEnabled -ne $true -or $ownerPreferencesValue.reviewLikesEnabled -ne $false -or
        $preferenceSave.StatusCode -ne 200 -or ($preferenceSave.Content | ConvertFrom-Json).followsEnabled -ne $false -or
        $actorPreferences.StatusCode -ne 200 -or $actorPreferencesValue.followsEnabled -ne $true -or
        $actorPreferencesValue.reviewLikesEnabled -ne $true) {
        throw "Notification reads/preferences did not preserve recipient settings: page=$($ownerNotifications.Content); unread=$($ownerUnreadBefore.Content); prefs=$($ownerPreferences.Content); save=$($preferenceSave.Content); actor=$($actorPreferences.Content)"
    }
    $foreignNotificationRead = Invoke-Edge 'POST' "/api/notifications/$($ownerFollowNotification.id)/read" 'actor-token'
    $ownerNotificationRead = Invoke-Edge 'POST' "/api/notifications/$($ownerFollowNotification.id)/read" 'owner-token'
    $ownerReadAll = Invoke-Edge 'POST' '/api/notifications/read-all' 'owner-token'
    $ownerUnreadAfter = Invoke-Edge 'GET' '/api/notifications/unread-count' 'owner-token'
    if ($foreignNotificationRead.StatusCode -ne 404 -or $ownerNotificationRead.StatusCode -ne 204 -or
        $ownerReadAll.StatusCode -ne 204 -or ($ownerUnreadAfter.Content | ConvertFrom-Json).count -ne 0) {
        throw "Notification ownership/read-all flow failed: foreign=$($foreignNotificationRead.StatusCode); own=$($ownerNotificationRead.StatusCode); all=$($ownerReadAll.StatusCode); unread=$($ownerUnreadAfter.Content)"
    }

    $journalPageResponse = Invoke-Edge 'GET' '/api/journal/articles?language=en&category=Essays&year=2025&month=3&page=0&size=20' ''
    $journalPage = $journalPageResponse.Content | ConvertFrom-Json
    $journalArchiveResponse = Invoke-Edge 'GET' '/api/journal/articles/archive?language=en' ''
    $journalArchive = $journalArchiveResponse.Content | ConvertFrom-Json
    $journalDetailResponse = Invoke-Edge 'GET' '/api/journal/articles/uk-only?language=en' ''
    $journalDetail = $journalDetailResponse.Content | ConvertFrom-Json
    $draftResponse = Invoke-Edge 'GET' '/api/journal/articles/draft?language=uk' ''
    if ($journalPageResponse.StatusCode -ne 200 -or $journalPage.totalElements -ne 2 -or
        -not ($journalPage.content | Where-Object { $_.slug -eq 'translated' -and $_.language -eq 'en' }) -or
        -not ($journalPage.content | Where-Object { $_.slug -eq 'uk-only' -and $_.language -eq 'uk' }) -or
        $journalArchiveResponse.StatusCode -ne 200 -or $journalArchive.Count -ne 2 -or
        $journalDetailResponse.StatusCode -ne 200 -or $journalDetail.language -ne 'uk' -or
        $draftResponse.StatusCode -ne 404) {
        throw "Public journal language fallback/archive/visibility failed: page=$($journalPageResponse.Content); archive=$($journalArchiveResponse.Content); detail=$($journalDetailResponse.Content); draft=$($draftResponse.StatusCode)"
    }
    $unauthenticatedAdminList = Invoke-Edge 'GET' '/api/admin/journal/articles' ''
    $regularAdminList = Invoke-Edge 'GET' '/api/admin/journal/articles' 'owner-token'
    $adminListResponse = Invoke-Edge 'GET' '/api/admin/journal/articles?page=0&size=50' 'admin-token'
    $adminList = $adminListResponse.Content | ConvertFrom-Json
    $adminCreateResponse = Invoke-Edge 'POST' '/api/admin/journal/articles' 'admin-token' @{
        slug = 'admin-created'; language = 'en'; category = 'Films'; title = 'Admin created article'; excerpt = 'Reviewable draft';
        content = 'Managed article body'; coverUrl = $null; audioUrl = 'https://example.invalid/audio.mp3'; published = $true; authorId = 1; role = 'USER'
    }
    $adminCreatedArticle = $adminCreateResponse.Content | ConvertFrom-Json
    if ($adminCreateResponse.StatusCode -ne 200) {
        $edgeFailureLog = docker logs $functionName 2>&1
        throw "Admin article creation failed before row checks: $($adminCreateResponse.StatusCode) $($adminCreateResponse.Content)`n$($edgeFailureLog -join "`n")"
    }
    $adminAuthor = Invoke-Postgres "SELECT author_id::text FROM rewind.journal_articles WHERE id=$($adminCreatedArticle.id);" 'journal admin author assignment'
    $adminAuditAfterCreate = Invoke-Postgres "SELECT COUNT(*) FROM rewind.admin_audit_logs WHERE admin_id=3 AND action='JOURNAL_ARTICLE_CREATED' AND target_id=$($adminCreatedArticle.id);" 'journal create audit event'
    $adminUpdateResponse = Invoke-Edge 'PUT' "/api/admin/journal/articles/$($adminCreatedArticle.id)" 'admin-token' @{
        slug = 'admin-created'; language = 'en'; category = 'Films'; title = 'Admin updated article'; excerpt = 'Updated';
        content = 'Updated body'; coverUrl = $null; audioUrl = $null; published = $false
    }
    $adminUpdatedArticle = $adminUpdateResponse.Content | ConvertFrom-Json
    $adminUnpublishedDetail = Invoke-Edge 'GET' '/api/journal/articles/admin-created?language=en' ''
    $adminAuditAfterUpdate = Invoke-Postgres "SELECT COUNT(*) FROM rewind.admin_audit_logs WHERE admin_id=3 AND target_id=$($adminCreatedArticle.id) AND action IN ('JOURNAL_ARTICLE_CREATED','JOURNAL_ARTICLE_UPDATED');" 'journal update audit events'
    $regularAdminCreate = Invoke-Edge 'POST' '/api/admin/journal/articles' 'owner-token' @{
        slug = 'forbidden-admin-article'; language = 'uk'; category = 'Films'; title = 'Must be forbidden'; content = 'No'; published = $true
    }
    if ($unauthenticatedAdminList.StatusCode -ne 401 -or $regularAdminList.StatusCode -ne 403 -or
        $adminListResponse.StatusCode -ne 200 -or $adminList.totalElements -ne 5 -or
        $adminCreateResponse.StatusCode -ne 200 -or $adminCreatedArticle.publishedAt -eq $null -or $adminAuthor -ne '3' -or $adminAuditAfterCreate -ne '1' -or
        $adminUpdateResponse.StatusCode -ne 200 -or $adminUpdatedArticle.title -ne 'Admin updated article' -or $adminUpdatedArticle.publishedAt -ne $null -or
        $adminUnpublishedDetail.StatusCode -ne 404 -or $adminAuditAfterUpdate -ne '2' -or $regularAdminCreate.StatusCode -ne 403) {
        throw "Admin journal authorization/CRUD/audit flow failed: unauth=$($unauthenticatedAdminList.StatusCode); regular=$($regularAdminList.StatusCode); list=$($adminListResponse.Content); create=$($adminCreateResponse.Content); author=$adminAuthor; auditCreate=$adminAuditAfterCreate; update=$($adminUpdateResponse.Content); hidden=$($adminUnpublishedDetail.StatusCode); auditUpdate=$adminAuditAfterUpdate; regularCreate=$($regularAdminCreate.StatusCode)"
    }
    $initialNewsletter = Invoke-Edge 'GET' '/api/newsletter/subscription' 'owner-token'
    $newsletterState = $initialNewsletter.Content | ConvertFrom-Json
    $actorInitialNewsletter = Invoke-Edge 'GET' '/api/newsletter/subscription' 'actor-token'
    $actorNewsletterState = $actorInitialNewsletter.Content | ConvertFrom-Json
    $newsletterSubscribed = Invoke-Edge 'PUT' '/api/newsletter/subscription' 'owner-token' @{ subscribed = $true; userId = 2 }
    $newsletterOnState = Invoke-Edge 'GET' '/api/newsletter/subscription' 'owner-token'
    $newsletterUnsubscribed = Invoke-Edge 'PUT' '/api/newsletter/subscription' 'owner-token' @{ subscribed = $false }
    $newsletterOffState = Invoke-Edge 'GET' '/api/newsletter/subscription' 'owner-token'
    $newsletterTimestamp = Invoke-Postgres 'SELECT (subscribed_at IS NULL)::text FROM rewind.newsletter_subscriptions WHERE user_id=1;' 'newsletter unsubscribe timestamp reset'
    if ($initialNewsletter.StatusCode -ne 200 -or $newsletterState.subscribed -ne $false -or
        $actorInitialNewsletter.StatusCode -ne 200 -or $actorNewsletterState.subscribed -ne $false -or
        $newsletterSubscribed.StatusCode -ne 200 -or ($newsletterOnState.Content | ConvertFrom-Json).subscribed -ne $true -or
        $newsletterUnsubscribed.StatusCode -ne 200 -or ($newsletterOffState.Content | ConvertFrom-Json).subscribed -ne $false -or
        $newsletterTimestamp -ne 'true') {
        throw "Newsletter subscription owner/persistence flow failed: initial=$($initialNewsletter.Content); actor=$($actorInitialNewsletter.Content); on=$($newsletterOnState.Content); off=$($newsletterOffState.Content); timestamp=$newsletterTimestamp"
    }
    $actorSubscribedForDelivery = Invoke-Edge 'PUT' '/api/newsletter/subscription' 'actor-token' @{ subscribed = $true }
    $adminNewsletterArticleResponse = Invoke-Edge 'POST' '/api/admin/journal/articles' 'admin-token' @{
        slug = 'newsletter-delivery-test'; language = 'en'; category = 'Newsletter'; title = 'Delivery rehearsal'; excerpt = $null;
        content = 'Queue only, no email transport'; coverUrl = $null; audioUrl = $null; published = $true
    }
    $adminNewsletterArticle = $adminNewsletterArticleResponse.Content | ConvertFrom-Json
    $invalidNewsletterQueue = Invoke-Edge 'POST' '/api/admin/journal/articles/4/newsletter' 'admin-token'
    $newsletterQueue = Invoke-Edge 'POST' "/api/admin/journal/articles/$($adminNewsletterArticle.id)/newsletter" 'admin-token'
    $newsletterQueueAgain = Invoke-Edge 'POST' "/api/admin/journal/articles/$($adminNewsletterArticle.id)/newsletter" 'admin-token'
    $newsletterStatus = Invoke-Edge 'GET' "/api/admin/journal/articles/$($adminNewsletterArticle.id)/newsletter" 'admin-token'
    $newsletterRegularAdmin = Invoke-Edge 'POST' "/api/admin/journal/articles/$($adminNewsletterArticle.id)/newsletter" 'owner-token'
    $newsletterQueueAudit = Invoke-Postgres "SELECT COUNT(*) FROM rewind.admin_audit_logs WHERE admin_id=3 AND action='JOURNAL_NEWSLETTER_QUEUED' AND target_id=$($adminNewsletterArticle.id);" 'newsletter queue audit events'
    $newsletterDeliveryRows = Invoke-Postgres "SELECT COUNT(*)::text||'|'||COUNT(DISTINCT user_id)::text FROM rewind.newsletter_deliveries WHERE article_id=$($adminNewsletterArticle.id);" 'newsletter queued recipient rows'
    if ($actorSubscribedForDelivery.StatusCode -ne 200 -or $adminNewsletterArticleResponse.StatusCode -ne 200 -or
        $invalidNewsletterQueue.StatusCode -ne 400 -or $newsletterQueue.StatusCode -ne 200 -or ($newsletterQueue.Content | ConvertFrom-Json).recipients -ne 1 -or
        $newsletterQueueAgain.StatusCode -ne 200 -or ($newsletterQueueAgain.Content | ConvertFrom-Json).recipients -ne 0 -or
        $newsletterStatus.StatusCode -ne 200 -or ($newsletterStatus.Content | ConvertFrom-Json).pending -ne 1 -or
        $newsletterRegularAdmin.StatusCode -ne 403 -or $newsletterQueueAudit -ne '2' -or $newsletterDeliveryRows -ne '1|1') {
        $edgeFailureLog = docker logs $functionName 2>&1
        throw "Newsletter queue/status flow failed: subscribe=$($actorSubscribedForDelivery.StatusCode); article=$($adminNewsletterArticleResponse.Content); invalid=$($invalidNewsletterQueue.StatusCode); queue=$($newsletterQueue.Content); repeat=$($newsletterQueueAgain.Content); status=$($newsletterStatus.Content); regular=$($newsletterRegularAdmin.StatusCode); audit=$newsletterQueueAudit; rows=$newsletterDeliveryRows`n$($edgeFailureLog -join "`n")"
    }

    $startedConversation = Invoke-Edge 'POST' '/api/conversations' 'actor-token' @{ userId = 1 }
    $conversation = $startedConversation.Content | ConvertFrom-Json
    $sameConversation = Invoke-Edge 'POST' '/api/conversations' 'owner-token' @{ userId = 2 }
    $sameConversationValue = $sameConversation.Content | ConvertFrom-Json
    $invalidSelfMessage = Invoke-Edge 'POST' '/api/conversations' 'owner-token' @{ userId = 1 }
    $invalidBlankMessage = Invoke-Edge 'POST' "/api/conversations/$($conversation.id)/messages" 'actor-token' @{ body = '  '; senderId = 1 }
    $sentMessage = Invoke-Edge 'POST' "/api/conversations/$($conversation.id)/messages" 'actor-token' @{ body = '  hello from actor  '; senderId = 1 }
    $sentMessageValue = $sentMessage.Content | ConvertFrom-Json
    $ownerConversationList = Invoke-Edge 'GET' '/api/conversations?page=0&size=10' 'owner-token'
    $ownerConversationPage = $ownerConversationList.Content | ConvertFrom-Json
    $ownerMessageUnread = Invoke-Edge 'GET' '/api/conversations/unread-count' 'owner-token'
    $ownerMessagePage = Invoke-Edge 'GET' "/api/conversations/$($conversation.id)/messages?page=0&size=10" 'owner-token'
    $ownerMessages = $ownerMessagePage.Content | ConvertFrom-Json
    $ownerMessageRead = Invoke-Edge 'POST' "/api/conversations/$($conversation.id)/read" 'owner-token'
    $ownerMessageUnreadAfter = Invoke-Edge 'GET' '/api/conversations/unread-count' 'owner-token'
    $messageReadAt = Invoke-Postgres "SELECT (read_at IS NOT NULL)::text FROM rewind.messages WHERE id=$($sentMessageValue.id);" 'message read receipt'
    if ($startedConversation.StatusCode -ne 200 -or $conversation.otherUser.id -ne 1 -or
        $sameConversation.StatusCode -ne 200 -or $sameConversationValue.id -ne $conversation.id -or
        $invalidSelfMessage.StatusCode -ne 400 -or $invalidBlankMessage.StatusCode -ne 400 -or
        $sentMessage.StatusCode -ne 200 -or $sentMessageValue.body -ne 'hello from actor' -or $sentMessageValue.senderId -ne 2 -or
        $ownerConversationList.StatusCode -ne 200 -or $ownerConversationPage.content[0].lastMessage.body -ne 'hello from actor' -or
        ($ownerMessageUnread.Content | ConvertFrom-Json).count -ne 1 -or $ownerMessagePage.StatusCode -ne 200 -or
        $ownerMessages.content[0].senderId -ne 2 -or $ownerMessageRead.StatusCode -ne 204 -or
        ($ownerMessageUnreadAfter.Content | ConvertFrom-Json).count -ne 0 -or $messageReadAt -ne 'true') {
        throw "Conversation/message ownership and read flow failed: start=$($startedConversation.Content); repeat=$($sameConversation.Content); self=$($invalidSelfMessage.StatusCode); blank=$($invalidBlankMessage.StatusCode); send=$($sentMessage.Content); list=$($ownerConversationList.Content); unread=$($ownerMessageUnread.Content); messages=$($ownerMessagePage.Content); read=$($ownerMessageRead.StatusCode); remaining=$($ownerMessageUnreadAfter.Content); readAt=$messageReadAt"
    }

    $reverseFollow = Invoke-Edge 'POST' '/api/users/2/follow' 'owner-token'
    $blockResponse = Invoke-Edge 'POST' '/api/users/1/block' 'actor-token'
    $block = $blockResponse.Content | ConvertFrom-Json
    $blockStatusResponse = Invoke-Edge 'GET' '/api/users/1/block-status' 'actor-token'
    $blockStatus = $blockStatusResponse.Content | ConvertFrom-Json
    $followWhileBlocked = Invoke-Edge 'POST' '/api/users/1/follow' 'actor-token'
    $blockedFollows = Invoke-Postgres "SELECT COUNT(*) FROM rewind.follows WHERE (follower_id=1 AND following_id=2) OR (follower_id=2 AND following_id=1);" 'block removes both follow directions'
    if ($reverseFollow.StatusCode -ne 204 -or $blockResponse.StatusCode -ne 200 -or -not $block.blocked -or
        $blockStatusResponse.StatusCode -ne 200 -or -not $blockStatus.blocked -or
        $followWhileBlocked.StatusCode -ne 403 -or $blockedFollows -ne '0') {
        throw "Block flow failed: reverse=$($reverseFollow.StatusCode); block=$($blockResponse.StatusCode) $($blockResponse.Content); status=$($blockStatusResponse.StatusCode) $($blockStatusResponse.Content); following=$($followWhileBlocked.StatusCode) $($followWhileBlocked.Content); remaining=$blockedFollows"
    }
    $blockedMessageRead = Invoke-Edge 'GET' "/api/conversations/$($conversation.id)/messages" 'owner-token'
    $blockedMessageSend = Invoke-Edge 'POST' "/api/conversations/$($conversation.id)/messages" 'owner-token' @{ body = 'should be blocked' }
    if ($blockedMessageRead.StatusCode -ne 403 -or $blockedMessageSend.StatusCode -ne 403) {
        throw "Blocked users exchanged messages: read=$($blockedMessageRead.StatusCode) $($blockedMessageRead.Content); send=$($blockedMessageSend.StatusCode) $($blockedMessageSend.Content)"
    }
    $unblockResponse = Invoke-Edge 'DELETE' '/api/users/1/block' 'actor-token'
    $unblocked = $unblockResponse.Content | ConvertFrom-Json
    if ($unblockResponse.StatusCode -ne 200 -or $unblocked.blocked) { throw 'Unblock did not clear the relationship.' }
    $followAgain = Invoke-Edge 'POST' '/api/users/1/follow' 'actor-token'
    if ($followAgain.StatusCode -ne 204) { throw 'Following after unblock should succeed.' }
    $suppressedFollowNotificationCount = Invoke-Postgres "SELECT COUNT(*) FROM rewind.notifications WHERE recipient_id=1 AND actor_id=2 AND notification_type='FOLLOW';" 'disabled follow notification preference'
    if ($suppressedFollowNotificationCount -ne '1') { throw "Disabled follow notifications were not respected: $suppressedFollowNotificationCount notification(s)." }
    $unfollow = Invoke-Edge 'DELETE' '/api/users/1/follow' 'actor-token'
    if ($unfollow.StatusCode -ne 204) { throw "Unfollow should return 204, got $($unfollow.StatusCode)." }
    $detailsResponse = Invoke-Edge 'GET' '/api/reviews/1' ''
    $details = $detailsResponse.Content | ConvertFrom-Json
    if ($detailsResponse.StatusCode -ne 200 -or $details.id -ne 1 -or $details.author.id -ne 1 -or $details.movie.id -ne 1) {
        throw "Review details HTTP query returned an unexpected response: $($detailsResponse.Content)"
    }
    $actorReviewResponse = Invoke-Edge 'GET' '/api/movies/1/reviews/me' 'actor-token'
    if ($actorReviewResponse.StatusCode -ne 204) { throw "Missing personal review should return 204, got $($actorReviewResponse.StatusCode)." }

    $likesResponse = Invoke-Edge 'GET' '/api/reviews/1/like-status' 'actor-token'
    $likes = $likesResponse.Content | ConvertFrom-Json
    if ($likesResponse.StatusCode -ne 200 -or -not $likes.liked -or $likes.likes -ne 1) {
        throw "Review like status returned an unexpected response: $($likesResponse.Content)"
    }
    $commentsResponse = Invoke-Edge 'GET' '/api/reviews/1/comments?page=0&size=20' ''
    $comments = $commentsResponse.Content | ConvertFrom-Json
    if ($commentsResponse.StatusCode -ne 200 -or $comments.totalElements -ne 1 -or $comments.content[0].text -ne 'owner comment') {
        throw "Review comments HTTP query returned an unexpected page: $($commentsResponse.Content)"
    }

    $createdCommentResponse = Invoke-Edge 'POST' '/api/reviews/1/comments' 'actor-token' @{ text = '  new comment  '; userId = 1 }
    $createdComment = $createdCommentResponse.Content | ConvertFrom-Json
    if ($createdCommentResponse.StatusCode -ne 200 -or $createdComment.text -ne 'new comment' -or $createdComment.userId -ne 2) {
        throw "Comment creation HTTP response mismatch: $($createdCommentResponse.Content)"
    }
    $updatedCommentResponse = Invoke-Edge 'PATCH' "/api/comments/$($createdComment.id)" 'actor-token' @{ text = 'updated comment' }
    $updatedComment = $updatedCommentResponse.Content | ConvertFrom-Json
    if ($updatedCommentResponse.StatusCode -ne 200 -or $updatedComment.text -ne 'updated comment') {
        throw "Comment update HTTP response mismatch: $($updatedCommentResponse.Content)"
    }
    $foreignEdit = Invoke-Edge 'PATCH' "/api/comments/$($createdComment.id)" 'owner-token' @{ text = 'should fail' }
    $foreignDelete = Invoke-Edge 'DELETE' "/api/comments/$($createdComment.id)" 'owner-token'
    if ($foreignEdit.StatusCode -ne 403 -or $foreignDelete.StatusCode -ne 403) {
        throw 'A different user edited or deleted the comment.'
    }
    $ownerCommentDelete = Invoke-Edge 'DELETE' "/api/comments/$($createdComment.id)" 'actor-token'
    if ($ownerCommentDelete.StatusCode -ne 204) { throw "Comment owner delete should return 204, got $($ownerCommentDelete.StatusCode)." }

    $createdReviewResponse = Invoke-Edge 'POST' '/api/movies/4/reviews' 'actor-token' @{ content = "new review`nsecond line"; rating = 4; userId = 1; role = 'ADMIN' }
    $createdReview = $createdReviewResponse.Content | ConvertFrom-Json
    if ($createdReviewResponse.StatusCode -ne 200 -or $createdReview.userId -ne 2 -or $createdReview.rating -ne 4) {
        throw "Review create HTTP response mismatch: $($createdReviewResponse.Content)"
    }
    $activityCount = Invoke-Postgres "SELECT COUNT(*) FROM rewind.user_activities WHERE user_id=2 AND review_id=$($createdReview.id) AND activity_type='REVIEW';" 'review activity side effect'
    $ratingCount = Invoke-Postgres "SELECT COUNT(*) FROM rewind.ratings WHERE user_id=2 AND movie_id=4 AND rating=4;" 'review rating side effect'
    if ($activityCount -ne '1' -or $ratingCount -ne '1') { throw 'Review create did not persist its rating/activity side effects.' }

    $adminReviewsUnauthenticated = Invoke-Edge 'GET' '/api/admin/reviews' ''
    $adminReviewsForbidden = Invoke-Edge 'GET' '/api/admin/reviews' 'owner-token'
    $adminReviewsHiddenResponse = Invoke-Edge 'GET' '/api/admin/reviews?hidden=true&page=0&size=50' 'admin-token'
    $adminReviewsHidden = $adminReviewsHiddenResponse.Content | ConvertFrom-Json
    $adminReviewHide = Invoke-Edge 'POST' '/api/admin/reviews/1/hide' 'admin-token' @{ reason = 'Needs review'; role = 'USER' }
    $adminReviewUnhide = Invoke-Edge 'POST' '/api/admin/reviews/1/unhide' 'admin-token' @{ reason = 'Ignored while unhiding' }
    $adminCommentsHiddenResponse = Invoke-Edge 'GET' '/api/admin/comments?hidden=true&page=0&size=50' 'admin-token'
    $adminCommentsHidden = $adminCommentsHiddenResponse.Content | ConvertFrom-Json
    $adminCommentHide = Invoke-Edge 'POST' '/api/admin/comments/1/hide' 'admin-token' @{ reason = 'Spam comment' }
    $adminCommentUnhide = Invoke-Edge 'POST' '/api/admin/comments/1/unhide' 'admin-token' @{ reason = 'Ignored while unhiding' }
    $adminQueueResponse = Invoke-Edge 'GET' '/api/admin/moderation/queue?type=REVIEW&query=third&page=0&size=50' 'admin-token'
    $adminQueue = $adminQueueResponse.Content | ConvertFrom-Json
    $adminQueueHide = Invoke-Edge 'POST' '/api/admin/moderation/REVIEW/3/hide' 'admin-token' @{ reason = 'Queue review' }
    $adminBulkHide = Invoke-Edge 'POST' '/api/admin/moderation/bulk-hide' 'admin-token' @{
        items = @(@{ type = 'COMMENT'; id = 2 }, @{ type = 'REVIEW'; id = $createdReview.id }); reason = 'Bulk moderation'
    }
    $adminBulkResult = $adminBulkHide.Content | ConvertFrom-Json
    $moderatedRows = Invoke-Postgres "
SELECT (SELECT COUNT(*) FROM rewind.reviews WHERE id=1 AND is_hidden=false AND moderated_by=3 AND moderated_reason IS NULL)
  || '|' || (SELECT COUNT(*) FROM rewind.reviews WHERE id=3 AND is_hidden=true AND moderated_by=3 AND moderated_reason='Queue review')
  || '|' || (SELECT COUNT(*) FROM rewind.comments WHERE id=1 AND is_hidden=false AND moderated_by=3 AND moderated_reason IS NULL)
  || '|' || (SELECT COUNT(*) FROM rewind.comments WHERE id=2 AND is_hidden=true AND moderated_by=3 AND moderated_reason='Bulk moderation')
  || '|' || (SELECT COUNT(*) FROM rewind.reviews WHERE id=$($createdReview.id) AND is_hidden=true AND moderated_by=3 AND moderated_reason='Bulk moderation');
" 'admin moderation field persistence'
    $adminCommentDelete = Invoke-Edge 'DELETE' '/api/admin/comments/2' 'admin-token'
    $adminReviewDelete = Invoke-Edge 'DELETE' "/api/admin/reviews/$($createdReview.id)" 'admin-token'
    $adminAuditEvents = Invoke-Postgres @'
SELECT COUNT(*) FROM rewind.admin_audit_logs WHERE admin_id=3 AND action IN
 ('REVIEW_HIDDEN','REVIEW_UNHIDDEN','REVIEW_DELETED','COMMENT_HIDDEN','COMMENT_UNHIDDEN','COMMENT_DELETED');
'@ 'admin moderation audit events'
    if ($adminReviewsUnauthenticated.StatusCode -ne 401 -or $adminReviewsForbidden.StatusCode -ne 403 -or
        $adminReviewsHiddenResponse.StatusCode -ne 200 -or $adminReviewsHidden.totalElements -ne 1 -or $adminReviewsHidden.content[0].id -ne 2 -or
        $adminReviewHide.StatusCode -ne 200 -or ($adminReviewHide.Content | ConvertFrom-Json).moderatedReason -ne 'Needs review' -or
        $adminReviewUnhide.StatusCode -ne 200 -or ($adminReviewUnhide.Content | ConvertFrom-Json).isHidden -ne $false -or
        $adminCommentsHiddenResponse.StatusCode -ne 200 -or $adminCommentsHidden.totalElements -ne 1 -or $adminCommentsHidden.content[0].id -ne 2 -or
        $adminCommentHide.StatusCode -ne 200 -or ($adminCommentHide.Content | ConvertFrom-Json).moderatedReason -ne 'Spam comment' -or
        $adminCommentUnhide.StatusCode -ne 200 -or ($adminCommentUnhide.Content | ConvertFrom-Json).isHidden -ne $false -or
        $adminQueueResponse.StatusCode -ne 200 -or $adminQueue.totalElements -ne 1 -or $adminQueue.content[0].id -ne 3 -or
        $adminQueueHide.StatusCode -ne 200 -or $adminBulkHide.StatusCode -ne 200 -or $adminBulkResult.hidden -ne 2 -or
        $moderatedRows -ne '1|1|1|1|1' -or $adminCommentDelete.StatusCode -ne 204 -or $adminReviewDelete.StatusCode -ne 204 -or $adminAuditEvents -ne '9') {
        $edgeFailureLog = docker logs $functionName 2>&1
        throw "Admin review/comment moderation flow failed: unauth=$($adminReviewsUnauthenticated.StatusCode); regular=$($adminReviewsForbidden.StatusCode); reviews=$($adminReviewsHiddenResponse.Content); reviewHide=$($adminReviewHide.Content); reviewUnhide=$($adminReviewUnhide.Content); comments=$($adminCommentsHiddenResponse.Content); commentHide=$($adminCommentHide.Content); commentUnhide=$($adminCommentUnhide.Content); queue=$($adminQueueResponse.Content); queueHide=$($adminQueueHide.StatusCode); bulk=$($adminBulkHide.Content); rows=$moderatedRows; deletes=$($adminCommentDelete.StatusCode)/$($adminReviewDelete.StatusCode); audit=$adminAuditEvents`n$($edgeFailureLog -join "`n")"
    }

    $adminNotificationUnauthenticated = Invoke-Edge 'GET' '/api/admin/notifications' ''
    $adminNotificationForbidden = Invoke-Edge 'GET' '/api/admin/notifications' 'owner-token'
    $adminNotificationFilteredResponse = Invoke-Edge 'GET' '/api/admin/notifications?type=REVIEW_LIKED&read=true&recipientId=1&page=0&size=50' 'admin-token'
    $adminNotificationFiltered = $adminNotificationFilteredResponse.Content | ConvertFrom-Json
    $adminNotificationCreate = Invoke-Edge 'POST' '/api/admin/notifications' 'admin-token' @{ recipientId = 3; actorId = 2; type = 'FOLLOW'; relatedUserId = 2 }
    $adminCreatedNotification = $adminNotificationCreate.Content | ConvertFrom-Json
    $adminNotificationRead = Invoke-Edge 'PATCH' "/api/admin/notifications/$($adminCreatedNotification.id)/read" 'admin-token'
    $adminNotificationUnread = Invoke-Edge 'PATCH' "/api/admin/notifications/$($adminCreatedNotification.id)/unread" 'admin-token'
    $adminNotificationReadAll = Invoke-Edge 'PATCH' '/api/admin/notifications/read-all?type=FOLLOW&recipientId=3' 'admin-token'
    $adminReadAllResult = $adminNotificationReadAll.Content | ConvertFrom-Json
    $adminNotificationReadAt = Invoke-Postgres "SELECT (read_at IS NOT NULL)::text FROM rewind.notifications WHERE id=$($adminCreatedNotification.id);" 'admin notification read persistence'
    $adminNotificationBulkDelete = Invoke-Edge 'DELETE' '/api/admin/notifications?type=FOLLOW&read=true&recipientId=3' 'admin-token'
    $adminBulkDeleteResult = $adminNotificationBulkDelete.Content | ConvertFrom-Json
    $adminNotificationCreateForDelete = Invoke-Edge 'POST' '/api/admin/notifications' 'admin-token' @{ recipientId = 1; actorId = 2; type = 'REVIEW_LIKED'; reviewId = 1 }
    $adminCreatedNotificationForDelete = $adminNotificationCreateForDelete.Content | ConvertFrom-Json
    $adminNotificationDelete = Invoke-Edge 'DELETE' "/api/admin/notifications/$($adminCreatedNotificationForDelete.id)" 'admin-token'
    $adminNotificationRows = Invoke-Postgres "SELECT (SELECT COUNT(*) FROM rewind.notifications WHERE id=$($adminCreatedNotification.id))||'|'||(SELECT COUNT(*) FROM rewind.notifications WHERE id=$($adminCreatedNotificationForDelete.id));" 'admin notification delete persistence'

    $adminConversation = Invoke-Edge 'POST' '/api/conversations' 'actor-token' @{ userId = 1 }
    $adminConversationValue = $adminConversation.Content | ConvertFrom-Json
    $adminConversationMessage = Invoke-Edge 'POST' "/api/conversations/$($adminConversationValue.id)/messages" 'actor-token' @{ body = 'admin aggregate fixture' }
    $adminConversationExpectedMessages = Invoke-Postgres "SELECT COUNT(*) FROM rewind.messages WHERE conversation_id=$($adminConversationValue.id);" 'admin conversation aggregate expected count'
    $adminConversationExpectedLastMessageAt = Invoke-Postgres "SELECT MAX(created_at)::text FROM rewind.messages WHERE conversation_id=$($adminConversationValue.id);" 'admin conversation aggregate expected timestamp'
    $adminConversationsUnauthenticated = Invoke-Edge 'GET' '/api/admin/conversations' ''
    $adminConversationsForbidden = Invoke-Edge 'GET' '/api/admin/conversations' 'owner-token'
    $adminConversationListResponse = Invoke-Edge 'GET' '/api/admin/conversations?page=0&size=100' 'admin-token'
    $adminConversationPage = $adminConversationListResponse.Content | ConvertFrom-Json
    $adminConversationItem = $adminConversationPage.content | Where-Object id -eq $adminConversationValue.id | Select-Object -First 1
    $adminConversationDelete = Invoke-Edge 'DELETE' "/api/admin/conversations/$($adminConversationValue.id)" 'admin-token'
    $adminConversationRowCount = Invoke-Postgres "SELECT (SELECT COUNT(*) FROM rewind.conversations WHERE id=$($adminConversationValue.id))||'|'||(SELECT COUNT(*) FROM rewind.messages WHERE conversation_id=$($adminConversationValue.id));" 'admin conversation cascade delete'
    $adminCommunicationAudit = Invoke-Postgres "SELECT COUNT(*) FROM rewind.admin_audit_logs WHERE admin_id=3 AND action IN ('NOTIFICATION_CREATED','NOTIFICATION_MARKED_READ','NOTIFICATION_MARKED_UNREAD','NOTIFICATIONS_MARKED_READ','NOTIFICATIONS_BULK_DELETED','NOTIFICATION_DELETED','CONVERSATION_DELETED');" 'admin communication audit events'
    $adminCommunicationBulkAudit = Invoke-Postgres "SELECT COUNT(*) FROM rewind.admin_audit_logs WHERE admin_id=3 AND action='NOTIFICATIONS_BULK_DELETED' AND target_id IS NULL AND metadata='count=1;type=FOLLOW;read=true;recipientId=3';" 'admin bulk notification audit detail'
    if ($adminNotificationUnauthenticated.StatusCode -ne 401 -or $adminNotificationForbidden.StatusCode -ne 403 -or
        $adminNotificationFilteredResponse.StatusCode -ne 200 -or $adminNotificationFiltered.totalElements -ne 1 -or $adminNotificationFiltered.content[0].type -ne 'REVIEW_LIKED' -or
        $adminNotificationCreate.StatusCode -ne 200 -or $adminCreatedNotification.recipientId -ne 3 -or $adminCreatedNotification.actorId -ne 2 -or
        $adminNotificationRead.StatusCode -ne 200 -or -not ($adminNotificationRead.Content | ConvertFrom-Json).readAt -or
        $adminNotificationUnread.StatusCode -ne 200 -or ($adminNotificationUnread.Content | ConvertFrom-Json).readAt -ne $null -or
        $adminNotificationReadAll.StatusCode -ne 200 -or $adminReadAllResult.updated -ne 1 -or
        $adminNotificationBulkDelete.StatusCode -ne 200 -or $adminBulkDeleteResult.deleted -ne 1 -or
        $adminNotificationCreateForDelete.StatusCode -ne 200 -or $adminNotificationDelete.StatusCode -ne 200 -or
        $adminNotificationReadAt -ne 'true' -or $adminNotificationRows -ne '0|0' -or
        $adminConversation.StatusCode -ne 200 -or $adminConversationMessage.StatusCode -ne 200 -or
        $adminConversationsUnauthenticated.StatusCode -ne 401 -or $adminConversationsForbidden.StatusCode -ne 403 -or
        $adminConversationListResponse.StatusCode -ne 200 -or $adminConversationItem.messageCount -ne [int]$adminConversationExpectedMessages -or
        ([DateTimeOffset]$adminConversationItem.lastMessageAt).ToUniversalTime().ToString('o') -ne ([DateTimeOffset]$adminConversationExpectedLastMessageAt).ToUniversalTime().ToString('o') -or
        $adminConversationDelete.StatusCode -ne 200 -or $adminConversationRowCount -ne '0|0' -or
        $adminCommunicationAudit -ne '8' -or $adminCommunicationBulkAudit -ne '1') {
        $edgeFailureLog = docker logs $functionName 2>&1
        throw "Admin communication flow failed: notificationFilter=$($adminNotificationFilteredResponse.Content); create=$($adminNotificationCreate.Content); read=$($adminNotificationRead.Content); unread=$($adminNotificationUnread.Content); readAll=$($adminNotificationReadAll.Content); bulkDelete=$($adminNotificationBulkDelete.Content); directDelete=$($adminNotificationDelete.StatusCode); notificationRows=$adminNotificationRows; conversation=$($adminConversation.Content); message=$($adminConversationMessage.Content); conversations=$($adminConversationListResponse.Content); conversationDelete=$($adminConversationDelete.StatusCode); cascade=$adminConversationRowCount; audit=$adminCommunicationAudit/$adminCommunicationBulkAudit`n$($edgeFailureLog -join "`n")"
    }

    $adminUsersUnauthenticated = Invoke-Edge 'GET' '/api/admin/users' ''
    $adminUsersForbidden = Invoke-Edge 'GET' '/api/admin/users' 'owner-token'
    $adminUserListResponse = Invoke-Edge 'GET' '/api/admin/users?q=REVIEW&page=0&size=2' 'admin-token'
    $adminUserList = $adminUserListResponse.Content | ConvertFrom-Json
    $adminUserDetail = Invoke-Edge 'GET' '/api/admin/users/1' 'admin-token'
    $adminUserOverviewResponse = Invoke-Edge 'GET' '/api/admin/users/1/overview' 'admin-token'
    $adminUserOverview = $adminUserOverviewResponse.Content | ConvertFrom-Json
    $adminUserExpectedStats = Invoke-Postgres @'
SELECT
 (SELECT COUNT(*) FROM rewind.list_items li JOIN rewind.lists l ON l.id=li.list_id WHERE l.user_id=1 AND l.list_type='WATCHED')
 || '|' || (SELECT COUNT(*) FROM rewind.reviews r WHERE r.user_id=1 AND r.is_hidden=FALSE)
 || '|' || (SELECT COUNT(*) FROM rewind.ratings r WHERE r.user_id=1)
 || '|' || (SELECT COUNT(*) FROM rewind.list_items li JOIN rewind.lists l ON l.id=li.list_id WHERE l.user_id=1 AND l.list_type='WATCHLIST')
 || '|' || (SELECT COUNT(*) FROM rewind.list_items li JOIN rewind.lists l ON l.id=li.list_id WHERE l.user_id=1 AND l.list_type='FAVORITES')
 || '|' || (SELECT COUNT(*) FROM rewind.comments c WHERE c.user_id=1)
 || '|' || (SELECT COUNT(*) FROM rewind.review_likes rl JOIN rewind.reviews r ON r.id=rl.review_id JOIN rewind.users liker ON liker.id=rl.user_id AND liker.is_active WHERE r.user_id=1 AND r.is_hidden=FALSE)
 || '|' || (SELECT COUNT(*) FROM rewind.lists l WHERE l.user_id=1 AND l.list_type='CUSTOM');
'@ 'admin user overview expected stats'
    $adminUserUpdate = Invoke-Edge 'PATCH' '/api/admin/users/1' 'admin-token' @{ displayName = 'Edited Owner'; avatarUrl = 'https://example.invalid/admin-user.png'; role = 'USER' }
    $adminUserInvalidRole = Invoke-Edge 'PATCH' '/api/admin/users/1' 'admin-token' @{ role = 'SUPERUSER' }
    $adminSelfDemotion = Invoke-Edge 'PATCH' '/api/admin/users/3' 'admin-token' @{ role = 'USER' }
    $adminUserDeactivate = Invoke-Edge 'POST' '/api/admin/users/1/deactivate' 'admin-token'
    $adminUserActivate = Invoke-Edge 'POST' '/api/admin/users/1/activate' 'admin-token'
    $adminUserHq = Invoke-Edge 'PUT' '/api/admin/users/1/hq' 'admin-token' @{ hq = $true }
    $adminUserMissing = Invoke-Edge 'GET' '/api/admin/users/999' 'admin-token'
    $adminUserPersistence = Invoke-Postgres "SELECT username||'|'||COALESCE(display_name,'NULL')||'|'||email||'|'||role||'|'||is_active::text||'|'||is_hq::text FROM rewind.users WHERE id=1;" 'admin user field persistence'
    $adminUserAudit = Invoke-Postgres "SELECT COUNT(*) FROM rewind.admin_audit_logs WHERE admin_id=3 AND target_type='USER' AND target_id=1 AND action IN ('USER_UPDATED','USER_DEACTIVATED','USER_ACTIVATED','HQ_GRANTED');" 'admin user audit events'
    $adminUserHistoryAudit = Invoke-Postgres "SELECT COUNT(*) FROM rewind.admin_audit_logs WHERE target_type='USER' AND target_id=1;" 'admin user profile history'
    if ($adminUsersUnauthenticated.StatusCode -ne 401 -or $adminUsersForbidden.StatusCode -ne 403 -or
        $adminUserListResponse.StatusCode -ne 200 -or $adminUserList.totalElements -ne 3 -or $adminUserList.content.Count -ne 2 -or
        $adminUserDetail.StatusCode -ne 200 -or ($adminUserDetail.Content | ConvertFrom-Json).email -ne 'owner@example.invalid' -or
        $adminUserOverviewResponse.StatusCode -ne 200 -or
        "$($adminUserOverview.stats.watched)|$($adminUserOverview.stats.reviews)|$($adminUserOverview.stats.ratings)|$($adminUserOverview.stats.watchlist)|$($adminUserOverview.stats.favorites)|$($adminUserOverview.stats.comments)|$($adminUserOverview.stats.likesReceived)|$($adminUserOverview.stats.customLists)" -ne $adminUserExpectedStats -or
        $adminUserUpdate.StatusCode -ne 200 -or $adminUserInvalidRole.StatusCode -ne 400 -or $adminSelfDemotion.StatusCode -ne 400 -or
        $adminUserDeactivate.StatusCode -ne 200 -or $adminUserActivate.StatusCode -ne 200 -or
        $adminUserHq.StatusCode -ne 200 -or $adminUserMissing.StatusCode -ne 404 -or
        $adminUserPersistence -ne 'review-owner|Edited Owner|owner@example.invalid|USER|true|true' -or
        $adminUserAudit -ne '4' -or $adminUserHistoryAudit -ne '4' -or $adminUserOverview.adminHistory.Count -ne 0) {
        $edgeFailureLog = docker logs $functionName 2>&1
        throw "Admin user flow failed: unauth=$($adminUsersUnauthenticated.StatusCode); regular=$($adminUsersForbidden.StatusCode); users=$($adminUserListResponse.Content); user=$($adminUserDetail.Content); overview=$($adminUserOverviewResponse.Content); expectedStats=$adminUserExpectedStats; update=$($adminUserUpdate.Content); invalidRole=$($adminUserInvalidRole.StatusCode); selfDemotion=$($adminSelfDemotion.StatusCode); active=$($adminUserDeactivate.StatusCode)/$($adminUserActivate.StatusCode); hq=$($adminUserHq.Content); missing=$($adminUserMissing.StatusCode); persistence=$adminUserPersistence; audit=$adminUserAudit/$adminUserHistoryAudit`n$($edgeFailureLog -join "`n")"
    }

    $adminListsUnauthenticated = Invoke-Edge 'GET' '/api/admin/lists' ''
    $adminListsForbidden = Invoke-Edge 'GET' '/api/admin/lists' 'owner-token'
    $adminListsResponse = Invoke-Edge 'GET' '/api/admin/lists?page=0&size=2' 'admin-token'
    $adminListsPage = $adminListsResponse.Content | ConvertFrom-Json
    $adminListHide = Invoke-Edge 'PUT' '/api/admin/lists/4/visibility?visible=false' 'admin-token'
    $adminListRepublish = Invoke-Edge 'PUT' '/api/admin/lists/4/visibility?visible=true' 'admin-token'
    $adminSystemListDelete = Invoke-Edge 'DELETE' '/api/admin/lists/1' 'admin-token'
    $adminCustomListDelete = Invoke-Edge 'DELETE' '/api/admin/lists/5' 'admin-token'
    $adminListDeleteState = Invoke-Postgres "SELECT (SELECT COUNT(*) FROM rewind.lists WHERE id=5)::text||'|'||(SELECT COUNT(*) FROM rewind.list_items WHERE list_id=5)::text||'|'||(SELECT COUNT(*) FROM rewind.lists WHERE id=1)::text;" 'admin list delete cascade and system guard'
    $adminListAudit = Invoke-Postgres "SELECT COUNT(*) FROM rewind.admin_audit_logs WHERE admin_id=3 AND target_type='LIST' AND target_id IN (4,5) AND action IN ('LIST_PUBLISHED','LIST_HIDDEN','LIST_DELETED');" 'admin list audit events'
    if ($adminListsUnauthenticated.StatusCode -ne 401 -or $adminListsForbidden.StatusCode -ne 403 -or
        $adminListsResponse.StatusCode -ne 200 -or $adminListsPage.totalElements -ne 5 -or $adminListsPage.content.Count -ne 2 -or
        $adminListHide.StatusCode -ne 200 -or ($adminListHide.Content | ConvertFrom-Json).isPublic -ne $false -or
        $adminListRepublish.StatusCode -ne 200 -or ($adminListRepublish.Content | ConvertFrom-Json).itemCount -ne 1 -or
        $adminSystemListDelete.StatusCode -ne 400 -or $adminCustomListDelete.StatusCode -ne 204 -or
        $adminListDeleteState -ne '0|0|1' -or $adminListAudit -ne '3') {
        $edgeFailureLog = docker logs $functionName 2>&1
        throw "Admin list flow failed: unauth=$($adminListsUnauthenticated.StatusCode); regular=$($adminListsForbidden.StatusCode); list=$($adminListsResponse.Content); hide=$($adminListHide.Content); publish=$($adminListRepublish.Content); systemDelete=$($adminSystemListDelete.StatusCode); customDelete=$($adminCustomListDelete.StatusCode); rows=$adminListDeleteState; audit=$adminListAudit`n$($edgeFailureLog -join "`n")"
    }

    $adminMoviesUnauthenticated = Invoke-Edge 'GET' '/api/admin/movies' ''
    $adminMoviesForbidden = Invoke-Edge 'GET' '/api/admin/movies' 'owner-token'
    $adminTmdbQualityResponse = Invoke-Edge 'GET' '/api/admin/movies/tmdb-quality' 'admin-token'
    $adminTmdbQuality = $adminTmdbQualityResponse.Content | ConvertFrom-Json
    $adminTmdbExpected = Invoke-Postgres "SELECT COUNT(*)::text||'|'||COUNT(*) FILTER (WHERE tmdb_id IS NOT NULL)::text FROM rewind.movies;" 'admin TMDB quality totals'
    $adminMoviesPageResponse = Invoke-Edge 'GET' '/api/admin/movies?page=0&size=2' 'admin-token'
    $adminMoviesPage = $adminMoviesPageResponse.Content | ConvertFrom-Json
    $adminMovieInvalid = Invoke-Edge 'POST' '/api/admin/movies' 'admin-token' @{ title = ' ' }
    $adminMovieCreate = Invoke-Edge 'POST' '/api/admin/movies' 'admin-token' @{
        title = 'Edge Admin Fixture'; imdbId = 'tt9999001'; durationMinutes = 101; releaseDate = '2024-02-29';
        ageRating = 'PG-13'; rating = 8.5; shortPlot = 'Created in disposable rehearsal'; photoUrl = 'https://example.invalid/poster.jpg'
    }
    $adminMovie = $adminMovieCreate.Content | ConvertFrom-Json
    $adminMovieSearchResponse = Invoke-Edge 'GET' '/api/admin/movies?q=Edge%20Admin%20Fixture&page=0&size=10' 'admin-token'
    $adminMovieSearch = $adminMovieSearchResponse.Content | ConvertFrom-Json
    $adminMovieInvalidUpdate = Invoke-Edge 'PUT' "/api/admin/movies/$($adminMovie.id)" 'admin-token' @{ trailerUrl = 'javascript:alert(1)' }
    $adminMovieUpdate = Invoke-Edge 'PUT' "/api/admin/movies/$($adminMovie.id)" 'admin-token' @{ title = 'Updated Edge Admin Fixture'; rating = 9.1; role = 'ADMIN' }
    $adminMovieDelete = Invoke-Edge 'DELETE' "/api/admin/movies/$($adminMovie.id)" 'admin-token'
    $adminMovieDeleteAgain = Invoke-Edge 'DELETE' "/api/admin/movies/$($adminMovie.id)" 'admin-token'
    $adminMovieCount = Invoke-Postgres 'SELECT COUNT(*) FROM rewind.movies;' 'admin movie CRUD leaves seeded catalog count intact'
    if ($adminMoviesUnauthenticated.StatusCode -ne 401 -or $adminMoviesForbidden.StatusCode -ne 403 -or
        $adminTmdbQualityResponse.StatusCode -ne 200 -or "$($adminTmdbQuality.totalMovies)|$($adminTmdbQuality.tmdbLinkedMovies)" -ne $adminTmdbExpected -or
        $adminMoviesPageResponse.StatusCode -ne 200 -or $adminMoviesPage.totalElements -ne 50 -or $adminMoviesPage.content.Count -ne 2 -or
        $adminMovieInvalid.StatusCode -ne 400 -or $adminMovieCreate.StatusCode -ne 200 -or $adminMovie.title -ne 'Edge Admin Fixture' -or $adminMovie.tmdbId -ne $null -or
        $adminMovieSearchResponse.StatusCode -ne 200 -or $adminMovieSearch.totalElements -ne 1 -or
        $adminMovieInvalidUpdate.StatusCode -ne 400 -or $adminMovieUpdate.StatusCode -ne 200 -or ($adminMovieUpdate.Content | ConvertFrom-Json).title -ne 'Updated Edge Admin Fixture' -or
        $adminMovieDelete.StatusCode -ne 204 -or $adminMovieDeleteAgain.StatusCode -ne 404 -or $adminMovieCount -ne '50') {
        $edgeFailureLog = docker logs $functionName 2>&1
        throw "Admin movie CRUD flow failed: auth=$($adminMoviesUnauthenticated.StatusCode)/$($adminMoviesForbidden.StatusCode); page=$($adminMoviesPageResponse.Content); invalid=$($adminMovieInvalid.StatusCode); create=$($adminMovieCreate.Content); search=$($adminMovieSearchResponse.Content); badUpdate=$($adminMovieInvalidUpdate.StatusCode); update=$($adminMovieUpdate.Content); delete=$($adminMovieDelete.StatusCode)/$($adminMovieDeleteAgain.StatusCode); count=$adminMovieCount`n$($edgeFailureLog -join "`n")"
    }

    $tmdbImportOneResponse = Invoke-Edge 'POST' '/api/admin/movies/tmdb-import' 'admin-token' @{ tmdbIds = @(900001) }
    $tmdbImportOne = $tmdbImportOneResponse.Content | ConvertFrom-Json
    $tmdbImportTwoResponse = Invoke-Edge 'POST' '/api/admin/movies/tmdb-import' 'admin-token' @{ tmdbIds = @(900002) }
    $tmdbImportTwo = $tmdbImportTwoResponse.Content | ConvertFrom-Json
    $tmdbSyncResponse = Invoke-Edge 'POST' "/api/admin/movies/$($tmdbImportTwo.items[0].movieId)/tmdb-sync" 'admin-token' @{ tmdbId = 900002; syncSimilar = $true }
    $tmdbSync = $tmdbSyncResponse.Content | ConvertFrom-Json
    $tmdbDiscoverResponse = Invoke-Edge 'POST' '/api/admin/movies/tmdb-import/discover' 'admin-token' @{ page = 1; year = 2024; genreId = 880001; minRating = 6.5; limit = 2 }
    $tmdbDiscover = $tmdbDiscoverResponse.Content | ConvertFrom-Json
    $tmdbPersisted = Invoke-Postgres "SELECT (SELECT COUNT(*) FROM rewind.movie_genres mg JOIN rewind.movies m ON m.id=mg.movie_id WHERE m.tmdb_id=900002)::text||'|'||(SELECT COUNT(*) FROM rewind.movie_actors ma JOIN rewind.movies m ON m.id=ma.movie_id WHERE m.tmdb_id=900002)::text||'|'||(SELECT COUNT(*) FROM rewind.movie_directors md JOIN rewind.movies m ON m.id=md.movie_id WHERE m.tmdb_id=900002)::text||'|'||(SELECT COUNT(*) FROM rewind.movie_producers mp JOIN rewind.movies m ON m.id=mp.movie_id WHERE m.tmdb_id=900002)::text||'|'||(SELECT COUNT(*) FROM rewind.external_ratings er JOIN rewind.movies m ON m.id=er.movie_id WHERE m.tmdb_id=900002 AND er.source='TMDB')::text||'|'||(SELECT COUNT(*) FROM rewind.similar_movies sm JOIN rewind.movies m ON m.id=sm.movie_id WHERE m.tmdb_id=900002)::text" 'TMDB sync relation persistence'
    $tmdbCreatedOneId = [int]$tmdbImportOne.items[0].movieId
    $tmdbCreatedTwoId = [int]$tmdbImportTwo.items[0].movieId
    $tmdbCreatedThreeId = [int]$tmdbDiscover.imports.items[0].movieId
    $tmdbDeleteOne = Invoke-Edge 'DELETE' "/api/admin/movies/$tmdbCreatedOneId" 'admin-token'
    $tmdbDeleteTwo = Invoke-Edge 'DELETE' "/api/admin/movies/$tmdbCreatedTwoId" 'admin-token'
    $tmdbDeleteThree = Invoke-Edge 'DELETE' "/api/admin/movies/$tmdbCreatedThreeId" 'admin-token'
    $tmdbMovieCountAfterCleanup = Invoke-Postgres 'SELECT COUNT(*) FROM rewind.movies;' 'TMDB fixture cleanup'
    if ($tmdbImportOneResponse.StatusCode -ne 200 -or $tmdbImportOne.items[0].status -ne 'IMPORTED' -or
        $tmdbImportTwoResponse.StatusCode -ne 200 -or $tmdbImportTwo.items[0].status -ne 'IMPORTED' -or
        $tmdbSyncResponse.StatusCode -ne 200 -or $tmdbSync.tmdbId -ne 900002 -or $tmdbSync.actorsUpdated -ne 1 -or
        $tmdbDiscoverResponse.StatusCode -ne 200 -or $tmdbDiscover.discovered -ne 1 -or $tmdbDiscover.imports.succeeded -ne 1 -or
        $tmdbPersisted -ne '1|1|1|1|1|1' -or $tmdbDeleteOne.StatusCode -ne 204 -or $tmdbDeleteTwo.StatusCode -ne 204 -or
        $tmdbDeleteThree.StatusCode -ne 204 -or $tmdbMovieCountAfterCleanup -ne '50') {
        $edgeFailureLog = docker logs $functionName 2>&1
        throw "TMDB integration failed: import=$($tmdbImportOneResponse.StatusCode)/$($tmdbImportOneResponse.Content); second=$($tmdbImportTwoResponse.StatusCode)/$($tmdbImportTwoResponse.Content); sync=$($tmdbSyncResponse.StatusCode)/$($tmdbSyncResponse.Content); discover=$($tmdbDiscoverResponse.StatusCode)/$($tmdbDiscoverResponse.Content); links=$tmdbPersisted; cleanup=$tmdbMovieCountAfterCleanup`n$($edgeFailureLog -join "`n")"
    }

    $dashboardAdmin = Invoke-Edge 'GET' '/api/admin/dashboard' 'admin-token'
    $dashboardRegular = Invoke-Edge 'GET' '/api/admin/dashboard' 'owner-token'
    $dashboardUnauthenticated = Invoke-Edge 'GET' '/api/admin/dashboard' ''
    $dashboardActual = $dashboardAdmin.Content | ConvertFrom-Json
    $dashboardExpected = Invoke-Postgres "SELECT (SELECT COUNT(*) FROM rewind.users)::text||'|'||(SELECT COUNT(*) FROM rewind.users WHERE is_active)::text||'|'||(SELECT COUNT(*) FROM rewind.users WHERE is_hq)::text||'|'||(SELECT COUNT(*) FROM rewind.movies)::text||'|'||(SELECT COUNT(*) FROM rewind.reviews)::text||'|'||(SELECT COUNT(*) FROM rewind.reviews WHERE is_hidden)::text;" 'admin dashboard expected counts'
    $dashboardObserved = "$($dashboardActual.users)|$($dashboardActual.activeUsers)|$($dashboardActual.hqUsers)|$($dashboardActual.movies)|$($dashboardActual.reviews)|$($dashboardActual.hiddenReviews)"
    $adminSettingsInitial = Invoke-Edge 'GET' '/api/admin/settings' 'admin-token'
    $adminSettingsList = $adminSettingsInitial.Content | ConvertFrom-Json
    $adminSettingInvalid = Invoke-Edge 'PUT' '/api/admin/settings/maintenance_mode' 'admin-token' @{ value = 'sometimes' }
    $adminSettingUpdate = Invoke-Edge 'PUT' '/api/admin/settings/default_locale' 'admin-token' @{ value = 'en' }
    $adminSettingAfter = Invoke-Edge 'GET' '/api/admin/settings' 'admin-token'
    $adminSettingsForbidden = Invoke-Edge 'GET' '/api/admin/settings' 'owner-token'
    $adminSettingsUnauthenticated = Invoke-Edge 'GET' '/api/admin/settings' ''
    $adminAuditResponse = Invoke-Edge 'GET' '/api/admin/audit-logs?page=0&size=10' 'admin-token'
    $adminAuditPage = $adminAuditResponse.Content | ConvertFrom-Json
    $adminSettingAudit = Invoke-Postgres "SELECT COUNT(*) FROM rewind.admin_audit_logs WHERE admin_id=3 AND action='SITE_SETTING_UPDATED' AND target_type='SITE_SETTING' AND metadata='default_locale';" 'site setting audit event'
    if ($dashboardAdmin.StatusCode -ne 200 -or $dashboardObserved -ne $dashboardExpected -or $dashboardRegular.StatusCode -ne 403 -or $dashboardUnauthenticated.StatusCode -ne 401 -or
        $adminSettingsInitial.StatusCode -ne 200 -or $adminSettingsList.Count -ne 4 -or $adminSettingsList[0].key -ne 'default_locale' -or
        $adminSettingInvalid.StatusCode -ne 400 -or $adminSettingUpdate.StatusCode -ne 200 -or ($adminSettingUpdate.Content | ConvertFrom-Json).updatedBy -ne 3 -or
        $adminSettingsForbidden.StatusCode -ne 403 -or $adminSettingsUnauthenticated.StatusCode -ne 401 -or
        $adminAuditResponse.StatusCode -ne 200 -or $adminAuditPage.content[0].metadata -ne 'default_locale' -or $adminSettingAudit -ne '1' -or
        -not ($adminSettingAfter.Content | ConvertFrom-Json | Where-Object { $_.key -eq 'default_locale' -and $_.value -eq 'en' })) {
        $edgeFailureLog = docker logs $functionName 2>&1
        throw "Admin dashboard/settings/audit flow failed: dashboard=$dashboardObserved/$dashboardExpected; auth=$($dashboardUnauthenticated.StatusCode)/$($dashboardRegular.StatusCode); settings=$($adminSettingsInitial.Content); invalid=$($adminSettingInvalid.StatusCode); update=$($adminSettingUpdate.Content); settingsAuth=$($adminSettingsUnauthenticated.StatusCode)/$($adminSettingsForbidden.StatusCode); audit=$($adminAuditResponse.Content); auditRows=$adminSettingAudit`n$($edgeFailureLog -join "`n")"
    }
    Invoke-Postgres "UPDATE rewind.site_settings SET setting_value='uk', updated_by=NULL WHERE setting_key='default_locale';" 'reset test locale setting' | Out-Null

    Invoke-Postgres @'
INSERT INTO rewind.users(username,email,password_hash,supabase_user_id)
VALUES ('review-delete','delete@example.invalid','!supabase-managed!','44444444-4444-4444-8444-444444444444');
INSERT INTO rewind.ratings(user_id,movie_id,rating)
SELECT id,5,4 FROM rewind.users WHERE supabase_user_id='44444444-4444-4444-8444-444444444444';
INSERT INTO rewind.reviews(user_id,movie_id,content,rating)
SELECT id,5,'Disposable account deletion review',4 FROM rewind.users WHERE supabase_user_id='44444444-4444-4444-8444-444444444444';
INSERT INTO rewind.lists(user_id,name,list_type,is_public)
SELECT id,'Disposable deletion list','CUSTOM',FALSE FROM rewind.users WHERE supabase_user_id='44444444-4444-4444-8444-444444444444';
INSERT INTO rewind.list_items(list_id,movie_id,position)
SELECT l.id,5,1 FROM rewind.lists l JOIN rewind.users u ON u.id=l.user_id
WHERE u.supabase_user_id='44444444-4444-4444-8444-444444444444' AND l.name='Disposable deletion list';
'@ 'account deletion fixture with owned data' | Out-Null
    $deleteWrongPassword = Invoke-Edge 'DELETE' '/api/profile/me' 'delete-token' @{ currentPassword = 'incorrect-password' }
    $deleteProfileResponse = Invoke-Edge 'DELETE' '/api/profile/me' 'delete-token' @{ currentPassword = 'delete-current-password' }
    $deleteIdentityCleanup = Invoke-Postgres @'
SELECT (SELECT COUNT(*) FROM rewind.users WHERE supabase_user_id='44444444-4444-4444-8444-444444444444')::text
  || '|' || (SELECT COUNT(*) FROM rewind.supabase_identity_deletion_outbox WHERE supabase_user_id='44444444-4444-4444-8444-444444444444')::text
  || '|' || (SELECT COUNT(*) FROM rewind.ratings r JOIN rewind.users u ON u.id=r.user_id WHERE u.supabase_user_id='44444444-4444-4444-8444-444444444444')::text
  || '|' || (SELECT COUNT(*) FROM rewind.reviews r JOIN rewind.users u ON u.id=r.user_id WHERE u.supabase_user_id='44444444-4444-4444-8444-444444444444')::text
  || '|' || (SELECT COUNT(*) FROM rewind.lists l JOIN rewind.users u ON u.id=l.user_id WHERE u.supabase_user_id='44444444-4444-4444-8444-444444444444')::text
  || '|' || (SELECT COUNT(*) FROM rewind.list_items i JOIN rewind.lists l ON l.id=i.list_id JOIN rewind.users u ON u.id=l.user_id WHERE u.supabase_user_id='44444444-4444-4444-8444-444444444444');
'@ 'account deletion identity, outbox, and owned-data cleanup'
    if ($deleteWrongPassword.StatusCode -ne 400 -or $deleteProfileResponse.StatusCode -ne 204 -or $deleteIdentityCleanup -ne '0|0|0|0|0|0') {
        $edgeFailureLog = docker logs $functionName 2>&1
        throw "Account deletion/password confirmation/outbox cleanup failed: wrong=$($deleteWrongPassword.StatusCode); delete=$($deleteProfileResponse.StatusCode); db=$deleteIdentityCleanup`n$($edgeFailureLog -join "`n")"
    }

    Invoke-Postgres "UPDATE rewind.users SET is_active=FALSE WHERE id=1;" 'deactivate disposable owner for auth guard' | Out-Null
    $inactiveAccount = Invoke-Edge 'GET' '/api/users/me' 'owner-token'
    Invoke-Postgres "UPDATE rewind.users SET is_active=TRUE WHERE id=1;" 'restore disposable owner after auth guard' | Out-Null
    if ($inactiveAccount.StatusCode -ne 403) {
        $edgeFailureLog = docker logs $functionName 2>&1
        throw "Inactive linked profile was not denied by GET /api/users/me: status=$($inactiveAccount.StatusCode); body=$($inactiveAccount.Content)`n$($edgeFailureLog -join "`n")"
    }

    Write-Output 'Local Deno Edge API completed global search, confirmed-password account deletion/outbox cleanup, inactive-account rejection, admin dashboard/settings/audit/lists/users/movies/TMDB sync-import-discovery, communication and review/comment moderation, admin journal, public journal, newsletter, review, social profile, notifications, conversations, messages, follow/block, activity, likes/comments, ownership, and public-user HTTP flows against PostgreSQL 17 with local Auth/TMDB mocks.'

    $publicBoundary = Invoke-Postgres @'
SELECT has_schema_privilege('anon','rewind','USAGE')
  || '|' || has_table_privilege('anon','rewind.reviews','SELECT')
  || '|' || has_schema_privilege('authenticated','rewind','USAGE')
  || '|' || has_table_privilege('authenticated','rewind.comments','INSERT');
'@ 'Supabase Data API boundary check'
    if ($publicBoundary -ne 'false|false|false|false') {
        throw "Browser Data API roles unexpectedly access private review tables: $publicBoundary"
    }

    Write-Output 'Supabase catalogue, profile, review, social, notification, message, journal, and newsletter migrations applied on disposable PostgreSQL 17.'
    Write-Output 'Owner isolation, hidden rows, public profile/journal reads, newsletter subscription ownership, social links, follow notification preferences/idempotency, notification recipient scope, private conversations, message read receipts, bidirectional block cleanup, likes, TMDB genre/cast/crew/rating/similar persistence and cleanup, and Data API denial passed.'
} finally {
    if ($startedFunction) { docker rm -f $functionName *> $null }
    if ($startedAuthMock) { docker rm -f $authMockName *> $null }
    if ($startedPostgres) { docker rm -f $postgresName *> $null }
    if ($createdNetwork) { docker network rm $networkName *> $null }
    if (Test-Path -LiteralPath $authMockPath) { Remove-Item -LiteralPath $authMockPath -Force }
}
