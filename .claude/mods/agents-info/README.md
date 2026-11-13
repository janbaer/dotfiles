# agents-info

Panel for the subagents Claude starts. `/agents-info` shows or hides it; it also opens by itself at the first subagent of a session.

Each subagent is a crab with a role derived from its type and description: Rechercheur, Planer, Prüfer, Schreiber, Gestalter, Entwickler or Helfer. A role has its own color, costume and status line ("recherchiert gerade"). A row shows model, context, time and, when tokens are billed (API key, `ANTHROPIC_BASE_URL`, Bedrock/Vertex/Foundry), an estimated cost.

Fork of [savvy-progress](https://github.com/johnnyvizz/claude-kit/tree/main/plugins/savvy-progress) by johnnyvizz (MIT), without the savvy-flow parts.

Option `language`: `de` (default), `auto`, `en`. A model without a known price shows no cost.
