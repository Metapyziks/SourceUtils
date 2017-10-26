@echo off

"SourceUtils.WebExport\bin\Debug\SourceUtils.WebExport.exe" export ^
	--maps "de_*" ^
	--outdir "..\SourceUtils-pages" ^
	--gamedir "C:\Program Files (x86)\Steam\steamapps\common\Counter-Strike Global Offensive\csgo" ^
	--mapsdir "maps" ^
	--untextured --overwrite --verbose --url-prefix "https://metapyziks.github.io/SourceUtils"
