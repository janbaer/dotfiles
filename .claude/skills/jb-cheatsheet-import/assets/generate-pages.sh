#!/usr/bin/env bash
# Generate one cheat sheet page per row of a metadata table.
#
# Usage: generate-pages.sh <table.tsv> [vault-cheatsheets-dir]
#
# Row format, "~" separated, one sheet per line:
#   slug~topic~files~title~description~keywords~refs[~tags]
#     files - one or more artifact filenames, comma separated
#     refs  - "Target — why it is related", semicolon separated
#             ([[Cheatsheets]] is added automatically)
#     tags  - optional, overrides the per-topic default below
# Set STATUS_DRAFT to a space separated list of slugs that should get status: draft.
set -euo pipefail

TABLE=${1:?usage: generate-pages.sh <table.tsv> [cheatsheets-dir]}
C=${2:-$HOME/Documents/Obsidian/Cheatsheets}
TODAY=$(date +%F)
STATUS_DRAFT=${STATUS_DRAFT:-}

tags_for() {
  case "$1" in
    k8s)           echo "k8s, reference" ;;
    docker)        echo "docker, container, reference" ;;
    terraform)     echo "terraform, reference" ;;
    linux)         echo "linux, reference" ;;
    git)           echo "git, reference" ;;
    devops)        echo "devops, troubleshooting, reference" ;;
    security)      echo "security, ci-cd, reference" ;;
    observability) echo "monitoring, reference" ;;
    ai)            echo "ai, devops, reference" ;;
    networking)    echo "network, reference" ;;
    python)        echo "python, reference" ;;
    rust)          echo "rust, reference" ;;
    coding)        echo "coding, reference" ;;
    databases)     echo "reference" ;;
    cloud)         echo "cloud, reference" ;;
    *)             echo "reference" ;;
  esac
}

count=0
while IFS='~' read -r slug topic files title desc keywords refs tags; do
  [ -z "${slug// }" ] && continue
  case "$slug" in \#*) continue ;; esac

  mkdir -p "$C/$topic/files"
  st=active
  for d in $STATUS_DRAFT; do [ "$d" = "$slug" ] && st=draft; done

  {
    printf -- '---\ncreated: %s\nupdated: %s\ntype: reference\ntags: [%s]\nstatus: %s\n---\n\n' \
      "$TODAY" "$TODAY" "${tags:-$(tags_for "$topic")}" "$st"
    printf '# %s\n\n%s\n\n**Keywords:** %s\n\n' "$title" "$desc" "$keywords"
    IFS=',' read -ra farr <<< "$files"
    for f in "${farr[@]}"; do printf '![[%s]]\n' "${f# }"; done
    printf '\n## References\n\n- [[Cheatsheets]] — cheat sheet index\n'
    IFS=';' read -ra rarr <<< "$refs"
    for r in "${rarr[@]}"; do
      [ -z "${r// }" ] && continue
      printf -- '- [[%s]] — %s\n' "${r%% — *}" "${r#* — }"
    done
  } > "$C/$topic/$slug.md"

  echo "  $topic/$slug.md"
  count=$((count+1))
done < "$TABLE"
echo "generated $count pages"
