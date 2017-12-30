#!/bin/bash
file="$(cmus-remote -C 'echo {}')"

if [ -f "$file" ]; then
  mv "${file}" /media/music/_NEW/_GoodSongs && cmus-remote -C 'win-remove'
else
  echo "Oop, couldn't find selected track ${file}" >&2
fi
