# ============================================================
#  KTSapps — move the project somewhere permanent and push to GitHub.
#
#  Run in PowerShell:
#     cd "<folder containing this script>"
#     ./deploy.ps1 -GitHubUser YOUR-USERNAME
#
#  Add -Public if you want the repo public (default is private).
# ============================================================

param(
  [Parameter(Mandatory = $true)][string]$GitHubUser,
  [string]$RepoName = "KTSapps",
  [string]$Destination = "$env:USERPROFILE\Projects\ktsapps-site",
  [switch]$Public
)

$ErrorActionPreference = "Stop"
function Step($m) { Write-Host "`n==> $m" -ForegroundColor Cyan }
function Ok($m)   { Write-Host "    $m" -ForegroundColor Green }
function Warn($m) { Write-Host "    $m" -ForegroundColor Yellow }

# ---------- 0. Prerequisites ----------
Step "Checking prerequisites"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Host "git is not installed. Get it from https://git-scm.com/download/win" -ForegroundColor Red
  exit 1
}
Ok "git $(git --version | Select-String -Pattern '[\d.]+' | ForEach-Object { $_.Matches[0].Value })"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js is not installed. Get the LTS build from https://nodejs.org" -ForegroundColor Red
  exit 1
}
Ok "node $(node --version)"

$hasGh = [bool](Get-Command gh -ErrorAction SilentlyContinue)
if ($hasGh) { Ok "GitHub CLI found — the repo will be created automatically" }
else        { Warn "GitHub CLI not found — you'll create the repo in the browser (instructions at the end)" }

# ---------- 1. Copy out of the Claude session folder ----------
# The session folder is temporary. The project needs to live somewhere stable.
Step "Copying project to $Destination"

$source = $PSScriptRoot
if (Test-Path $Destination) {
  $answer = Read-Host "    $Destination already exists. Overwrite? (y/N)"
  if ($answer -ne "y") { Write-Host "Cancelled."; exit 0 }
  Remove-Item -Recurse -Force $Destination
}
New-Item -ItemType Directory -Force -Path $Destination | Out-Null

Get-ChildItem -Path $source -Force |
  Where-Object { $_.Name -notin @("node_modules", "_site", ".git", ".env") } |
  ForEach-Object { Copy-Item $_.FullName -Destination $Destination -Recurse -Force }

Set-Location $Destination
Ok "Copied"

# ---------- 2. Point the CMS at the right repo ----------
Step "Configuring the CMS backend"

$cfgPath = "public\admin\config.yml"
(Get-Content $cfgPath -Raw) -replace
  "repo:\s*YOUR-GITHUB-USERNAME/ktsapps-site", "repo: $GitHubUser/$RepoName" |
  Set-Content $cfgPath -NoNewline
Ok "config.yml now points at $GitHubUser/$RepoName"

# ---------- 3. Verify it builds before pushing ----------
Step "Installing dependencies and test-building"

npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { Write-Host "npm install failed." -ForegroundColor Red; exit 1 }

npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed — not pushing a broken build." -ForegroundColor Red; exit 1 }
Ok "Build succeeded — _site/ generated"

# ---------- 4. Commit ----------
Step "Creating the git repository"

git init -b main | Out-Null
git add .
git -c user.email="keytosuccessapps@gmail.com" -c user.name="$GitHubUser" `
    commit -m "KTSapps landing page, CMS and analytics dashboard" | Out-Null
Ok "Committed $(git rev-list --count HEAD) commit, $((git ls-files).Count) files"

# .env is gitignored, so no secrets are in this commit.
if (git ls-files | Select-String -Quiet "^\.env$") {
  Write-Host "STOP: .env was staged. Remove it before pushing." -ForegroundColor Red
  exit 1
}
Ok "No secrets staged (.env excluded)"

# ---------- 5. Push ----------
Step "Pushing to GitHub"

if ($hasGh) {
  $visibility = if ($Public) { "--public" } else { "--private" }
  gh repo create "$GitHubUser/$RepoName" $visibility --source=. --remote=origin --push
  if ($LASTEXITCODE -eq 0) {
    Ok "Pushed to https://github.com/$GitHubUser/$RepoName"
  } else {
    Warn "gh failed — you may need to run 'gh auth login' first, then re-run this script."
    exit 1
  }
} else {
  git remote add origin "https://github.com/$GitHubUser/$RepoName.git"
  Write-Host @"

    Create the repository first, then push:

      1. Open https://github.com/new
      2. Repository name: $RepoName
      3. Visibility: $(if ($Public) { 'Public' } else { 'Private' })
      4. Do NOT add a README, .gitignore or licence — this repo already has them
      5. Click 'Create repository'

    Then run:

      cd "$Destination"
      git push -u origin main

"@ -ForegroundColor Yellow
}

# ---------- Done ----------
Write-Host @"

============================================================
 Project is at: $Destination
 Repo:          github.com/$GitHubUser/$RepoName

 Next: connect a host, using these build settings —

   Build command:      npm run build
   Publish directory:  _site

 Then set these environment variables on the host:

   UMAMI_API_KEY      (Umami -> Settings -> API keys -> Create key)
   UMAMI_WEBSITE_ID   e95cf66f-d447-4b22-af77-41752a1daf44
   STATS_PASSWORD     (whatever you want to type at /stats)

 Local development from now on:  npm run dev
============================================================

"@ -ForegroundColor Cyan
