@echo off

:: Map to open in your web browser
SET INITIAL_MAP="de_mirage"

:: This can be set to "true" if you wish to pause at the end of the script (eg. debugging purposes)
SET SHOULD_PAUSE="false"

:: Game install folder (should work for other Source games)
SET GAME_DIR="C:\Program Files (x86)\Steam\steamapps\common\Counter-Strike Global Offensive\csgo"

:: Where to look for maps, relative to the game install folder
SET MAPS_DIR="maps"

:: Launch a browser window
start "" "http://localhost:8080/maps/%INITIAL_MAP%/index.html"

:: Extra options: --overwrite, --verbose, --untextured
SET OPTIONS="--untextured"

echo Launching web server...
"bin\SourceUtils.WebExport.exe" ^
host ^
    --gamedir %GAME_DIR% ^
    --mapsdir %MAPS_DIR% ^
    %OPTIONS:"=%

if %SHOULD_PAUSE% == "true" pause