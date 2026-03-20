$ErrorActionPreference = "Stop"

$repoRoot = "D:\project\cungcontuhoc"
$scenePath = Join-Path $repoRoot "src\components\kid-sky-garden\KidSkyGardenScene.tsx"
$cssPath = Join-Path $repoRoot "src\components\kid-sky-garden\sky-garden.css"
$outputDir = Join-Path $repoRoot "output\playwright"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path $repoRoot ".tmp\hud-compare-backup-$timestamp"
$authBackupPath = Join-Path $backupDir "auth-backup.json"
$serverStdout = Join-Path $backupDir "server.stdout.log"
$serverStderr = Join-Path $backupDir "server.stderr.log"

$serverProcess = $null
$authUpdated = $false

New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

Copy-Item -LiteralPath $scenePath -Destination (Join-Path $backupDir "KidSkyGardenScene.tsx") -Force
Copy-Item -LiteralPath $cssPath -Destination (Join-Path $backupDir "sky-garden.css") -Force

try {
  $authSetupScript = @'
const fs = require("node:fs");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const backupPath = process.env.AUTH_BACKUP_PATH;
const targetEmail = "manhquy@vk.com";
const tempPassword = "DemoPass123!";

async function main() {
  const prisma = new PrismaClient();
  const parent = await prisma.parentAccount.findFirst({
    where: { email: { equals: targetEmail, mode: "insensitive" } },
    select: { id: true, passwordHash: true },
  });
  if (!parent) {
    throw new Error(`Parent not found for ${targetEmail}`);
  }

  const user = await prisma.user.findFirst({
    where: { parentId: parent.id },
    select: { id: true },
  });
  if (!user) {
    throw new Error(`User not found for parent ${parent.id}`);
  }

  const account = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
    select: { id: true, password: true },
  });
  if (!account?.password) {
    throw new Error(`Credential account password is missing for user ${user.id}`);
  }

  fs.writeFileSync(
    backupPath,
    JSON.stringify(
      {
        parentId: parent.id,
        parentPasswordHash: parent.passwordHash,
        accountId: account.id,
        accountPassword: account.password,
      },
      null,
      2,
    ),
  );

  const nextHash = await bcrypt.hash(tempPassword, 12);
  await prisma.parentAccount.update({
    where: { id: parent.id },
    data: { passwordHash: nextHash },
  });
  await prisma.account.update({
    where: { id: account.id },
    data: { password: nextHash },
  });

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
'@

  $env:AUTH_BACKUP_PATH = $authBackupPath
  $authSetupScript | node -
  $authUpdated = $true

  $serverProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "pnpm dev --port 3101" -WorkingDirectory $repoRoot -RedirectStandardOutput $serverStdout -RedirectStandardError $serverStderr -PassThru

  $ready = $false
  for ($i = 0; $i -lt 120; $i++) {
    Start-Sleep -Milliseconds 1000
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:3101/auth/login" -TimeoutSec 3
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        $ready = $true
        break
      }
    } catch {
      # continue polling
    }
  }

  if (-not $ready) {
    throw "Dev server did not become ready on port 3101."
  }

  $beforeScene = git show "HEAD:src/components/kid-sky-garden/KidSkyGardenScene.tsx"
  if ($LASTEXITCODE -ne 0) {
    throw "Unable to read HEAD version of KidSkyGardenScene.tsx"
  }
  $beforeCss = git show "HEAD:src/components/kid-sky-garden/sky-garden.css"
  if ($LASTEXITCODE -ne 0) {
    throw "Unable to read HEAD version of sky-garden.css"
  }

  [System.IO.File]::WriteAllText($scenePath, $beforeScene, [System.Text.UTF8Encoding]::new($false))
  [System.IO.File]::WriteAllText($cssPath, $beforeCss, [System.Text.UTF8Encoding]::new($false))

  Start-Sleep -Milliseconds 2000

  $env:HUD_BASE_URL = "http://127.0.0.1:3101"
  $env:HUD_EMAIL = "manhquy@vk.com"
  $env:HUD_PASSWORD = "DemoPass123!"
  $env:HUD_CHILD_ID = "cmmn9hr2w0006mmt8dicgnatk"
  $env:HUD_COURSE_SLUG = "little-fox-en-level-1"
  $env:HUD_OUTPUT_DIR = "output/playwright"

  node .tmp/capture-kid-course-hud.mjs before
  if ($LASTEXITCODE -ne 0) {
    throw "Playwright before capture failed."
  }

  Copy-Item -LiteralPath (Join-Path $backupDir "KidSkyGardenScene.tsx") -Destination $scenePath -Force
  Copy-Item -LiteralPath (Join-Path $backupDir "sky-garden.css") -Destination $cssPath -Force

  Start-Sleep -Milliseconds 2000

  node .tmp/capture-kid-course-hud.mjs after
  if ($LASTEXITCODE -ne 0) {
    throw "Playwright after capture failed."
  }
}
finally {
  Copy-Item -LiteralPath (Join-Path $backupDir "KidSkyGardenScene.tsx") -Destination $scenePath -Force -ErrorAction SilentlyContinue
  Copy-Item -LiteralPath (Join-Path $backupDir "sky-garden.css") -Destination $cssPath -Force -ErrorAction SilentlyContinue

  if ($authUpdated -and (Test-Path $authBackupPath)) {
    $authRestoreScript = @'
const fs = require("node:fs");
const { PrismaClient } = require("@prisma/client");

const backupPath = process.env.AUTH_BACKUP_PATH;

async function main() {
  const payload = JSON.parse(fs.readFileSync(backupPath, "utf8"));
  const prisma = new PrismaClient();

  await prisma.parentAccount.update({
    where: { id: payload.parentId },
    data: { passwordHash: payload.parentPasswordHash },
  });
  await prisma.account.update({
    where: { id: payload.accountId },
    data: { password: payload.accountPassword },
  });

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
'@
    $env:AUTH_BACKUP_PATH = $authBackupPath
    $authRestoreScript | node -
  }

  if ($serverProcess -and -not $serverProcess.HasExited) {
    Stop-Process -Id $serverProcess.Id -Force
  }
}
