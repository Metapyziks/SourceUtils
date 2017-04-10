@echo off

"SourceUtils.WebExport\bin\Debug\SourceUtils.WebExport.exe" export ^
	--maps "de_overpass;de_cbble;de_inferno;de_mirage;de_cache;de_nuke;de_train" ^
	--outdir "..\SourceUtils-pages" ^
	--gamedir "C:\Program Files (x86)\Steam\steamapps\common\Counter-Strike Global Offensive\csgo" ^
	--untextured --overwrite --verbose --url-prefix "https://metapyziks.github.io/SourceUtils"
