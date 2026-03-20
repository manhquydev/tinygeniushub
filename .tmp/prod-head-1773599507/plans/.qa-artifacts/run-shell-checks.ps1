$ErrorActionPreference = 'Continue'
$base = 'http://localhost:3000'
$result = [ordered]@{}

# Domain 4 - API
$api = [ordered]@{}
$api.healthRaw = (curl.exe -s "$base/api/health")
$api.healthStatus = (curl.exe -s -o NUL -w "%{http_code}" "$base/api/health")

$protected = @('/api/admin/users','/api/reports/weekly','/api/children','/api/billing')
$api.protectedStatuses = @{}
foreach ($p in $protected) {
  $api.protectedStatuses[$p] = (curl.exe -s -o NUL -w "%{http_code}" "$base$p")
}

$public = @('/api/blog/posts','/api/health')
$api.publicStatuses = @{}
foreach ($p in $public) {
  $api.publicStatuses[$p] = (curl.exe -s -o NUL -w "%{http_code}" "$base$p")
}

$invalidPayload = '{"email":"not-an-email","message":""}'
$api.invalidContact = @{
  status = (curl.exe -s -o NUL -w "%{http_code}" -X POST "$base/api/contact" -H "Content-Type: application/json" -H "Origin: $base" -d $invalidPayload)
  body = (curl.exe -s -X POST "$base/api/contact" -H "Content-Type: application/json" -H "Origin: $base" -d $invalidPayload)
}

$sqlPayload = '{"name":"QA","email":"test@test.com","subject":"Khác","message":"''; DROP TABLE users; --"}'
$api.sqlInjectionAttempt = @{
  status = (curl.exe -s -o NUL -w "%{http_code}" -X POST "$base/api/contact" -H "Content-Type: application/json" -H "Origin: $base" -d $sqlPayload)
  body = (curl.exe -s -X POST "$base/api/contact" -H "Content-Type: application/json" -H "Origin: $base" -d $sqlPayload)
}

$xssPayload = '{"name":"QA","email":"test@test.com","subject":"Khác","message":"<script>alert(1)</script>"}'
$api.xssAttempt = @{
  status = (curl.exe -s -o NUL -w "%{http_code}" -X POST "$base/api/contact" -H "Content-Type: application/json" -H "Origin: $base" -d $xssPayload)
  body = (curl.exe -s -X POST "$base/api/contact" -H "Content-Type: application/json" -H "Origin: $base" -d $xssPayload)
}

$api.deleteContactStatus = (curl.exe -s -o NUL -w "%{http_code}" -X DELETE "$base/api/contact")
$api.putHealthStatus = (curl.exe -s -o NUL -w "%{http_code}" -X PUT "$base/api/health")
$api.rssHead = (curl.exe -s "$base/rss.xml" | Select-Object -First 20)
$result.api = $api

# Domain 5 - Security
$security = [ordered]@{}
$security.headers = (curl.exe -s -I "$base/" | findstr /I "x-frame x-content-type x-xss content-security strict-transport")
$security.nextPublicVars = (rg -n "NEXT_PUBLIC_" src --glob "*.ts" --glob "*.tsx" | rg -v "\.d\.ts|node_modules" | ForEach-Object { if ($_ -match 'NEXT_PUBLIC_[A-Z_]+') { $matches[0] } } | Sort-Object -Unique)
$security.authGuardGrep = (rg -n "getSession|auth\(\)|requireAuth|unauthorized|redirect.*login" src/app --glob "*.ts" --glob "*.tsx" | rg -v "//|node_modules" | Select-Object -First 80)
$result.security = $security

# Domain 6 - SEO
$seo = [ordered]@{}
$seo.homeMeta = (curl.exe -s "$base/" | findstr /I "<title>" | Select-Object -First 5)
$seo.homeMetaDesc = (curl.exe -s "$base/" | findstr /I "meta name=\"description\"" | Select-Object -First 5)
$seo.homeOg = (curl.exe -s "$base/" | findstr /I "meta property=\"og:" | Select-Object -First 10)
$seo.pricingMeta = (curl.exe -s "$base/pricing" | findstr /I "<title>" | Select-Object -First 5)
$seo.pricingMetaDesc = (curl.exe -s "$base/pricing" | findstr /I "meta name=\"description\"" | Select-Object -First 5)
$seo.blogMeta = (curl.exe -s "$base/blog" | findstr /I "<title>" | Select-Object -First 5)
$seo.blogMetaDesc = (curl.exe -s "$base/blog" | findstr /I "meta name=\"description\"" | Select-Object -First 5)
$seo.robots = (curl.exe -s "$base/robots.txt")
$seo.sitemapHead = (curl.exe -s "$base/sitemap.xml" | Select-Object -First 30)
$seo.homeLang = (curl.exe -s "$base/" | findstr /I "<html lang=")
$seo.homeCanonical = (curl.exe -s "$base/" | findstr /I "rel=\"canonical\"")

$h1 = @{}
foreach ($path in @('/','/pricing','/blog','/about')) {
  $html = curl.exe -s "$base$path"
  $matches = [regex]::Matches($html, '<h1[^>]*>.*?</h1>', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
  $h1[$path] = @($matches | Select-Object -First 3 | ForEach-Object { $_.Value })
}
$seo.h1 = $h1
$result.seo = $seo

# Domain 3 - i18n
$i18n = [ordered]@{}
$i18n.englishCandidates = (rg -n '"[A-Z][a-z]+ [a-z]+' src/app --glob "*.tsx" | rg -v "className|import|type|interface|const|http|css|font|color|border|px|em|rem|#|//|src/app/api" | Select-Object -First 50)
$i18n.missingDiacritics = (rg -n "Phu huynh|hoc sinh|bai viet|trang chu|dat mua|dang nhap|dang ky" src/app --glob "*.tsx" | rg -v "//")
$result.i18n = $i18n

# Bonus
$bonus = [ordered]@{}
$bonus.typeCheckTail = (pnpm type-check 2>&1 | Select-Object -Last 30)
$bonus.checkI18nTail = (pnpm check:i18n 2>&1 | Select-Object -Last 20)
$bonus.testDirs = (Get-ChildItem src/app -Recurse -Directory -Filter "test-*" | ForEach-Object { $_.FullName })
$bonus.largeFilesTop = (Get-ChildItem src -Recurse -File -Include *.ts,*.tsx | ForEach-Object { [PSCustomObject]@{ Lines = (Get-Content $_.FullName | Measure-Object -Line).Lines; File = $_.FullName } } | Sort-Object Lines -Descending | Select-Object -First 15)
$result.bonus = $bonus

$result | ConvertTo-Json -Depth 10 | Set-Content -Encoding utf8 "plans/.qa-artifacts/shell-results.json"
Write-Output "Wrote plans/.qa-artifacts/shell-results.json"
