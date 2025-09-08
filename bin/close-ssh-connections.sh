#!/usr/bin/env bash

# Define the grep command used to filter processes
GREP_COMMAND="ssh: "

# Find the process IDs matching the grep command
PIDS=$(pgrep -f "$GREP_COMMAND")

# Check if any matching processes were found
if [[ -z $PIDS ]]; then
  echo "No processes found matching the grep command: $GREP_COMMAND"
  exit 0
fi

# Iterate over each process ID and terminate the processes
for PID in $PIDS; do
  echo "Killing process with PID: $PID"
  kill "$PID"
done

echo "***Closed all open SSH connections***"
