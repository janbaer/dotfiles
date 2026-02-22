---
name: ntfy-me
description: Use when sending push notifications via ntfy — checking config, formatting messages, or notifying about events like build completion, weather, or alerts.
---

# ntfy

Send push notifications via [ntfy](https://ntfy.sh) using the `ntfy` script in `~/bin/ntfy`.

## Command

```bash
ntfy [--title <title>] [--tags <tag1,tag2>] [--topic <topic>] [--priority <level>] "<message>"
```

| Flag | Description | Default |
|------|-------------|---------|
| `--title` / `-t` | Bold heading in notification | (none) |
| `--tags` | Emoji names (see table below) | (none) |
| `--topic` | ntfy topic | `claude` |
| `--priority` / `-p` | `min` `low` `default` `high` `max` | `default` |
| `--server` | Override server URL | from config or `https://ntfy.home.janbaer.de` |

## Common Tags

| Situation | Tags |
|-----------|------|
| Weather sunny | `sunny` |
| Weather rain | `umbrella` |
| Weather cloudy | `cloud` |
| Build success | `white_check_mark` |
| Build failure | `x` |
| Alert/warning | `warning` |
| Info | `information_source` |
| Money/cost | `moneybag` |
| Deploy | `rocket` |
| Code review | `mag` |

## Example

```bash
ntfy --title "Weather Munich – Feb 22" --tags "cloud,umbrella" --topic test \
  "🌤 Partly cloudy, 5°C (feels like 1°C)
☔ Rain chance: 72% | 💨 Wind: 19 km/h WSW"
```

## Common Mistakes

- **Using full emoji in --tags** — takes emoji *names* (`umbrella`), not emoji characters (`☂`)
- **Forgetting --title** — notification shows raw body only, no heading
