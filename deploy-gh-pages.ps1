# Ensure script stops on error
$ErrorActionPreference = "Stop"

Write-Host "Building project..." -ForegroundColor Green
pnpm build

Write-Host "Creating temporary directory..." -ForegroundColor Green
$tmp_dir = Join-Path ([System.IO.Path]::GetTempPath()) "gh-pages-deploy"
New-Item -ItemType Directory -Path $tmp_dir -Force | Out-Null

Write-Host "Copying build output to temporary directory..." -ForegroundColor Green
Copy-Item -Path "dist/*" -Destination $tmp_dir -Recurse -Force

Write-Host "Switching to gh-pages branch..." -ForegroundColor Green
git checkout gh-pages

Write-Host "Pulling latest changes from remote..." -ForegroundColor Green
git pull origin gh-pages --rebase

Write-Host "Cleaning current branch files (except .git)..." -ForegroundColor Green
Get-ChildItem -Path . -Exclude ".git" -Recurse | Remove-Item -Recurse -Force

Write-Host "Copying build output to current branch..." -ForegroundColor Green
Copy-Item -Path "$tmp_dir/*" -Destination . -Recurse -Force

Write-Host "Adding .nojekyll file..." -ForegroundColor Green
New-Item -ItemType File -Path ".nojekyll" -Force | Out-Null

Write-Host "Adding and committing changes..." -ForegroundColor Green
git add .
git commit -m "Update GitHub Pages deployment"

Write-Host "Pushing to remote repository..." -ForegroundColor Green
git push origin gh-pages

Write-Host "Cleaning temporary directory..." -ForegroundColor Green
Remove-Item -Path $tmp_dir -Recurse -Force

Write-Host "Switching back to main branch..." -ForegroundColor Green
git checkout main

Write-Host "Deployment completed! GitHub Pages should be accessible soon." -ForegroundColor Green