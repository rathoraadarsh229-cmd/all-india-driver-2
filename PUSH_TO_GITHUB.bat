@echo off
title GitHub Uploader - All India Driver
cd /d "C:\Users\ratho\Downloads\all-india-driver-app (2)"
echo =======================================================
echo       ALL INDIA DRIVER - GITHUB UPLOADER
echo =======================================================
echo.
echo Uploading all source code and folders to GitHub...
echo.
"C:\Users\ratho\mingit\cmd\git.exe" push -u origin main --force
echo.
echo =======================================================
echo Done! Please refresh your GitHub page in your browser.
echo =======================================================
pause
