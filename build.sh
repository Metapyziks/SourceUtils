#!/bin/bash

nuget restore
xbuild /p:Configuration=Release
