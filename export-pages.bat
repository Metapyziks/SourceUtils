@echo off

"SourceUtils.WebExport\bin\x64\Debug\SourceUtils.WebExport.exe" export ^
	--maps "bhop_*,rj_*,surf_*" ^
	--outdir "..\MomReplayViewer-pages\resources" ^
	--gamedir "C:\Program Files (x86)\Steam\steamapps\common\Momentum Mod\momentum" ^
	--mapsdir "maps" ^
	--overwrite --verbose --url-prefix "./resources" ^
	--packages "sourceutilvpks/*_dir.vpk"

PAUSE