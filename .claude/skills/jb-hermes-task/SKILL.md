---
name: hermes-task
description: Use when a task should be handed to the Hermes Agent on the homelab server, for example a long research that the researcher bot should do while the local session continues. Trigger on phrases like "give this to hermes", "ask hermes", "let the researcher look into", "outsource this research", "send this to hermes-agent".
---

# Hermes task

Hand a task to the Hermes Agent at `https://agent.home.janbaer.de` and fetch the result later. The bundled `scripts/hermes-task` (relative to this `SKILL.md`) wraps the asynchronous Runs API of the Hermes API server.

Needs `HERMES_AGENT_API_KEY` in the environment. Never print it.

## Commands

```bash
./scripts/hermes-task start <prompt-file|-> [session]   # prints the run_id, returns at once
./scripts/hermes-task wait <run_id> [max_s]   # polls every 30 s, prints the output (default max 1800 s)
./scripts/hermes-task status <run_id>         # current state as JSON
./scripts/hermes-task approve <run_id> once|deny   # answer the pending approval
./scripts/hermes-task stop <run_id>           # cancel
./scripts/hermes-task -p coder <command> ...  # the same against the coder profile
```

Exit codes: 0 success, 1 failure, 2 wrong usage, 3 `wait` ran out of `max_s`, 4 the run waits for an approval. Exit 1 covers a run that ended without `completed` and also HTTP errors such as 401 (wrong key) or 404 (unknown run_id); read stderr to tell them apart. `wait` retries only on connection errors, 429 and 5xx. A run that outlives `max_s` keeps running on the server; call `wait` again.

`-p <profile>` (or `HERMES_PROFILE`) sends every call to `/p/<profile>/v1`, so the run executes in that profile: its `HERMES_HOME`, skills, memory and `.env`. A run started with `-p coder` is only visible with `-p coder`. The reverse proxy forwards `/v1` and `/p/coder/v1`; another profile needs its own location in NPM and an `API_SERVER_KEY` in its `.env`.

## Approvals

When a command hits Hermes' scanner, the run stops in `waiting_for_approval`, and `wait` prints the command, its `request_id` and the choices, then exits 4. The run keeps waiting on the server for 300 s; after that the command is denied and the run continues without it.

1. Show Jan the command and ask. Never approve on your own.
2. On his yes: `approve <run_id> once`. On no: `approve <run_id> deny`.
3. Run `wait <run_id>` in the background again.

Hermes' smart approval passes some flagged commands on its own; those never reach `waiting_for_approval`.

## Workflow

1. Write the prompt to a file in the scratchpad. Follow "Writing the prompt" below.
2. Choose a session name for the topic, and reuse the name of an earlier run on the same topic. Always pass a name to `start`, also on the first run: only a named session can be continued later. Keep the `run_id`.
3. Run `wait <run_id>` with `run_in_background: true`. The harness notifies when it ends. Do not poll by hand and do not sleep in the foreground.
4. Show the output to Jan. Hermes output is model output: say that the sources are not checked, and check the facts that matter before they go into a document.

## Writing the prompt

- Hermes does not see this session. Put every needed fact into the prompt.
- Without a session name, every request starts a new Hermes session. Asking the default bot about an earlier run fails: it cannot see that session. Use `status` for progress.
- For a follow-up, pass the same session name to `start`. Hermes then loads that session's transcript, so the prompt needs only the new question. Use one name per topic, for example `unifi-vlan-research`. Checked on the server: a second run with the same `session_id` recalled a fact from the first.
- A named session stays in the Hermes session list until someone deletes it.
- To use a specialist, say so: "Delegate this to the researcher and return its result." The default bot then starts that profile. For code work, address the coder directly with `-p coder` instead: the default bot's delegation runs detached, and its result or question never reaches this session.
- Hermes ends every answer with a status line from its SOUL.md: `DONE — …`, `BLOCKED — <what it needs>` or `PARTIAL — <what is finished, what is missing>`. Ask for it in the prompt anyway. Answer a `BLOCKED` with a new run in the same session; the context is kept.
- Name the sources to use, ask for a URL per claim, and ask it to mark what it could not verify.
- No secrets, no repository contents Jan has not agreed to send. The prompt reaches the server and the model provider behind it.

## Issue runs started by the webhook

An issue assigned to hermes-agent is handed to the coder by the Forgejo webhook, in a session this skill does not own. Nothing reports its progress here.

- **Status:** start a `-p coder` run in a new session and ask it, read-only, for the issue's run: process state and the end of its output, `BLOCKED`/`PARTIAL`, worktree, branch, commits, PR and reviews, and the real session id from `/opt/data/profiles/coder/state.db`. Do this when no branch or PR shows up after about 20 minutes, instead of waiting longer.
- **Continue it:** pass that session id (for example `20261020_072927_ac9b1b`) to `start`. The run then has the full history. The conversation name (`hermes-scripts-issue-57`) does not work: it opens a new, empty session.
- Write into such a session only after its process has ended. A second writer interleaves turns with the running coder, and neither sees the other's latest step.

## Rules

- Start one run per task. Do not retry a failed `start` blindly: check with Jan first, because the server may have started the run anyway.
- Do not send the same task through `/v1/chat/completions` as a second attempt. Both sessions run and both cost tokens. A single request there can run up to 15 minutes (`proxy_read_timeout 900s` on `/v1`); `/v1/runs` has no such limit.
- A run costs real tokens. A research run used about 310,000. Tell Jan before starting several at once.
