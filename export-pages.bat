@echo off

if exist "..\SourceUtils-pages\js\" rd /q /s "..\SourceUtils-pages\js"
if exist "..\SourceUtils-pages\maps\" rd /q /s "..\SourceUtils-pages\maps"
if exist "..\SourceUtils-pages\materials\" rd /q /s "..\SourceUtils-pages\materials"
if exist "..\SourceUtils-pages\models\" rd /q /s "..\SourceUtils-pages\models"

"SourceUtils.WebExport\bin\Debug\SourceUtils.WebExport.exe" export ^
	--maps "de_overpass;de_dust2" --outdir "..\SourceUtils-pages" ^
	--gamedir "C:\Program Files (x86)\Steam\steamapps\common\Counter-Strike Global Offensive\csgo" ^
	--untextured --overwrite --verbose --url-prefix "https://metapyziks.github.io/SourceUtils"
