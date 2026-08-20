@echo off
setlocal enabledelayedexpansion
title OpenCatz Setup - Opencatz AI (Multichain Edition)

rem ---------------------------------------------------------------------------
rem  OPENCATZ SETUP - Opencatz AI (Multichain Edition) one-shot installer
rem  Steps: 1) Node check (warn-only)  2) git clone/pull  3) npm install
rem         4) npm run build  5) npm link  6) wizard if .env missing
rem  Critical failures: pause + exit /b 1
rem ---------------------------------------------------------------------------

rem --- ANSI colors if the console supports them, else plain text ---
set "ESC="
for /f %%i in ('echo prompt $E ^| cmd') do set "ESC=%%i"
if defined ESC (
  set "GREEN=%ESC%[0;32m"
  set "RED=%ESC%[0;31m"
  set "CYAN=%ESC%[0;36m"
  set "YELLOW=%ESC%[1;33m"
  set "BOLD=%ESC%[1m"
  set "LIME=%ESC%[38;2;204;255;0m"
  set "NC=%ESC%[0m"
) else (
  set "GREEN="
  set "RED="
  set "CYAN="
  set "YELLOW="
  set "BOLD="
  set "LIME="
  set "NC="
)

echo.
echo %LIME%%BOLD%       /\_____/\%NC%
echo %LIME%%BOLD%      /  ■   ■  \      🐾 OPENCATZ AI SETUP 🐾%NC%
echo %LIME%%BOLD%     ( ==  ^  == )     Autonomous Multichain Trading Swarm%NC%
echo %LIME%%BOLD%      )    ~    (      Solana • Robinhood Chain • EVM • Perps • NFTs%NC%
echo %LIME%%BOLD%     (   _____   )     "Chill trades, 9 lives, sharp alpha." • opencatz.xyz%NC%
echo %LIME%%BOLD%    ( (  )   (  ) )%NC%
echo %LIME%%BOLD%   (__(__)___(__)__)%NC%
echo.

rem --- [1/6] Runtime check (warn + continue) ---
echo %CYAN%%BOLD%--- [1/6] Runtime check ---%NC%
node --version >nul 2>&1
if errorlevel 1 (
  echo %YELLOW%Warning: Node.js not found. Install Node ^>= 22.12 from https://nodejs.org and re-run setup.%NC%
) else (
  node --version | findstr /R /C:"v2[2-9]" /C:"v[3-9][0-9]" >nul
  if errorlevel 1 (
    for /f "delims=" %%v in ('node --version') do set "NODE_VER=%%v"
    echo %YELLOW%Warning: found Node !NODE_VER! - OpenCatz requires ^>= 22.12. Install from https://nodejs.org and re-run setup.%NC%
  ) else (
    echo %GREEN%Node %BOLD%found ^>= v22%NC%
  )
)
call npm --version >nul 2>&1
if errorlevel 1 (
  echo %RED%ERROR: npm not found. Install Node.js (includes npm) first.%NC%
  pause
  exit /b 1
)
echo %GREEN%OK: node + npm available%NC%

rem --- [2/6] Source code ---
echo %CYAN%%BOLD%--- [2/6] Source code ---%NC%
if not exist package.json (
  set "REPO_URL=https://github.com/dizcorvus/opencatz-ai.git"
  if defined OPENCATZ_REPO_URL set "REPO_URL=%OPENCATZ_REPO_URL%"
  echo %YELLOW%No repo found. Cloning %BOLD%!REPO_URL!%NC% ...
  git clone "!REPO_URL!" .
  if errorlevel 1 (
    echo %RED%ERROR: git clone failed.%NC%
    pause
    exit /b 1
  )
  echo %GREEN%Cloned into current directory%NC%
) else (
  git rev-parse --is-inside-work-tree >nul 2>&1
  if errorlevel 1 (
    echo %RED%ERROR: package.json exists but this is not a git repo - move the project or clone fresh.%NC%
    pause
    exit /b 1
  )
  echo %YELLOW%Existing repo detected. Running git pull --ff-only ...%NC%
  git pull --ff-only
  if errorlevel 1 (
    echo %YELLOW%Warning: git pull failed - continuing with local files.%NC%
  ) else (
    echo %GREEN%Code up to date%NC%
  )
)

rem --- [3/6] Dependencies ---
echo %CYAN%%BOLD%--- [3/6] Dependencies ---%NC%
call npm install
if errorlevel 1 (
  echo %RED%ERROR: npm install failed.%NC%
  pause
  exit /b 1
)
echo %GREEN%OK: dependencies installed%NC%

rem --- [4/6] Build ---
echo %CYAN%%BOLD%--- [4/6] Build ---%NC%
call npm run build
if errorlevel 1 (
  echo %RED%ERROR: npm run build failed.%NC%
  pause
  exit /b 1
)
echo %GREEN%OK: TypeScript compiled to dist/%NC%

rem --- [5/6] CLI link ---
echo %CYAN%%BOLD%--- [5/6] CLI link ---%NC%
call npm link >nul 2>&1
if errorlevel 1 (
  echo %YELLOW%Warning: npm link failed - continuing (you can run via node bin\opencatz.js)%NC%
) else (
  echo %GREEN%OK: opencatz CLI linked globally%NC%
)

rem --- [6/6] Configuration ---
echo %CYAN%%BOLD%--- [6/6] Configuration ---%NC%
if not exist .env (
  echo %YELLOW%No .env found - launching OpenCatz onboarding wizard...%NC%
  call npm run wizard
) else (
  echo %YELLOW%.env already exists - skipping wizard (rerun anytime: opencatz wizard)%NC%
)

echo.
echo %GREEN%%BOLD%======================================================================%NC%
echo %GREEN%%BOLD%  OPENCATZ AI MULTICHAIN IS INSTALLED%NC%
echo %GREEN%%BOLD%======================================================================%NC%
echo.
echo %BOLD%Terminal:%NC%    opencatz terminal     # command center TUI
echo %BOLD%OpenCatz:%NC%    opencatz run          # dev mode / opencatz deploy (PM2 daemon)
echo %BOLD%Health:%NC%      opencatz doctor ^| opencatz test ^| opencatz update
echo.
pause
