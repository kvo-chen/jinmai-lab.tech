# Ensure script stops on error
$ErrorActionPreference = "Stop"

Write-Host "Building project..." -ForegroundColor Green
pnpm build

Write-Host "Switching to main branch..." -ForegroundColor Green
git checkout main

Write-Host "Pulling latest changes from remote..." -ForegroundColor Green
git pull origin main --rebase

Write-Host "Cleaning old build files..." -ForegroundColor Green
Remove-Item -Path "index.html" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "assets" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Copying build output to main branch..." -ForegroundColor Green
Copy-Item -Path "dist/index.html" -Destination "." -Force
Copy-Item -Path "dist/assets" -Destination "." -Recurse -Force

Write-Host "Adding .nojekyll file..." -ForegroundColor Green
New-Item -ItemType File -Path ".nojekyll" -Force | Out-Null

Write-Host "Adding changes..." -ForegroundColor Green
git add index.html assets .nojekyll

Write-Host "Committing changes..." -ForegroundColor Green
git commit -m "Deploy to main branch"

Write-Host "Pushing to remote repository..." -ForegroundColor Green
git push origin main

Write-Host "Deployment completed! GitHub Pages should be accessible soon." -ForegroundColor Green