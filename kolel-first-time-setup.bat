@echo off
rem Double-click this file ONCE on a computer that does not have the Kolel
rem Register yet. It copies the project from GitHub into Documents\KOLEL and
rem starts it. After that, use test-latest.bat inside that folder.
set TARGET=%USERPROFILE%\Documents\KOLEL

if exist "%TARGET%\test-latest.bat" goto :start

echo.
echo Copying the project from GitHub into %TARGET% ...
git clone https://github.com/levihur770-eng/KOLEL "%TARGET%"
if errorlevel 1 goto :fail

:start
call "%TARGET%\test-latest.bat"
goto :eof

:fail
echo.
echo Something went wrong. Take a screenshot of this window and send it to Claude.
echo.
pause
