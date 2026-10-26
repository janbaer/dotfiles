#!/usr/bin/env bash
# Misst Laufzeit und Version aller laufenden Container im Homelab.
# Aufruf: measure.sh [ansible-homelab-Repo] [Ausgabedatei]
# Ausgabe: TSV mit host, container, image, laufzeit, version
set -uo pipefail

repo="${1:-$HOME/Projects/ansible-homelab}"
out="${2:-$(mktemp -d)/measurements.tsv}"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

cd "$repo" || exit 1
command -v go >/dev/null || { echo "go fehlt (nix develop oder go installieren)" >&2; exit 1; }

printf 'host\tcontainer\timage\truntime\tversion\n' > "$out"

# Die Probe läuft auf dem Host. Pro Container je eine Zeile; Binaries ohne Shell
# werden nach $d kopiert und danach lokal mit `go version` bzw. grep untersucht.
read -r -d '' probe <<'PROBE'
command -v docker >/dev/null || exit 0
d=$(mktemp -d)
echo "DIR $d"
for c in $(docker ps --format '{{ "{{" }}.Names{{ "}}" }}'); do
  img=$(docker inspect -f '{{ "{{" }}.Config.Image{{ "}}" }}' "$c")
  rt=$(docker exec "$c" sh -c 'for r in node bun python3 php; do v=$($r --version 2>&1 | head -1); case "$v" in *[0-9].[0-9]*) printf "RTV\t%s\t%s\n" "$r" "$v";; esac; done' 2>/dev/null | grep '^RTV')
  if [ -n "$rt" ]; then
    printf '%s\n' "$rt" | while IFS="$(printf '\t')" read -r _ r v; do printf 'RT\t%s\t%s\t%s\t%s\n' "$c" "$img" "$r" "$v"; done
    continue
  fi
  names="$(docker inspect -f '{{ "{{" }}.Path{{ "}}" }} {{ "{{" }}range .Args{{ "}}" }}{{ "{{" }}.{{ "}}" }} {{ "{{" }}end{{ "}}" }}' "$c" 2>/dev/null) $c ${img%%:*} gitea"
  i=0
  for n in $names; do
    n=${n##*/}
    for p in /$n /app/$n /usr/bin/$n /usr/local/bin/$n /bin/$n /app/gitea/$n /app/$n/$n; do
      i=$((i+1))
      [ "$(docker cp "$c:$p" - 2>/dev/null | head -c 512 | tar -tvf - 2>/dev/null | head -1 | cut -c1)" = "-" ] || continue
      docker cp "$c:$p" "$d/$c.$i" >/dev/null 2>&1 && echo "BIN	$c	$img	$p"
    done
  done
done
PROBE

while read -r host; do
  res=$(./execute.sh "$host" "$probe" 2>&1 </dev/null) || echo "Warnung: Probe auf $host fehlgeschlagen" >&2
  dir=$(printf '%s\n' "$res" | sed -n 's/^DIR //p' | head -1)
  [[ "$dir" =~ ^/tmp/tmp\.[A-Za-z0-9]+$ ]] || dir=
  printf '%s\n' "$res" | awk -F'\t' -v h="$host" '$1=="RT"{printf "%s\t%s\t%s\t%s\t%s\n", h,$2,$3,$4,$5}' >> "$out"
  [ -n "$dir" ] || continue
  mkdir -p "$work/$host"
  scp -q "$host:$dir/*" "$work/$host/" 2>/dev/null
  ssh -n "$host" "rm -rf $dir" >/dev/null 2>&1
  printf '%s\n' "$res" | awk -F'\t' '$1=="BIN"{print $2"\t"$3}' | sort -u | while IFS=$'\t' read -r c img; do
    for f in "$work/$host/$c".*; do
      [ -f "$f" ] || continue
      gv=$(go version "$f" 2>/dev/null | sed 's/^.*: //; s/ .*//; s/-X.*//')
      if [ -n "$gv" ]; then printf '%s\t%s\t%s\tgo\t%s\n' "$host" "$c" "$img" "${gv#go}" >> "$out"; break; fi
      rv=$(grep -a -o 'rustc [0-9]\+\.[0-9]\+\.[0-9]\+' "$f" | sort -u | head -1)
      if [ -n "$rv" ]; then printf '%s\t%s\t%s\trust\t%s\n' "$host" "$c" "$img" "${rv#rustc }" >> "$out"; break; fi
    done
  done
done < <(ansible all --list-hosts 2>/dev/null | sed -n 's/^ *//p' | grep '\.')

echo "$out"
