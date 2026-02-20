# 🛡️ Yalla Wasel - Pre-Deploy Security Lockdown Script
# Version: 1.0.0
# Purpose: Prevents deployment if database security vulnerabilities are detected.

$SUPABASE_URL = $env:SUPABASE_URL
$SUPABASE_SERVICE_ROLE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $SUPABASE_URL -or -not $SUPABASE_SERVICE_ROLE_KEY) {
    Write-Error "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Production audit aborted."
    exit 1
}

Write-Host "--- 🛡️ Starting Pre-Deploy Security Audit ---" -ForegroundColor Cyan

# Define Audit Views to Check
$AuditViews = @(
    "audit_unsecured_policies",
    "audit_disabled_rls",
    "audit_unsafe_functions",
    "audit_missing_fk_indexes"
)

$Failed = $false

foreach ($View in $AuditViews) {
    Write-Host "Checking $View..." -NoNewline
    
    $Result = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/$View" `
                -Headers @{ "apikey" = $SUPABASE_SERVICE_ROLE_KEY; "Authorization" = "Bearer $SUPABASE_SERVICE_ROLE_KEY" } `
                -Method Get

    if ($Result.Count -gt 0) {
        Write-Host " [CRITICAL FAIL]" -ForegroundColor Red
        Write-Host "Found $($Result.Count) violations in $View." -ForegroundColor Yellow
        $Result | Format-Table | Out-String | Write-Host
        $Failed = $true
    } else {
        Write-Host " [PASS]" -ForegroundColor Green
    }
}

if ($Failed) {
    Write-Host "--- ❌ Security Audit FAILED. Deployment BLOCKED. ---" -ForegroundColor Black -BackgroundColor Red
    exit 1
} else {
    Write-Host "--- ✅ Security Audit PASSED. Readiness: 100% ---" -ForegroundColor Green
    exit 0
}
