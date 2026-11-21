#!/bin/sh
# 作業用: プレビューを描いて切り出す。 tools/pv.sh name scale crop(x0,y0,x1,y1 in cell px) -- specs...
S=/tmp/claude-0/-home-user-mamo-ken/30642d49-f1fc-5484-a1ca-03481aa56077/scratchpad
name=$1; scale=$2; shift 2
node tools/preview.mjs $S/$name.png $scale "$@"
