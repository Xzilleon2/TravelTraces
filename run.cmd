@echo off
setlocal EnableExtensions

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"
set "PYTHON_EXE=%BACKEND%\.venv\Scripts\python.exe"
set "API_URL=http://127.0.0.1:8000"
set "WEB_URL=http://127.0.0.1:3000"

cd /d "%ROOT%" || exit /b 1

if /I "%~1"=="website" goto website
if /I "%~1"=="api" goto api
if /I "%~1"=="frontend" goto frontend
if /I "%~1"=="build" goto build
goto usage

:website
call :bootstrap_backend || exit /b 1
call :bootstrap_frontend || exit /b 1
call :start_api || exit /b 1
call :start_frontend || exit /b 1
call :wait_url "%API_URL%/health" 45 || exit /b 1
call :wait_url "%WEB_URL%" 45 || exit /b 1
echo.
echo TravelPlaces is running:
echo   Website: %WEB_URL%
echo   API:     %API_URL%
echo.
echo Close the "TravelPlaces API" and "TravelPlaces Website" windows to stop it.
exit /b 0

:api
call :bootstrap_backend || exit /b 1
call :start_api || exit /b 1
call :wait_url "%API_URL%/health" 45 || exit /b 1
echo API running at %API_URL%
exit /b 0

:frontend
call :bootstrap_frontend || exit /b 1
call :start_frontend || exit /b 1
call :wait_url "%WEB_URL%" 45 || exit /b 1
echo Website running at %WEB_URL%
exit /b 0

:bootstrap_backend
if not exist "%BACKEND%\app\main.py" (
  echo Missing backend app at "%BACKEND%\app\main.py".
  exit /b 1
)
if not exist "%BACKEND%\data" mkdir "%BACKEND%\data"
if not exist "%BACKEND%\data\uploads" mkdir "%BACKEND%\data\uploads"
set "PYTHON_BOOTSTRAP=python"
where python >nul 2>nul
if errorlevel 1 (
  where py >nul 2>nul
  if errorlevel 1 (
    echo Python was not found on PATH. Install Python 3 and reopen VS Code.
    exit /b 1
  )
  set "PYTHON_BOOTSTRAP=py -3"
)
if not exist "%PYTHON_EXE%" (
  echo Creating backend virtual environment...
  %PYTHON_BOOTSTRAP% -m venv "%BACKEND%\.venv" || exit /b 1
)
"%PYTHON_EXE%" --version >nul 2>nul
if errorlevel 1 (
  echo Existing backend virtual environment is not usable. Recreating it...
  rmdir /s /q "%BACKEND%\.venv" || exit /b 1
  %PYTHON_BOOTSTRAP% -m venv "%BACKEND%\.venv" || exit /b 1
)
echo Installing backend dependencies...
"%PYTHON_EXE%" -m pip install --disable-pip-version-check -r "%BACKEND%\requirements.txt" || exit /b 1
exit /b 0

:bootstrap_frontend
if not exist "%FRONTEND%\package.json" (
  echo Missing frontend package.json at "%FRONTEND%\package.json".
  exit /b 1
)
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found on PATH.
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found on PATH.
  exit /b 1
)
if not exist "%FRONTEND%\node_modules" (
  echo Installing frontend dependencies...
  pushd "%FRONTEND%" || exit /b 1
  if exist package-lock.json (
    call npm.cmd ci || (popd & exit /b 1)
  ) else (
    call npm.cmd install || (popd & exit /b 1)
  )
  popd
) else (
  echo Frontend dependencies already installed.
)
exit /b 0

:start_api
call :port_open 8000
if not errorlevel 1 (
  echo API already listening at %API_URL%.
  exit /b 0
)
set "API_CMD=%TEMP%\travelplaces-api-%RANDOM%-%RANDOM%.cmd"
> "%API_CMD%" echo @echo off
>> "%API_CMD%" echo cd /d "%BACKEND%"
>> "%API_CMD%" echo set APP_ENV=local
>> "%API_CMD%" echo set REQUIRE_AUTH=false
>> "%API_CMD%" echo set AUTH_COOKIE_SECURE=false
>> "%API_CMD%" echo set API_CORS_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
>> "%API_CMD%" echo set TRAVELPLACES_DB_PATH=%BACKEND%\data\TravelPlaces.db
>> "%API_CMD%" echo "%PYTHON_EXE%" -m uvicorn app.main:app --host 127.0.0.1 --port 8000
echo Starting API...
start "TravelPlaces API" cmd /k "%API_CMD%"
exit /b 0

:start_frontend
call :port_open 3000
if not errorlevel 1 (
  echo Website already listening at %WEB_URL%.
  exit /b 0
)
set "WEB_CMD=%TEMP%\travelplaces-web-%RANDOM%-%RANDOM%.cmd"
> "%WEB_CMD%" echo @echo off
>> "%WEB_CMD%" echo cd /d "%FRONTEND%"
>> "%WEB_CMD%" echo set VITE_API_PROXY_TARGET=%API_URL%
>> "%WEB_CMD%" echo set VITE_API_BASE_URL=
>> "%WEB_CMD%" echo call npm.cmd run dev
echo Starting website...
start "TravelPlaces Website" cmd /k "%WEB_CMD%"
exit /b 0

:build
call :bootstrap_frontend || exit /b 1
pushd "%FRONTEND%" || exit /b 1
call npm.cmd run build || (popd & exit /b 1)
call npm.cmd run lint || (popd & exit /b 1)
popd
echo Build and TypeScript checks passed.
exit /b 0

:port_open
netstat -ano -p tcp | findstr /R /C:":%~1 .*LISTENING" >nul 2>nul
exit /b %ERRORLEVEL%

:wait_url
powershell -NoProfile -ExecutionPolicy Bypass -Command "$u='%~1'; $deadline=(Get-Date).AddSeconds([int]'%~2'); do { try { $r=Invoke-WebRequest -UseBasicParsing $u -TimeoutSec 2; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { exit 0 } } catch {}; Start-Sleep -Milliseconds 750 } until ((Get-Date) -gt $deadline); Write-Host ('Timed out waiting for ' + $u); exit 1"
exit /b %ERRORLEVEL%

:usage
echo Usage:
echo   run.cmd website   Start backend API and frontend website
echo   run.cmd api       Start backend API only
echo   run.cmd frontend  Start frontend website only
echo   run.cmd build     Build frontend and run TypeScript checks
exit /b 1
