param([string]$BaseUrl = 'http://localhost:8080')

$ErrorActionPreference = 'Stop'
$suffix = [guid]::NewGuid().ToString('N').Substring(0, 12)
$email = "verify-$suffix@example.invalid"
$networkEmail = "network-$suffix@example.invalid"
$password = 'VerificationPass123!'
$headers = @{}
$webSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$networkHeaders = @{}
$networkSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession

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

function SendNetwork([string]$Method, [string]$Path, $Body = $null) {
    if ($Method -notin @('GET', 'HEAD', 'OPTIONS')) {
        $csrfCookie = $networkSession.Cookies.GetCookies([uri]"$BaseUrl/api$Path") | Where-Object Name -eq 'XSRF-TOKEN'
        if ($csrfCookie) { $networkHeaders['X-XSRF-TOKEN'] = $csrfCookie.Value }
    }
    $args = @{ Method = $Method; Uri = "$BaseUrl/api$Path"; Headers = $networkHeaders; WebSession = $networkSession; UseBasicParsing = $true }
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

try {
    $null = Invoke-WebRequest -Method POST -Uri "$BaseUrl/api/auth/register" -WebSession $webSession -Headers @{ 'X-XSRF-TOKEN' = ($webSession.Cookies.GetCookies([uri]"$BaseUrl/api/auth/register") | Where-Object Name -eq 'XSRF-TOKEN').Value } -ContentType 'application/json' -Body '{}' -UseBasicParsing
    throw 'Invalid registration was unexpectedly accepted'
} catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 400) { throw }
    $errorBody = $_.ErrorDetails.Message
    if ([string]::IsNullOrWhiteSpace($errorBody)) { $errorBody = $_.Exception.Response.GetResponseStream() | ForEach-Object { (New-Object IO.StreamReader($_)).ReadToEnd() } }
    $errorJson = $errorBody | ConvertFrom-Json
    foreach ($field in @('timestamp', 'status', 'error', 'message', 'path')) {
        if (-not ($errorJson.PSObject.Properties.Name -contains $field)) { throw "Validation error response is missing '$field'" }
    }
    if ($errorJson.status -ne 400) { throw "Validation error body reported status $($errorJson.status)" }
    Write-Output 'validation error contract : 400'
}

try {
    $null = Invoke-WebRequest -Method GET -Uri "$BaseUrl/api/movies/999999/details" -UseBasicParsing
    throw 'Missing movie was unexpectedly returned'
} catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 404) { throw }
    $errorBody = $_.ErrorDetails.Message
    if ([string]::IsNullOrWhiteSpace($errorBody)) { $errorBody = $_.Exception.Response.GetResponseStream() | ForEach-Object { (New-Object IO.StreamReader($_)).ReadToEnd() } }
    $errorJson = $errorBody | ConvertFrom-Json
    if ($errorJson.status -ne 404 -or [string]::IsNullOrWhiteSpace($errorJson.path)) { throw 'Not-found error response contract is malformed' }
    Write-Output 'not-found error contract : 404'
}

