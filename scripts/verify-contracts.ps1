param([string]$BaseUrl = 'http://127.0.0.1:8081')

$ErrorActionPreference = 'Stop'
$suffix = [guid]::NewGuid().ToString('N').Substring(0, 12)
$email = "contract-$suffix@example.invalid"
$username = "contract_$suffix"
$password = 'ContractPass123!'
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$headers = @{}
$loggedIn = $false
$conversationId = $null

function InvokeApi([string]$Method, [string]$Path, $Body = $null) {
    if ($Method -notin @('GET', 'HEAD', 'OPTIONS')) {
        $csrf = $session.Cookies.GetCookies([uri]"$BaseUrl/api$Path") | Where-Object Name -eq 'XSRF-TOKEN'
        if ($csrf) { $headers['X-XSRF-TOKEN'] = $csrf.Value }
    }
    $args = @{ Method = $Method; Uri = "$BaseUrl/api$Path"; Headers = $headers; WebSession = $session; UseBasicParsing = $true }
    if ($null -ne $Body) {
        $args.ContentType = 'application/json'
        $args.Body = ($Body | ConvertTo-Json -Compress)
    }
    try {
        return Invoke-WebRequest @args
    } catch {
        $response = $_.Exception.Response
        if ($null -eq $response) { throw }
        $content = ''
        try { $content = (New-Object IO.StreamReader($response.GetResponseStream())).ReadToEnd() } catch { }
        return [pscustomobject]@{ StatusCode = [int]$response.StatusCode; Content = $content }
    }
}

function InvokeGuest([string]$Method, [string]$Path) {
    try {
        return Invoke-WebRequest -Method $Method -Uri "$BaseUrl/api$Path" -UseBasicParsing
    } catch {
        $response = $_.Exception.Response
        if ($null -eq $response) { throw }
        return [pscustomobject]@{ StatusCode = [int]$response.StatusCode; Content = '' }
    }
}

function ExpectStatus($Response, [int[]]$Expected, [string]$Step) {
    $status = [int]$Response.StatusCode
    if ($Expected -notcontains $status) {
        throw "$Step returned HTTP $status (expected $($Expected -join '/'))"
    }
    Write-Output "$Step : $status"
}

function ExpectGuest([string]$Path, [int[]]$Expected = @(401)) {
    ExpectStatus (InvokeGuest 'GET' $Path) $Expected "guest GET $Path"
}

