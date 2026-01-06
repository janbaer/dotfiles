#!/usr/bin/env bash
# Claude Code Status Line - Percentage-Focused Display
# Shows budget and context usage as percentages with color-coded warnings

input=$(cat)

# Extract data from JSON input
model=$(echo "$input" | jq -r '.model.display_name')
budget=$(echo "$input" | jq -r 'if has("budget") then .budget else empty end')
total_input=$(echo "$input" | jq -r '.context_window.total_input_tokens // 0')
total_output=$(echo "$input" | jq -r '.context_window.total_output_tokens // 0')
usage=$(echo "$input" | jq '.context_window.current_usage')

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

# Format output - percentage-focused
if [ -n "$budget" ] && [ "$budget" != "null" ]; then
  budget_pct=$((total_tokens * 100 / budget))

  # Color-coded budget display based on usage level
  if [ $budget_pct -ge 90 ]; then
    # Critical: 90%+ used - Red/Bold
    printf '\033[1;31mSession: %d%%\033[0m | Context: %d%% | %s' \
      "$budget_pct" "$context_pct" "$model"
  elif [ $budget_pct -ge 75 ]; then
    # Warning: 75-89% used - Yellow/Bold
    printf '\033[1;33mSession: %d%%\033[0m | Context: %d%% | %s' \
      "$budget_pct" "$context_pct" "$model"
  else
    # Normal: <75% used
    printf 'Session: %d%% | Context: %d%% | %s' \
      "$budget_pct" "$context_pct" "$model"
  fi
else
  # No budget configured - show context and model only
  printf '%s | Context: %d%% | %dk tokens' \
    "$model" "$context_pct" "$((total_tokens / 1000))"
fi
