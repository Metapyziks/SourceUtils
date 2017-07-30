#!/bin/bash

nuget restore
xbuild /p:Configuration=Debug /p:DefineConstants=LINUX
tsc -p "SourceUtils.WebExport/Resources/"
