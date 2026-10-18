param([string]$BaseUrl = 'http://127.0.0.1:8081')

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Net.Http
$suffix = [guid]::NewGuid().ToString('N').Substring(0, 12)
$email = "concurrency-$suffix@example.invalid"
$username = "concurrency_$suffix"
$password = 'ConcurrencyPass123!'
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$headers = @{}
$loggedIn = $false
$listId = $null
$reviewId = $null
$commentIds = @()

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

function ExpectStatus($response, [int[]]$expected, [string]$step) {
    $status = [int]$response.StatusCode
    if ($expected -notcontains $status) {
        throw "$step returned HTTP $status (expected $($expected -join '/'))"
    }
    Write-Output "$step : $status"
}

function InvokeConcurrent([string]$Method, [string]$Path, [object[]]$Bodies) {
    $handler = New-Object System.Net.Http.HttpClientHandler
    $handler.UseCookies = $true
    $handler.CookieContainer = New-Object System.Net.CookieContainer
    # Auth cookies are scoped to /api, while the CSRF cookie is scoped to /.
    $cookies = @($session.Cookies.GetCookies([uri]"$BaseUrl/api")) + @($session.Cookies.GetCookies([uri]$BaseUrl))
    foreach ($cookie in ($cookies | Sort-Object Name -Unique)) {
        $copy = New-Object System.Net.Cookie($cookie.Name, $cookie.Value, '/')
        $handler.CookieContainer.Add([uri]$BaseUrl, $copy)
    }
    $client = New-Object System.Net.Http.HttpClient($handler)
    $tasks = @()
    try {
        foreach ($body in $Bodies) {
            $request = New-Object System.Net.Http.HttpRequestMessage([System.Net.Http.HttpMethod]::new($Method), "$BaseUrl/api$Path")
            $csrf = $session.Cookies.GetCookies([uri]"$BaseUrl/api$Path") | Where-Object Name -eq 'XSRF-TOKEN'
            if ($csrf) { $request.Headers.Add('X-XSRF-TOKEN', $csrf.Value) }
            if ($null -ne $body) {
                $json = $body | ConvertTo-Json -Compress
                $request.Content = [System.Net.Http.StringContent]::new($json, [System.Text.Encoding]::UTF8, 'application/json')
            }
            $tasks += $client.SendAsync($request)
        }
        [System.Threading.Tasks.Task]::WaitAll([System.Threading.Tasks.Task[]]$tasks)
        return @($tasks | ForEach-Object {
            [pscustomobject]@{
                StatusCode = [int]$_.Result.StatusCode
                Content = $_.Result.Content.ReadAsStringAsync().Result
            }
        })
    } finally {
        foreach ($task in $tasks) {
            if ($task.IsCompleted -and $null -ne $task.Result) { $task.Result.Dispose() }
        }
        $client.Dispose()
        $handler.Dispose()
    }
}

function ExpectConcurrentStatuses($responses, [int[]]$expected, [string]$step) {
    if ($responses.Count -ne 2) { throw "$step returned $($responses.Count) responses" }
    foreach ($response in $responses) {
        if ($expected -notcontains [int]$response.StatusCode) {
            throw "$step returned HTTP $($response.StatusCode) (expected $($expected -join '/')): $($response.Content)"
        }
    }
    Write-Output "$step : $(@($responses | ForEach-Object StatusCode) -join ',')"
}

