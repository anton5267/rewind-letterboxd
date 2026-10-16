param([string]$BaseUrl = 'http://localhost:8080')

$ErrorActionPreference = 'Stop'
$suffix = [guid]::NewGuid().ToString('N').Substring(0, 12)
$email = "verify-$suffix@example.invalid"
$password = 'VerificationPass123!'
$headers = @{}

function Send([string]$Method, [string]$Path, $Body = $null) {
    $args = @{ Method = $Method; Uri = "$BaseUrl/api$Path"; Headers = $headers; UseBasicParsing = $true }
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

$registered = Send 'POST' '/auth/register' @{ username = "verify$suffix"; email = $email; password = $password }
Expect $registered.StatusCode 200 'register'
$userId = ($registered.Content | ConvertFrom-Json).id
$publicUser = (Send 'GET' "/users/$userId").Content | ConvertFrom-Json
if ($null -ne $publicUser.email) { throw 'Public user endpoint exposed email' }
Write-Output 'public profile omits email'
Expect (Send 'GET' '/movies/1/details').StatusCode 200 'public film details'
$loggedIn = Send 'POST' '/auth/login' @{ email = $email; password = $password }
Expect $loggedIn.StatusCode 200 'login'
$headers.Authorization = "Bearer $((($loggedIn.Content | ConvertFrom-Json).token))"

$list = Send 'POST' '/lists' @{ name = 'Verification list'; isPublic = $true }
Expect $list.StatusCode 200 'create list'
$listId = ($list.Content | ConvertFrom-Json).id
Expect (Send 'POST' "/lists/$listId/items" @{ movieId = 1 }).StatusCode 200 'add item'
Expect (Send 'POST' '/movies/1/watchlist').StatusCode 200 'add watchlist'
Expect (Send 'DELETE' '/movies/1/watchlist').StatusCode 204 'remove watchlist'
Expect (Send 'PUT' '/movies/1/rating' @{ rating = 4 }).StatusCode 200 'rate film'
$review = Send 'POST' '/movies/1/reviews' @{ content = 'Verification review'; rating = 5 }
Expect $review.StatusCode 200 'create review'
$reviewId = ($review.Content | ConvertFrom-Json).id

try {
    $null = Send 'POST' '/movies/1/reviews' @{ content = 'Duplicate'; rating = 4 }
    throw 'Duplicate review was unexpectedly accepted'
} catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 409) { throw }
    Write-Output 'duplicate review : 409'
}

Expect (Send 'DELETE' "/reviews/$reviewId").StatusCode 204 'delete review'
$savedRating = (Send 'GET' '/movies/1/rating/me').Content | ConvertFrom-Json
if ($savedRating.rating -ne 5) { throw 'Deleting a review unexpectedly removed its rating' }
Write-Output 'rating remains after review deletion : 5'
Expect (Send 'DELETE' '/movies/1/rating').StatusCode 204 'delete rating'
Expect (Send 'DELETE' "/lists/$listId/items/1").StatusCode 204 'remove item'
Write-Output 'HTTP core flow passed.'
