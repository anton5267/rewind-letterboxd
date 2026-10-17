param([string]$BaseUrl = 'http://localhost:8080')

$ErrorActionPreference = 'Stop'
$suffix = [guid]::NewGuid().ToString('N').Substring(0, 12)
$email = "verify-$suffix@example.invalid"
$password = 'VerificationPass123!'
$headers = @{}
$webSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession

function Send([string]$Method, [string]$Path, $Body = $null) {
    if ($Method -notin @('GET', 'HEAD', 'OPTIONS')) {
        $csrfCookie = $webSession.Cookies.GetCookies([uri]"$BaseUrl/api$Path") | Where-Object Name -eq 'XSRF-TOKEN'
        if ($csrfCookie) { $headers['X-XSRF-TOKEN'] = $csrfCookie.Value }
    }
    $args = @{ Method = $Method; Uri = "$BaseUrl/api$Path"; Headers = $headers; WebSession = $webSession; UseBasicParsing = $true }
    if ($null -ne $Body) {
        $args.ContentType = 'application/json'
        $args.Body = ($Body | ConvertTo-Json -Compress)
    }
    return Invoke-WebRequest @args
}

function Expect([int]$Actual, [int]$Wanted, [string]$Step) {
    if ($Actual -ne $Wanted) { throw "$Step returned HTTP $Actual (expected $Wanted)" }
    Write-Output "$Step : $Actual"
}

$null = Send 'GET' '/auth/csrf'
try {
    $null = Invoke-WebRequest -Method POST -Uri "$BaseUrl/api/auth/login" -WebSession $webSession -ContentType 'application/json' -Body (@{ email = $email; password = $password } | ConvertTo-Json -Compress) -UseBasicParsing
    throw 'Login without CSRF header was accepted'
} catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 403) { throw }
    Write-Output 'missing CSRF header : 403'
}
$registered = Send 'POST' '/auth/register' @{ username = "verify$suffix"; email = $email; password = $password }
Expect $registered.StatusCode 200 'register'
$userId = ($registered.Content | ConvertFrom-Json).id
$publicUser = (Send 'GET' "/users/$userId").Content | ConvertFrom-Json
if ($null -ne $publicUser.email) { throw 'Public user endpoint exposed email' }
Write-Output 'public profile omits email'
$filmResponse = Send 'GET' '/movies/1/details'
Expect $filmResponse.StatusCode 200 'public film details'
$film = $filmResponse.Content | ConvertFrom-Json
$genresResponse = Send 'GET' '/genres'
Expect $genresResponse.StatusCode 200 'public genres'
if (($genresResponse.Content | ConvertFrom-Json).Count -lt 1) { throw 'Genre catalog is empty' }
$pageOne = (Send 'GET' '/movies/search?page=0&size=12&sort=newest').Content | ConvertFrom-Json
$pageTwo = (Send 'GET' '/movies/search?page=1&size=12&sort=newest').Content | ConvertFrom-Json
if ($pageOne.content.Count -gt 12 -or $pageTwo.number -ne 1) { throw 'Movie pagination is broken' }
$filmTitle = [uri]::EscapeDataString($film.title)
$filmYear = $film.releaseDate.Substring(0, 4)
$filmGenre = $film.genres[0].id
$filtered = (Send 'GET' "/movies/search?q=$filmTitle&genreId=$filmGenre&year=$filmYear&size=12").Content | ConvertFrom-Json
if ($filtered.content.id -notcontains 1) { throw 'Movie title, genre and year filters did not find film 1' }
Write-Output 'catalog search, genre, year and pagination passed'
$loggedIn = Send 'POST' '/auth/login' @{ email = $email; password = $password }
Expect $loggedIn.StatusCode 200 'login'
if (($loggedIn.Content | ConvertFrom-Json).PSObject.Properties.Name -contains 'token') { throw 'Login response exposed access token' }
$cookies = $webSession.Cookies.GetCookies([uri]"$BaseUrl/api/auth/refresh")
foreach ($name in @('rewind_access', 'rewind_refresh')) {
    $found = $cookies | Where-Object Name -eq $name
    if (-not $found -or -not $found.HttpOnly) { throw "$name is missing or not HttpOnly" }
}
$null = Send 'GET' '/auth/csrf'
Expect (Send 'GET' '/users/me').StatusCode 200 'cookie authentication'
$oldRefresh = ($webSession.Cookies.GetCookies([uri]"$BaseUrl/api/auth/refresh") | Where-Object Name -eq 'rewind_refresh').Value
Expect (Send 'POST' '/auth/refresh').StatusCode 204 'refresh session'
$newRefresh = ($webSession.Cookies.GetCookies([uri]"$BaseUrl/api/auth/refresh") | Where-Object Name -eq 'rewind_refresh').Value
if (-not $newRefresh -or $newRefresh -eq $oldRefresh) { throw 'Refresh token did not rotate' }
Write-Output 'refresh token rotated'

