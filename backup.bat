REM Command: .\backup.bat

@echo off
setlocal

echo.
echo ==========================================
echo          PROJECT BACKUP
echo ==========================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$project=(Get-Location).Path; $parent=Split-Path $project -Parent; $name=Split-Path $project -Leaf; $date=Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'; $zip=Join-Path $parent ($name+'_backup_'+$date+'.zip'); Write-Host ('Project : '+$project); Write-Host ('Output  : '+$zip); Write-Host ''; Write-Host 'Creating ZIP...'; $files=Get-ChildItem -LiteralPath $project -Recurse -File -Force | Where-Object { $_.FullName -notlike '*\node_modules\*' -and $_.FullName -notlike '*\dist\*' -and $_.FullName -notlike '*\build\*' -and $_.FullName -notlike '*\.cache\*' -and $_.FullName -notlike '*\.vite\*' }; $root=Join-Path $env:TEMP ('backup_'+[guid]::NewGuid()); New-Item -ItemType Directory -Path (Join-Path $root $name) -Force | Out-Null; foreach($file in $files){$relative=$file.FullName.Substring($project.Length).TrimStart('\'); $destination=Join-Path (Join-Path $root $name) $relative; New-Item -ItemType Directory -Path (Split-Path $destination) -Force | Out-Null; Copy-Item $file.FullName $destination -Force}; Compress-Archive -Path (Join-Path $root $name) -DestinationPath $zip -CompressionLevel Optimal -Force; Remove-Item $root -Recurse -Force; Write-Host ''; Write-Host '=========================================='; Write-Host '       BACKUP COMPLETED SUCCESSFULLY'; Write-Host '=========================================='; Write-Host ''; Write-Host ('ZIP FILE: '+$zip); Write-Host ''"

pause
