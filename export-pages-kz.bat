@echo off

"SourceUtils.WebExport\bin\Debug\SourceUtils.WebExport.exe" export ^
	--maps "kz_reach_v2,kz_colors_v2,kz_exps_cursedjourney" ^
	--outdir "..\GOKZReplayViewer-pages\resources" ^
	--gamedir "C:\Program Files (x86)\Steam\steamapps\common\Counter-Strike Global Offensive\csgo" ^
	--mapsdir "maps" ^
	--overwrite --verbose --url-prefix "/GOKZReplayViewer/resources"
