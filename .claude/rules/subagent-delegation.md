# Subagent delegation for broad exploration

When a task needs broad, read-only exploration — a repo-wide search, reading many files, tracing a call graph, reading an unfamiliar upstream script, mapping a system for a threat model — delegate it to a subagent instead of running many Bash or grep calls directly. Ask the subagent to return a summary, not raw file dumps or file contents.

## Why

Broad exploration run directly in the main session floods it with grep output and file contents. That bulk is exactly the kind of stale, unfiltered context that causes later factual drift. A subagent distills the answer and keeps the main context clean.

## How to apply

- Use the `Agent` tool (the `Explore` agent fits pure read-only search) for tasks like "every place X is configured", "the call graph reaching X", or "read this script and summarize it".
- Tell the subagent explicitly to return a summary, not to dump file contents into the reply.
- Reserve direct Bash/grep for narrow, single-fact lookups where the file or symbol is already known.
