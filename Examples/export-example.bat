@echo off

:: !IMPORTANT! Which maps to export. Can use "*" as a wildcard, for example "de_*,cs_*".
SET MAPS="de_overpass,de_cache,de_cbble"

:: !IMPORTANT! Directory to export to.
SET OUTPUT_DIR="exported"

:: !IMPORTANT! Should be the root URL of where the exported files will be on your web server.
:: For example, if the output directory will be at "http://your-website.com/foo/exported", this
:: should be either "/foo/exported" or "http://your-website.com/foo/exported"
SET URL_PREFIX="/"

:: This can be set to "true" if you wish to pause at the end of the script (eg. debugging purposes)
SET SHOULD_PAUSE="false"

:: Game install folder (should work for other Source games)
SET GAME_DIR="C:\Program Files (x86)\Steam\steamapps\common\Counter-Strike Global Offensive\csgo"

:: Game package file names, just need the _dir.vpk
SET PACKAGES="pak01_dir.vpk"

:: Where to look for the specified maps, relative to the game install folder
SET MAPS_DIR="maps"

:: Extra options: --overwrite, --verbose, --untextured
SET OPTIONS="--overwrite --verbose"

"bin\SourceUtils.WebExport.exe" ^
export ^
    --maps %MAPS% ^
    --outdir %OUTPUT_DIR% ^
    --gamedir %GAME_DIR% ^
    --mapsdir %MAPS_DIR% ^
    --packages %PACKAGES% ^
    --url-prefix %URL_PREFIX% ^
    %OPTIONS:"=%

if %SHOULD_PAUSE% == "true" pause