try {
    ExpectStatus (InvokeApi 'GET' '/auth/csrf') @(200) 'csrf bootstrap'
    ExpectStatus (InvokeApi 'POST' '/auth/register' @{ username = $username; email = $email; password = $password }) @(200) 'concurrency user registration'
    ExpectStatus (InvokeApi 'POST' '/auth/login' @{ email = $email; password = $password }) @(200) 'concurrency user login'
    $loggedIn = $true

    $list = InvokeApi 'POST' '/lists' @{ name = "Concurrent $suffix"; description = 'HTTP concurrency'; isPublic = $false; tags = @() }
    ExpectStatus $list @(200) 'concurrency list create'
    $listId = ($list.Content | ConvertFrom-Json).id

    $listWrites = InvokeConcurrent 'POST' "/lists/$listId/items" @(
        @{ movieId = 1; position = 1 },
        @{ movieId = 1; position = 1 }
    )
    ExpectConcurrentStatuses $listWrites @(200) 'concurrent custom list item writes'
    $items = InvokeApi 'GET' "/lists/$listId/items"
    ExpectStatus $items @(200) 'custom list item read after concurrency'
    $customItems = @((ConvertFrom-Json -InputObject $items.Content))
    if ($customItems.Count -ne 1) { throw 'Concurrent custom list writes created duplicate items' }

    ExpectStatus (InvokeApi 'POST' "/lists/$listId/items" @{ movieId = 2; position = 2 }) @(200) 'second list item for reorder'
    $secondItemRead = InvokeApi 'GET' "/lists/$listId/items"
    ExpectStatus $secondItemRead @(200) 'list items before reorder concurrency'
    $listItems = @((ConvertFrom-Json -InputObject $secondItemRead.Content))
    if ($listItems.Count -ne 2) { throw 'List reorder fixture did not contain two items' }
    $orderedItemIds = @($listItems[1].id, $listItems[0].id)
    $reorderWrites = InvokeConcurrent 'PUT' "/lists/$listId/items/reorder" @(
        @{ orderedItemIds = $orderedItemIds },
        @{ orderedItemIds = $orderedItemIds }
    )
    ExpectConcurrentStatuses $reorderWrites @(200) 'concurrent list reorder writes'
    $reorderedItems = InvokeApi 'GET' "/lists/$listId/items"
    ExpectStatus $reorderedItems @(200) 'list items after reorder concurrency'
    $reorderedJson = @((ConvertFrom-Json -InputObject $reorderedItems.Content))
    if ($reorderedJson.Count -ne 2 -or $reorderedJson[0].id -ne $orderedItemIds[0]) {
        throw 'Concurrent list reorder writes produced an invalid order'
    }

    $systemWrites = InvokeConcurrent 'POST' '/movies/1/watchlist' @($null, $null)
    ExpectConcurrentStatuses $systemWrites @(200) 'concurrent system list writes'
    $watchlist = InvokeApi 'GET' '/profile/me/watchlist?size=50'
    ExpectStatus $watchlist @(200) 'system list read after concurrency'
    $watchlistJson = $watchlist.Content | ConvertFrom-Json
    $watchlistItems = @($watchlistJson.content)
    $matchingWatchlistItems = @($watchlistItems | Where-Object { $_.id -eq 1 })
    if ($matchingWatchlistItems.Length -ne 1) { throw 'Concurrent system list writes created duplicate items' }

    $ratingWrites = InvokeConcurrent 'PUT' '/movies/1/rating' @(
        @{ rating = 3 },
        @{ rating = 5 }
    )
    ExpectConcurrentStatuses $ratingWrites @(200) 'concurrent rating writes'
    $rating = InvokeApi 'GET' '/movies/1/rating/me'
    ExpectStatus $rating @(200) 'rating read after concurrency'
    if (($rating.Content | ConvertFrom-Json).rating -notin @(3, 5)) { throw 'Concurrent rating writes returned an invalid value' }

    $reviewWrites = InvokeConcurrent 'POST' '/movies/1/reviews' @(
        @{ content = "Concurrent review $suffix"; rating = 4 },
        @{ content = "Concurrent review $suffix"; rating = 4 }
    )
    ExpectConcurrentStatuses $reviewWrites @(200, 409) 'concurrent review writes'
    $reviewResponse = $reviewWrites | Where-Object StatusCode -eq 200 | Select-Object -First 1
    $reviewId = ($reviewResponse.Content | ConvertFrom-Json).id

    $commentWrites = InvokeConcurrent 'POST' "/reviews/$reviewId/comments" @(
        @{ text = "Concurrent comment $suffix" },
        @{ text = "Concurrent comment $suffix" }
    )
    ExpectConcurrentStatuses $commentWrites @(200) 'concurrent comment writes'
    $comments = InvokeApi 'GET' "/reviews/$reviewId/comments?size=50"
    ExpectStatus $comments @(200) 'comments read after concurrency'
    $commentItems = @((ConvertFrom-Json -InputObject $comments.Content).content)
    $commentIds = @($commentItems | Where-Object { $_.text -eq "Concurrent comment $suffix" } | ForEach-Object id)
    if ($commentIds.Count -ne 2) { throw 'Concurrent comment writes did not persist two comments' }

    $notificationWrites = InvokeConcurrent 'PUT' '/notifications/preferences' @(
        @{ followsEnabled = $false; reviewLikesEnabled = $true },
        @{ followsEnabled = $true; reviewLikesEnabled = $false }
    )
    ExpectConcurrentStatuses $notificationWrites @(200) 'concurrent notification preference writes'
    $preferences = InvokeApi 'GET' '/notifications/preferences'
    ExpectStatus $preferences @(200) 'notification preferences after concurrency'
    $preferencesJson = $preferences.Content | ConvertFrom-Json
    if ($null -eq $preferencesJson.followsEnabled -or $null -eq $preferencesJson.reviewLikesEnabled) {
        throw 'Concurrent notification preference writes returned an invalid state'
    }
    $readAllWrites = InvokeConcurrent 'POST' '/notifications/read-all' @($null, $null)
    ExpectConcurrentStatuses $readAllWrites @(204) 'concurrent notification read-all writes'

    $followWrites = InvokeConcurrent 'POST' '/users/1/follow' @($null, $null)
    ExpectConcurrentStatuses $followWrites @(204) 'concurrent follow writes'
    $followers = InvokeApi 'GET' '/users/1/followers?size=50'
    ExpectStatus $followers @(200) 'followers read after concurrency'
    ExpectStatus (InvokeApi 'DELETE' '/users/1/follow') @(204) 'follow cleanup'

    $likeWrites = InvokeConcurrent 'POST' "/reviews/$reviewId/likes" @($null, $null)
    ExpectConcurrentStatuses $likeWrites @(204) 'concurrent review-like writes'
    $likeCount = InvokeApi 'GET' "/reviews/$reviewId/likes"
    ExpectStatus $likeCount @(200) 'review-like count after concurrency'
    if ([int]($likeCount.Content | ConvertFrom-Json) -ne 1) { throw 'Concurrent review-like writes created duplicate likes' }
    ExpectStatus (InvokeApi 'DELETE' "/reviews/$reviewId/likes") @(204) 'review-like cleanup'

    Write-Output 'HTTP concurrency smoke passed'
} finally {
    if ($loggedIn) {
        foreach ($commentId in $commentIds) {
            try { $null = InvokeApi 'DELETE' "/comments/$commentId" } catch { }
        }
        try { if ($reviewId) { $null = InvokeApi 'DELETE' "/reviews/$reviewId" } } catch { }
        try { $null = InvokeApi 'DELETE' '/users/1/follow' } catch { }
        try { $null = InvokeApi 'DELETE' '/movies/1/watchlist' } catch { }
        try { if ($listId) { $null = InvokeApi 'DELETE' "/lists/$listId/items/1" } } catch { }
        try { $null = InvokeApi 'DELETE' '/profile/me' @{ currentPassword = $password } } catch { }
    }
}