$registered = Send 'POST' '/auth/register' @{ username = "verify$suffix"; email = $email; password = $password }
Expect $registered.StatusCode 200 'register'
$userId = ($registered.Content | ConvertFrom-Json).id
$networkUser = Send 'POST' '/auth/register' @{ username = "network$suffix"; email = $networkEmail; password = $password }
Expect $networkUser.StatusCode 200 'register network user'
$networkUserId = ($networkUser.Content | ConvertFrom-Json).id
$publicUser = (Send 'GET' "/users/$userId").Content | ConvertFrom-Json
if ($null -ne $publicUser.email) { throw 'Public user endpoint exposed email' }
Write-Output 'public profile omits email'
$publicProfile = (Send 'GET' "/users/$userId/profile").Content | ConvertFrom-Json
if ($null -ne $publicProfile.email -or $publicProfile.username -ne "verify$suffix") { throw 'Public profile exposed private data or had incorrect identity' }
Write-Output 'public profile detail omits private fields'
$filmResponse = Send 'GET' '/movies/1/details'
Expect $filmResponse.StatusCode 200 'public film details'
$film = $filmResponse.Content | ConvertFrom-Json
if (($film.similarMovies | Where-Object { $_.id -eq $film.id }).Count -gt 0) { throw 'Movie was returned as similar to itself' }
if ($film.similarMovies.Count -lt 1) { throw 'Genre similarity fallback returned no films' }
Write-Output 'similar films fallback'
$genresResponse = Send 'GET' '/genres'
Expect $genresResponse.StatusCode 200 'public genres'
if (($genresResponse.Content | ConvertFrom-Json).Count -lt 1) { throw 'Genre catalog is empty' }
Expect (Send 'GET' '/actors/1?sort=newest').StatusCode 200 'actor filmography'
Expect (Send 'GET' '/directors/1?sort=rating').StatusCode 200 'director filmography'
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
$myProfile = (Send 'GET' '/profile/me').Content | ConvertFrom-Json
if ($null -eq $myProfile.stats -or $myProfile.stats.ratings -ne 0 -or $myProfile.stats.reviews -ne 0) { throw 'Profile statistics contract is missing or incorrect' }
Write-Output 'profile statistics'
Expect (Send 'GET' '/newsletter/subscription').StatusCode 200 'newsletter subscription read'
$newsletterEnabled = Send 'PUT' '/newsletter/subscription' @{ subscribed = $true }
Expect $newsletterEnabled.StatusCode 200 'newsletter subscription opt-in'
if (-not ($newsletterEnabled.Content | ConvertFrom-Json).subscribed) { throw 'Newsletter opt-in did not enable subscription' }
$newsletterDisabled = Send 'PUT' '/newsletter/subscription' @{ subscribed = $false }
Expect $newsletterDisabled.StatusCode 200 'newsletter subscription opt-out'
if (($newsletterDisabled.Content | ConvertFrom-Json).subscribed) { throw 'Newsletter opt-out did not disable subscription' }
Write-Output 'newsletter subscription privacy and state'
Expect (Send 'POST' "/users/$networkUserId/follow").StatusCode 204 'follow user'
$followStatus = (Send 'GET' "/users/$networkUserId/follow-status").Content | ConvertFrom-Json
if (-not $followStatus.following -or $followStatus.followers -ne 1) { throw 'Follow status is incorrect' }
$publicFollowers = (Invoke-WebRequest -Method GET -Uri "$BaseUrl/api/users/$networkUserId/followers?size=20" -UseBasicParsing).Content | ConvertFrom-Json
if ($publicFollowers.content.id -notcontains $userId) { throw 'Followers were not publicly readable' }
$publicActivity = (Invoke-WebRequest -Method GET -Uri "$BaseUrl/api/users/$userId/activity?size=20" -UseBasicParsing).Content | ConvertFrom-Json
if ($publicActivity.content.type -notcontains 'FOLLOW') { throw 'Public profile activity did not contain the follow event' }
Write-Output 'public follow network'
$null = SendNetwork 'GET' '/auth/csrf'
Expect (SendNetwork 'POST' '/auth/login' @{ email = $networkEmail; password = $password }).StatusCode 200 'login network user'
$networkNotifications = (SendNetwork 'GET' '/notifications?size=20').Content | ConvertFrom-Json
if ($null -eq $networkNotifications.content) { throw 'Notifications response was malformed' }
if (-not ($networkNotifications.content | Where-Object { "$($_.type)" -eq 'FOLLOW' })) { throw 'Follow notification was not delivered' }
$networkUnread = (SendNetwork 'GET' '/notifications/unread-count').Content | ConvertFrom-Json
if ([int64]$networkUnread.count -lt 1) { throw 'Unread notification count was not incremented' }
Expect (SendNetwork 'POST' '/notifications/read-all').StatusCode 204 'mark notifications read'
$networkUnreadAfter = (SendNetwork 'GET' '/notifications/unread-count').Content | ConvertFrom-Json
if ([int64]$networkUnreadAfter.count -ne 0) { throw 'Read-all did not clear unread notifications' }
Write-Output 'notifications read state'
$notificationPreferences = (SendNetwork 'GET' '/notifications/preferences').Content | ConvertFrom-Json
if (-not $notificationPreferences.followsEnabled -or -not $notificationPreferences.reviewLikesEnabled) { throw 'Notification preferences defaults are incorrect' }
$updatedNotificationPreferences = SendNetwork 'PUT' '/notifications/preferences' @{ followsEnabled = $false; reviewLikesEnabled = $true }
Expect $updatedNotificationPreferences.StatusCode 200 'update notification preferences'
if (($updatedNotificationPreferences.Content | ConvertFrom-Json).followsEnabled) { throw 'Notification follow preference did not update' }
Write-Output 'notification preferences'
$conversation = SendNetwork 'POST' '/conversations' @{ userId = $userId }
Expect $conversation.StatusCode 200 'start conversation'
$conversationId = ($conversation.Content | ConvertFrom-Json).id
$message = SendNetwork 'POST' "/conversations/$conversationId/messages" @{ body = 'Verification private message' }
Expect $message.StatusCode 200 'send private message'
$messages = (SendNetwork 'GET' "/conversations/$conversationId/messages?size=20").Content | ConvertFrom-Json
if ($messages.content.body -notcontains 'Verification private message') { throw 'Private message did not appear in conversation' }
Expect (SendNetwork 'POST' "/conversations/$conversationId/read").StatusCode 204 'mark conversation read'
Write-Output 'private conversation'
Expect (Send 'DELETE' "/users/$networkUserId/follow").StatusCode 204 'unfollow user'
$oldRefresh = ($webSession.Cookies.GetCookies([uri]"$BaseUrl/api/auth/refresh") | Where-Object Name -eq 'rewind_refresh').Value
Expect (Send 'POST' '/auth/refresh').StatusCode 204 'refresh session'
$newRefresh = ($webSession.Cookies.GetCookies([uri]"$BaseUrl/api/auth/refresh") | Where-Object Name -eq 'rewind_refresh').Value
if (-not $newRefresh -or $newRefresh -eq $oldRefresh) { throw 'Refresh token did not rotate' }
Write-Output 'refresh token rotated'

