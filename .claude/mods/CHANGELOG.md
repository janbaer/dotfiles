# CHANGELOG

This file describes all changes to the mods in this directory. Versions are the `version` in each mod's `plugin.json`; an entry without a version left it unchanged.

## 2026-11-14
---

- agents-info 1.5.0: In the terminal the panel shows a crab-family emoji per role (🦀 Rechercheur, 🦞 Prüfer, 🐙 Schreiber, 🦑 Gestalter, 🦉 Planer, 🐝 Entwickler, 🐚 Helfer) instead of the blue square, and the loaded version next to the title.

## 2026-11-12
---

- agents-info 1.4.4: New mod, a fork of savvy-progress (claude-kit 1.2.1) without the savvy-flow parts. The agents panel shows each subagent as a crab with a role (Rechercheur, Planer, Prüfer, Schreiber, Gestalter, Entwickler, Helfer) taken from its type and description, in German. Costs show only for the model releases the price table names and only when an API key, `ANTHROPIC_BASE_URL` or an enabled cloud-provider flag is set.

## 2026-11-11
---

- project-guard 0.1.0: New mod. Before each typed prompt it compares the text with the keywords in `projects.json`; when only another project matches, not the one the session runs in, it asks "Hier weiter / Abbrechen". "Abbrechen" or Esc drops the prompt, "Hier weiter" silences that project for the session, and a typed answer goes to the model as context. No network call; `/project-guard on|off` switches it.

## 2026-11-10
---

- model-router 0.1.0: New mod. Sends the first typed prompt of a session to a decision model on OpenRouter (Jev 1.14) and runs the main session on the model it picks; subagents keep theirs. In the default mode `manual` it asks before switching, `/model-router auto` switches without asking. The status line shows the mode and the model that answered. A manual `/model` ends the routing for that session. Replaces the hook that blocked the first prompt until the model was switched by hand.

## 2026-11-04
---

- speak 0.9.1: An open panel and the status line follow settings changed in another session. The settings were already shared through the store, but each session only showed what it read at start; it now checks the store every five seconds. The pane tab reads "Sprachmodus" instead of the truncated "Claude Sprachmodus".

## 2026-11-02
---

- speak 0.9.0: In auto mode a follow-up answer (for example an agent's short hand-back) no longer cuts the answer being read: answers queue and play one after the other. `/speak` and the play button read every answer since the last typed prompt, and prompts delivered by an agent no longer stop playback. The panel shows the loaded version next to the title.

## 2026-11-01
---

- speak 0.8.1: The output language is selectable (Auto, Deutsch, Englisch) in the panel below Stil, with `/speak language`, and shown in the status line when not Auto. Meant to stop the voice switching to English after an English term at the start of a sentence: the language goes to the TTS model as `languageCode` (`de-DE`, `en-US`). OpenRouter accepts the field but does not document it, so the effect is unproven.

- speak 0.7.6: New mod. `/speak` reads the last answer aloud, `/speak auto` every new one, and `/speak panel` opens a side pane for mode, voice (30 German voices with a ♪ sample), output style and Vorlesen/Stop. The text goes to OpenRouter (Gemini TTS) in chunks fetched in parallel, so playback starts after about two seconds. The key comes from `OPENROUTER_TTS_API_KEY`, set in `claudeRun` in nixos-config.

## 2026-10-25
---

- cache-meter 0.2.0: `/keep-warm` sends a short ping shortly before the cache TTL runs out, so the cache stays warm while you are away. Idea taken from cache-waechter in boonpflug/claude-mods-deutsch.

## 2026-10-10
---

- cache-meter 0.1.0: New mod. A band above the prompt shows the cache time left, hit rate, context fill and a Compact button.
- redact-secrets: Also masks secrets printed by remote hosts (`NAME=value`, `NAME: value`, `"NAME": "value"`) and `*_SECRET` names, which the environment-based list missed.

## 2026-10-09
---

- redact-secrets 0.1.0: New mod. Replaces the values of environment variables named like TOKEN, PASSWORD or PWD with `[REDACTED:NAME]` before a row is stored or sent.
- ideas-pane 0.1.0: New mod. The ideas backlog from the Notes vault in a side pane; a click starts the grill.
- The mods load through the `jan-mods` marketplace for this directory.
