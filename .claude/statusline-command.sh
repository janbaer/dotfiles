#!/usr/bin/env bash
# Claude Code Status Line - Percentage-Focused Display
# Shows budget and context usage as percentages with color-coded warnings

input=$(cat)

# Extract data from JSON input
cwd=$(echo "$input" | jq -r '.cwd // .workspace.current_dir // ""')
model=$(echo "$input" | jq -r '.model.display_name')
budget=$(echo "$input" | jq -r 'if has("budget") then .budget else empty end')
total_input=$(echo "$input" | jq -r '.context_window.total_input_tokens // 0')
total_output=$(echo "$input" | jq -r '.context_window.total_output_tokens // 0')
usage=$(echo "$input" | jq '.context_window.current_usage')

# Shorten cwd: replace $HOME with ~
home_dir="$HOME"
cwd_display="${cwd/#$home_dir/~}"

# Calculate total tokens used in session (cumulative)
total_tokens=$((total_input + total_output))

# Calculate context window percentage (current conversation context, not cumulative)
if [ "$usage" != "null" ]; then
  current=$(echo "$usage" | jq '.input_tokens + .cache_creation_input_tokens + .cache_read_input_tokens')
  size=$(echo "$input" | jq '.context_window.context_window_size')
  context_pct=$((current * 100 / size))
else
  context_pct=0
fi

# Build rate limits suffix
rate_suffix=""
five_pct=$(echo "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty')
week_pct=$(echo "$input" | jq -r '.rate_limits.seven_day.used_percentage // empty')
if [ -n "$five_pct" ] || [ -n "$week_pct" ]; then
  rate_parts=""
  if [ -n "$five_pct" ]; then
    rate_parts="5h:$(printf '%.0f' "$five_pct")%"
  fi
  if [ -n "$week_pct" ]; then
    if [ -n "$rate_parts" ]; then
      rate_parts="$rate_parts 7d:$(printf '%.0f' "$week_pct")%"
    else
      rate_parts="7d:$(printf '%.0f' "$week_pct")%"
    fi
  fi
  rate_suffix=" | $rate_parts"
fi

# Format output - cwd first, then percentage-focused stats
if [ -n "$budget" ] && [ "$budget" != "null" ]; then
  budget_pct=$((total_tokens * 100 / budget))

  if [ $budget_pct -ge 90 ]; then
    printf '\033[1;34m%s\033[0m | \033[1;31mSession: %d%%\033[0m | Context: %d%% | %s%s' \
      "$cwd_display" "$budget_pct" "$context_pct" "$model" "$rate_suffix"
  elif [ $budget_pct -ge 75 ]; then
    printf '\033[1;34m%s\033[0m | \033[1;33mSession: %d%%\033[0m | Context: %d%% | %s%s' \
      "$cwd_display" "$budget_pct" "$context_pct" "$model" "$rate_suffix"
  else
    printf '\033[1;34m%s\033[0m | Session: %d%% | Context: %d%% | %s%s' \
      "$cwd_display" "$budget_pct" "$context_pct" "$model" "$rate_suffix"
  fi
else
  printf '\033[1;34m%s\033[0m | %s | Context: %d%% | %dk tokens%s' \
    "$cwd_display" "$model" "$context_pct" "$((total_tokens / 1000))" "$rate_suffix"
fi
