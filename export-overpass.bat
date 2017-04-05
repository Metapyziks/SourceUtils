@echo off

"SourceUtils.WebExport\bin\Debug\SourceUtils.WebExport.exe" export ^
	--map "de_overpass" --outdir "Exported" ^
	--gamedir "C:\Program Files (x86)\Steam\steamapps\common\Counter-Strike Global Offensive\csgo" ^
	--untextured --overwrite --verbose --url-prefix "https://Metapyziks.github.io/SourceUtils"