try {
    ExpectStatus (InvokeGuest 'GET' '/movies?size=5') @(200) 'public movies'
    ExpectStatus (InvokeGuest 'GET' '/movies/search?size=5') @(200) 'public movie search'
    ExpectStatus (InvokeGuest 'GET' '/movies/1') @(200) 'public movie card'
    ExpectStatus (InvokeGuest 'GET' '/movies/1/details') @(200) 'public movie details'
    ExpectStatus (InvokeGuest 'GET' '/genres') @(200) 'public genres'
    ExpectStatus (InvokeGuest 'GET' '/actors/1') @(200) 'public actor filmography'
    ExpectStatus (InvokeGuest 'GET' '/directors/1') @(200) 'public director filmography'
    ExpectStatus (InvokeGuest 'GET' '/journal/articles?size=5') @(200) 'public journal articles'
    ExpectStatus (InvokeGuest 'GET' '/journal/articles/archive') @(200) 'public journal archive'
    ExpectStatus (InvokeGuest 'GET' '/lists/public?size=5') @(200) 'public list catalog'
    ExpectStatus (InvokeGuest 'GET' '/lists/public/popular?size=5') @(200) 'popular public lists'
    ExpectStatus (InvokeGuest 'GET' '/lists/public/recently-liked?size=5') @(200) 'recently liked public lists'
    ExpectStatus (InvokeGuest 'GET' '/lists/public/team?size=5') @(200) 'team public lists'
    ExpectStatus (InvokeGuest 'GET' '/tags/popular?size=5') @(200) 'public popular tags'
    ExpectStatus (InvokeGuest 'GET' '/reviews/recent?size=5') @(200) 'public recent reviews'
    ExpectStatus (InvokeGuest 'GET' '/users/popular-reviewers?size=5') @(200) 'public popular reviewers'

    foreach ($path in @(
        '/users/me', '/profile/me', '/profile/me/ratings', '/profile/me/reviews',
        '/lists/my', '/activity/following', '/notifications', '/conversations',
        '/newsletter/subscription', '/movies/1/status/me', '/movies/1/rating/me', '/movies/1/reviews/me',
        '/users/1/follow-status', '/reviews/1/like-status'
    )) { ExpectGuest $path }

    ExpectStatus (InvokeApi 'GET' '/auth/csrf') @(200) 'csrf bootstrap'
    $registration = InvokeApi 'POST' '/auth/register' @{ username = $username; email = $email; password = $password }
    ExpectStatus $registration @(200) 'contract user registration'
    $userId = ($registration.Content | ConvertFrom-Json).id

    ExpectStatus (InvokeApi 'POST' '/auth/login' @{ email = $email; password = $password }) @(200) 'contract user login'
    $loggedIn = $true
    ExpectStatus (InvokeApi 'GET' '/users/me') @(200) 'authenticated user'
    ExpectStatus (InvokeApi 'GET' '/profile/me') @(200) 'authenticated profile'
    foreach ($path in @(
        '/profile/me/watched', '/profile/me/watchlist', '/profile/me/favorites',
        '/profile/me/ratings', '/profile/me/reviews', '/lists/my',
        '/activity/following', '/notifications', '/notifications/unread-count',
        '/notifications/preferences', '/conversations', '/newsletter/subscription', '/movies/1/status/me'
    )) { ExpectStatus (InvokeApi 'GET' $path) @(200) "authenticated GET $path" }
    ExpectStatus (InvokeApi 'GET' '/movies/1/rating/me') @(200, 204) 'authenticated rating lookup'
    ExpectStatus (InvokeApi 'GET' '/movies/1/reviews/me') @(200, 204) 'authenticated review lookup'
    ExpectStatus (InvokeApi 'GET' '/users/1/followers') @(200) 'authenticated public followers'
    ExpectStatus (InvokeApi 'GET' '/users/1/following') @(200) 'authenticated public following'
    ExpectStatus (InvokeApi 'GET' '/users/1/follow-status') @(200) 'authenticated follow status'

    $profileUpdate = InvokeApi 'PATCH' '/profile/me' @{ displayName = "Contract User $suffix"; avatarUrl = 'https://example.invalid/avatar.png' }
    ExpectStatus $profileUpdate @(200) 'profile update'
    if (($profileUpdate.Content | ConvertFrom-Json).displayName -ne "Contract User $suffix") {
        throw 'Profile display name did not persist'
    }

    $newPassword = 'ContractPass456!'
    ExpectStatus (InvokeApi 'PUT' '/profile/me/password' @{ currentPassword = $password; newPassword = $newPassword }) @(200) 'password change'
    $password = $newPassword
    ExpectStatus (InvokeApi 'POST' '/auth/login' @{ email = $email; password = $password }) @(200) 'login after password change'

    $conversation = InvokeApi 'POST' '/conversations' @{ userId = 1 }
    ExpectStatus $conversation @(200) 'conversation create'
    $conversationId = ($conversation.Content | ConvertFrom-Json).id
    ExpectStatus (InvokeApi 'GET' "/conversations/$conversationId/messages") @(200) 'conversation messages read'
    $message = InvokeApi 'POST' "/conversations/$conversationId/messages" @{ body = "Contract message $suffix" }
    ExpectStatus $message @(200) 'private message send'
    $messageId = ($message.Content | ConvertFrom-Json).id
    $messagePage = InvokeApi 'GET' "/conversations/$conversationId/messages"
    ExpectStatus $messagePage @(200) 'private message history'
    if (($messagePage.Content | ConvertFrom-Json).content.id -notcontains $messageId) { throw 'Private message did not appear in history' }
    ExpectStatus (InvokeApi 'POST' "/conversations/$conversationId/read") @(204) 'conversation mark read'

    ExpectStatus (InvokeApi 'PUT' '/newsletter/subscription' @{ subscribed = $false }) @(200) 'newsletter unsubscribe'
    ExpectStatus (InvokeApi 'PUT' '/newsletter/subscription' @{ subscribed = $true }) @(200) 'newsletter subscribe'

    $updatedPreferences = InvokeApi 'PUT' '/notifications/preferences' @{ followsEnabled = $false; reviewLikesEnabled = $true }
    ExpectStatus $updatedPreferences @(200) 'notification preferences update'
    $updatedPreferencesJson = $updatedPreferences.Content | ConvertFrom-Json
    if ($updatedPreferencesJson.followsEnabled -ne $false -or $updatedPreferencesJson.reviewLikesEnabled -ne $true) {
        throw 'Notification preferences did not persist the requested values'
    }
    ExpectStatus (InvokeApi 'POST' '/notifications/read-all') @(204) 'notifications read-all'

    ExpectStatus (InvokeApi 'POST' '/movies/1/watchlist') @(200) 'watchlist add'
    ExpectStatus (InvokeApi 'POST' '/movies/1/watched') @(200) 'watched add'
    ExpectStatus (InvokeApi 'POST' '/movies/1/favorite') @(200) 'favorite add'
    $statusAfterAdds = (InvokeApi 'GET' '/movies/1/status/me').Content | ConvertFrom-Json
    if (-not $statusAfterAdds.inWatchlist -or -not $statusAfterAdds.watched -or -not $statusAfterAdds.favorite) {
        throw 'Movie status did not reflect watched/watchlist/favorite writes'
    }
    ExpectStatus (InvokeApi 'DELETE' '/movies/1/watchlist') @(204) 'watchlist delete'
    ExpectStatus (InvokeApi 'DELETE' '/movies/1/watched') @(204) 'watched delete'
    ExpectStatus (InvokeApi 'DELETE' '/movies/1/favorite') @(204) 'favorite delete'

    ExpectStatus (InvokeApi 'PUT' '/movies/1/rating' @{ rating = 5 }) @(200) 'rating create'
    ExpectStatus (InvokeApi 'DELETE' '/movies/1/rating') @(204) 'rating delete'
    ExpectStatus (InvokeApi 'GET' '/movies/1/rating/me') @(204) 'rating removed'

    ExpectStatus (InvokeApi 'POST' '/users/1/follow') @(204) 'follow user'
    ExpectStatus (InvokeApi 'DELETE' '/users/1/follow') @(204) 'unfollow user'

    foreach ($path in @('/admin/dashboard', '/admin/users?size=1', '/admin/settings')) {
        ExpectStatus (InvokeApi 'GET' $path) @(403) "non-admin GET $path"
    }

    foreach ($path in @("/users/$userId", "/users/$userId/profile", "/users/$userId/collections/watchlist", "/users/$userId/activity")) {
        ExpectStatus (InvokeGuest 'GET' $path) @(200) "public user GET $path"
    }

    $review = InvokeApi 'POST' '/movies/1/reviews' @{ content = "Contract review $suffix"; rating = 4 }
    ExpectStatus $review @(200) 'contract review create'
    $reviewId = ($review.Content | ConvertFrom-Json).id
    ExpectStatus (InvokeGuest 'GET' "/movies/1/reviews") @(200) 'public reviews for movie'
    ExpectStatus (InvokeGuest 'GET' "/reviews/$reviewId/comments") @(200) 'public review comments'
    ExpectStatus (InvokeGuest 'GET' "/reviews/$reviewId/likes") @(200) 'public review likes'
    ExpectStatus (InvokeGuest 'GET' "/reviews/$reviewId/like-status") @(401) 'guest review like status'
    ExpectStatus (InvokeApi 'GET' "/reviews/$reviewId/like-status") @(200) 'authenticated review like status'
    ExpectStatus (InvokeApi 'POST' "/reviews/$reviewId/likes") @(204) 'review like create'
    ExpectStatus (InvokeGuest 'GET' "/reviews/$reviewId/likes") @(200) 'review like count after create'
    ExpectStatus (InvokeApi 'DELETE' "/reviews/$reviewId/likes") @(204) 'review like delete'

    $comment = InvokeApi 'POST' "/reviews/$reviewId/comments" @{ text = "Contract comment $suffix" }
    ExpectStatus $comment @(200) 'contract comment create'
    $commentId = ($comment.Content | ConvertFrom-Json).id
    ExpectStatus (InvokeApi 'GET' "/reviews/$reviewId/comments") @(200) 'authenticated comments read'
    ExpectStatus (InvokeApi 'DELETE' "/comments/$commentId") @(204) 'contract comment delete'
    ExpectStatus (InvokeApi 'DELETE' "/reviews/$reviewId") @(204) 'contract review delete'
    $reviewId = $null
    $commentId = $null
    Write-Output 'public/protected contract smoke passed'
} finally {
    if ($loggedIn) {
        try { $null = InvokeApi 'DELETE' '/profile/me' @{ currentPassword = $password } } catch { }
    }
}
