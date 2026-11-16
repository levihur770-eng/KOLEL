@echo off
rem Double-click this file to get the newest work from GitHub and start the Kolel Register.
cd /d "%~dp0"

echo.
echo Step 1 of 3: Getting the newest work from GitHub...
git fetch --all --prune
if errorlevel 1 goto :fail

rem Pick the branch on GitHub that changed most recently.
set BRANCH=
for /f "delims=" %%b in ('git for-each-ref --sort=-committerdate --count=1 --exclude=refs/remotes/origin/HEAD --format="%%(refname:lstrip=3)" refs/remotes/origin') do set BRANCH=%%b
if "%BRANCH%"=="" goto :fail
echo Newest version: %BRANCH%

rem Put aside any accidental local changes, then switch to the newest version.
git stash push --include-untracked --quiet >nul 2>&1
git checkout -B "%BRANCH%" "origin/%BRANCH%"
if errorlevel 1 goto :fail
if not exist package.json (
  echo.
  echo The app has not been created yet. Nothing to start.
  goto :end
)

rem Stop a copy of the app that may still be running from an earlier test.
rem It keeps files locked, and then installing fails ("EPERM").
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -like '*KOLEL*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1

echo.
echo Step 2 of 3: Installing what the app needs. The first time this takes a few minutes...
rem "npm install" only changes what is new, so it does not delete files that are in use.
call npm install --no-audit --no-fund
if %errorlevel% neq 0 (
  echo.
  echo Installing failed. Trying once more in 5 seconds...
  timeout /t 5 /nobreak >nul
  call npm install --no-audit --no-fund
)
if %errorlevel% neq 0 (
  echo.
  echo Installing still failed. Close every other black Kolel window, wait a
  echo minute, and double-click test-latest.bat again. If it keeps failing,
  echo restart the computer and try again.
  goto :fail
)

echo.
echo Step 3 of 3: Starting the app. Chrome should open by itself.
echo If it does not, open http://localhost:5173 in Chrome.
echo To stop the app, close this window.
echo.
call npm run dev -- --open
goto :end

:fail
echo.
echo Something went wrong. Take a screenshot of this window and send it to Claude.

:end
echo.
pause
