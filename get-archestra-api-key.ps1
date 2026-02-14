# PowerShell script to obtain Archestra user token for Orchestrix integration
# This script logs into Archestra and creates a user token

$ARCHESTRA_URL = if ($env:ARCHESTRA_URL) { $env:ARCHESTRA_URL } else { "http://localhost:9000" }
$ADMIN_EMAIL = if ($env:ADMIN_EMAIL) { $env:ADMIN_EMAIL } else { "admin@localhost.ai" }
$ADMIN_PASSWORD = if ($env:ADMIN_PASSWORD) { $env:ADMIN_PASSWORD } else { "password" }

Write-Host "Getting Archestra User Token..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Archestra URL: $ARCHESTRA_URL"
Write-Host "Admin Email: $ADMIN_EMAIL"
Write-Host ""

# Step 1: Login to get session cookie
Write-Host "Step 1: Logging in to Archestra..." -ForegroundColor Yellow

$loginBody = @{
    email = $ADMIN_EMAIL
    password = $ADMIN_PASSWORD
} | ConvertTo-Json

try {
    # Use WebSession to capture cookies
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    
    $loginResponse = Invoke-WebRequest -Uri "$ARCHESTRA_URL/api/auth/sign-in/email" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody `
        -SessionVariable session `
        -ErrorAction Stop
    
    Write-Host "Login successful" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "Failed to login to Archestra" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure Archestra is running:" -ForegroundColor Yellow
    Write-Host "  docker ps"
    Write-Host ""
    Write-Host "If not running, start it with:" -ForegroundColor Yellow
    Write-Host "  docker run -p 9000:9000 -p 3000:3000 -e ARCHESTRA_QUICKSTART=true archestra/platform"
    exit 1
}

# Step 2: Create user token
Write-Host "Step 2: Creating user token for Orchestrix..." -ForegroundColor Yellow

$tokenBody = @{
    name = "Orchestrix Integration"
    description = "User token for Orchestrix deployment integration"
    expiresAt = $null  # No expiration
} | ConvertTo-Json

try {
    $tokenResponse = Invoke-RestMethod -Uri "$ARCHESTRA_URL/api/user-tokens" `
        -Method Post `
        -ContentType "application/json" `
        -WebSession $session `
        -Body $tokenBody `
        -ErrorAction Stop
    
    $userToken = $tokenResponse.token
    
    if (-not $userToken) {
        throw "No token in response"
    }
    
    Write-Host "User token created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Your Archestra User Token:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  $userToken" -ForegroundColor White
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Copy the token above"
    Write-Host ""
    Write-Host "2. Update backend-core/.env:" -ForegroundColor Yellow
    Write-Host "   ARCHESTRA_API_KEY=$userToken" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Restart Orchestrix backend:" -ForegroundColor Yellow
    Write-Host "   cd backend-core && npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "4. Try deploying a workflow from the UI" -ForegroundColor Yellow
    Write-Host ""
    
    # Optionally copy to clipboard if available
    if (Get-Command Set-Clipboard -ErrorAction SilentlyContinue) {
        $userToken | Set-Clipboard
        Write-Host "Token copied to clipboard!" -ForegroundColor Green
        Write-Host ""
    }
} catch {
    Write-Host "Failed to create user token" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
    exit 1
}