$list = Send 'POST' '/lists' @{ name = 'Verification list'; isPublic = $true; tags = @('Verification', 'API') }
Expect $list.StatusCode 200 'create list'
$listId = ($list.Content | ConvertFrom-Json).id
$publicLists = (Send 'GET' '/lists/public?size=20').Content | ConvertFrom-Json
if ($publicLists.content.id -notcontains $listId) { throw 'Public list did not appear in public feed' }
Write-Output 'public list feed'
$taggedLists = (Send 'GET' '/lists/public?tag=verification&size=20').Content | ConvertFrom-Json
if ($taggedLists.content.id -notcontains $listId) { throw 'Tagged public list did not appear in tag filter' }
$popularTags = (Send 'GET' '/tags/popular?size=20').Content | ConvertFrom-Json
if ($popularTags.slug -notcontains 'verification') { throw 'Popular tags did not include the public list tag' }
Write-Output 'list tags'
Expect (Send 'POST' "/lists/$listId/items" @{ movieId = 1 }).StatusCode 200 'add item'
Expect (Send 'POST' "/lists/$listId/items" @{ movieId = 2 }).StatusCode 200 'add second item'
$listItems = (Send 'GET' "/lists/$listId/items").Content | ConvertFrom-Json
$firstListItem = $listItems | Where-Object { $_.movie.id -eq 1 } | Select-Object -First 1
$secondListItem = $listItems | Where-Object { $_.movie.id -eq 2 } | Select-Object -First 1
Expect (Send 'PUT' "/lists/$listId/items/reorder" @{ orderedItemIds = @($secondListItem.id, $firstListItem.id) }).StatusCode 200 'reorder list'
$reorderedItems = (Send 'GET' "/lists/$listId/items").Content | ConvertFrom-Json
if ($reorderedItems[0].movie.id -ne 2) { throw 'List order did not update' }
$updatedList = Send 'PATCH' "/lists/$listId" @{ name = 'Edited verification list'; description = 'Updated through the API'; isPublic = $true }
Expect $updatedList.StatusCode 200 'edit list'
if (($updatedList.Content | ConvertFrom-Json).name -ne 'Edited verification list') { throw 'List name did not update' }
$publicList = (Send 'GET' "/lists/public/$listId").Content | ConvertFrom-Json
if ($publicList.movies.id -notcontains 1) { throw 'Public list detail did not expose its film' }
if ($publicList.tags -notcontains 'Verification') { throw 'Public list detail did not expose tags' }
Write-Output 'public list detail'
Expect (Send 'POST' '/movies/1/watchlist').StatusCode 200 'add watchlist'
$watchlist = (Send 'GET' '/profile/me/watchlist?size=20').Content | ConvertFrom-Json
if ($watchlist.content.id -notcontains 1) { throw 'Watchlist did not appear in profile collection history' }
Write-Output 'profile collection history'
$publicWatchlist = (Invoke-WebRequest -Method GET -Uri "$BaseUrl/api/users/$userId/collections/watchlist?size=20" -UseBasicParsing).Content | ConvertFrom-Json
if ($publicWatchlist.content.id -notcontains 1) { throw 'Public profile watchlist was not readable without authentication' }
Write-Output 'public profile collection'
Expect (Send 'DELETE' '/movies/1/watchlist').StatusCode 204 'remove watchlist'
Expect (Send 'PUT' '/movies/1/rating' @{ rating = 4 }).StatusCode 200 'rate film'
$ratingHistory = (Send 'GET' '/profile/me/ratings?size=20').Content | ConvertFrom-Json
if ($ratingHistory.content.movieId -notcontains 1) { throw 'Rating did not appear in profile history' }
Write-Output 'rating history'
$review = Send 'POST' '/movies/1/reviews' @{ content = 'Verification review'; rating = 5 }
Expect $review.StatusCode 200 'create review'
$reviewId = ($review.Content | ConvertFrom-Json).id
$reviewLike = Send 'POST' "/reviews/$reviewId/likes"
Expect $reviewLike.StatusCode 204 'like review'
$reviewLikeStatus = (Send 'GET' "/reviews/$reviewId/like-status").Content | ConvertFrom-Json
if (-not $reviewLikeStatus.liked -or $reviewLikeStatus.likes -ne 1) { throw 'Review like status is incorrect' }
$publicLikeCount = Invoke-WebRequest -Method GET -Uri "$BaseUrl/api/reviews/$reviewId/likes" -UseBasicParsing
if ([int]($publicLikeCount.Content | ConvertFrom-Json) -ne 1) { throw 'Public review like count is incorrect' }
$popularReviewers = (Invoke-WebRequest -Method GET -Uri "$BaseUrl/api/users/popular-reviewers?size=10" -UseBasicParsing).Content | ConvertFrom-Json
if ($popularReviewers.id -notcontains $userId) { throw 'Popular reviewers did not include the liked review author' }
Write-Output 'review likes'
Expect (Send 'DELETE' "/reviews/$reviewId/likes").StatusCode 204 'unlike review'
$reviewHistory = (Send 'GET' '/profile/me/reviews?size=20').Content | ConvertFrom-Json
if ($reviewHistory.content.reviewId -notcontains $reviewId) { throw 'Review did not appear in profile history' }
Write-Output 'review history'
$comment = Send 'POST' "/reviews/$reviewId/comments" @{ text = 'Verification comment' }
Expect $comment.StatusCode 200 'create comment'
$commentId = ($comment.Content | ConvertFrom-Json).id
$comments = (Send 'GET' "/reviews/$reviewId/comments?size=20").Content | ConvertFrom-Json
if ($comments.content.id -notcontains $commentId) { throw 'Comment did not appear below its review' }
Write-Output 'public comments feed'
$updatedComment = Send 'PATCH' "/comments/$commentId" @{ text = 'Edited verification comment' }
Expect $updatedComment.StatusCode 200 'edit comment'
if (($updatedComment.Content | ConvertFrom-Json).text -ne 'Edited verification comment') { throw 'Comment text did not update' }
Expect (Send 'DELETE' "/comments/$commentId").StatusCode 204 'delete comment'
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