$list = Send 'POST' '/lists' @{ name = 'Verification list'; isPublic = $true }
Expect $list.StatusCode 200 'create list'
$listId = ($list.Content | ConvertFrom-Json).id
$publicLists = (Send 'GET' '/lists/public?size=20').Content | ConvertFrom-Json
if ($publicLists.content.id -notcontains $listId) { throw 'Public list did not appear in public feed' }
Write-Output 'public list feed'
Expect (Send 'POST' "/lists/$listId/items" @{ movieId = 1 }).StatusCode 200 'add item'
Expect (Send 'POST' '/movies/1/watchlist').StatusCode 200 'add watchlist'
Expect (Send 'DELETE' '/movies/1/watchlist').StatusCode 204 'remove watchlist'
Expect (Send 'PUT' '/movies/1/rating' @{ rating = 4 }).StatusCode 200 'rate film'
$review = Send 'POST' '/movies/1/reviews' @{ content = 'Verification review'; rating = 5 }
Expect $review.StatusCode 200 'create review'
$reviewId = ($review.Content | ConvertFrom-Json).id
$recentReviews = (Send 'GET' '/reviews/recent?size=20').Content | ConvertFrom-Json
if ($recentReviews.content.id -notcontains $reviewId) { throw 'Review did not appear in recent feed' }
Write-Output 'recent review feed'
Expect (Send 'GET' '/movies/1/reviews/me').StatusCode 200 'my review'

try {
    $null = Send 'POST' '/movies/1/reviews' @{ content = 'Duplicate'; rating = 4 }
    throw 'Duplicate review was unexpectedly accepted'
} catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 409) { throw }
    Write-Output 'duplicate review : 409'
}

$updatedReview = Send 'PATCH' "/reviews/$reviewId" @{ content = 'Edited verification review'; rating = 4 }
Expect $updatedReview.StatusCode 200 'edit review'
if (($updatedReview.Content | ConvertFrom-Json).content -ne 'Edited verification review') { throw 'Review text did not update' }
$updatedRating = (Send 'GET' '/movies/1/rating/me').Content | ConvertFrom-Json
if ($updatedRating.rating -ne 4) { throw 'Review edit did not update rating' }

Expect (Send 'DELETE' "/reviews/$reviewId").StatusCode 204 'delete review'
Expect (Send 'GET' '/movies/1/reviews/me').StatusCode 204 'my review removed'
$savedRating = (Send 'GET' '/movies/1/rating/me').Content | ConvertFrom-Json
if ($savedRating.rating -ne 4) { throw 'Deleting a review unexpectedly removed its rating' }
Write-Output 'rating remains after review deletion : 4'
Expect (Send 'DELETE' '/movies/1/rating').StatusCode 204 'delete rating'
Expect (Send 'DELETE' "/lists/$listId/items/1").StatusCode 204 'remove item'

$replaySession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$null = Invoke-WebRequest -Method GET -Uri "$BaseUrl/api/auth/csrf" -WebSession $replaySession -UseBasicParsing
$replayCsrf = $replaySession.Cookies.GetCookies([uri]"$BaseUrl/api/auth/refresh") | Where-Object Name -eq 'XSRF-TOKEN'
$replaySession.Cookies.Add([uri]"$BaseUrl/api/auth/refresh", [System.Net.Cookie]::new('rewind_refresh', $oldRefresh, '/api/auth', ([uri]$BaseUrl).Host))
try {
    $null = Invoke-WebRequest -Method POST -Uri "$BaseUrl/api/auth/refresh" -Headers @{ 'X-XSRF-TOKEN' = $replayCsrf.Value } -WebSession $replaySession -UseBasicParsing
    throw 'Replayed refresh token was accepted'
} catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 401) { throw }
    Write-Output 'replayed refresh token : 401'
}
try {
    $null = Send 'POST' '/auth/refresh'
    throw 'Session family survived refresh replay'
} catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 401) { throw }
    Write-Output 'refresh family revoked after replay : 401'
}

Expect (Send 'POST' '/auth/login' @{ email = $email; password = $password }).StatusCode 200 'new login after replay'
Expect (Send 'POST' '/auth/logout').StatusCode 204 'logout'
try {
    $null = Send 'POST' '/auth/refresh'
    throw 'Refresh succeeded after logout'
} catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 401) { throw }
    Write-Output 'refresh after logout : 401'
}
Write-Output 'HTTP core flow passed.'
