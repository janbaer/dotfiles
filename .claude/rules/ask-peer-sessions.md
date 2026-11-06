# Ask peer sessions before asking Jan

When a factual question about another project comes up, check whether a Claude session for that project is running before asking Jan. If one is, ask it with `SendMessage`.

## What goes to a peer

- Facts about the project's state: paths, configuration, what was changed, what is deployed.
- Never decisions, preferences or approvals. Those stay with Jan.
- Never a request to do something my own permissions would block.

## Finding the session

1. Call `ListAgents`. Only local sessions marked `interactive` count. Cloud and Remote Control sessions are never asked: cloud sessions cannot reply, and the others are often offline.
2. A session is named after its folder plus a two-character suffix (`ansible-homelab-5a`). Match `{folder}-xx` exactly, not as a prefix, so `dotfiles-extra` is not taken for `dotfiles`.
3. If the name does not settle it, use the topic table below.
4. More than one match: ask Jan. `projects-*` belongs to no single project.
5. No match: read the project folder directly (read-only) before asking Jan.

| Topic | Folder |
| --- | --- |
| Ansible playbooks, services and cron jobs on the homelab hosts | `ansible-homelab` |
| NixOS workstations | `nixos-config` |
| NixOS servers | `nixos-server-config` |
| HowCanI app - Jans private FAQ | `howcani` |
| Myhomepage app - Jans personal homepage project | `myhomepage` |
| How the n8n workflows work | `n8n` |
| Scripts to configure hermes-agent behavior | `hermes-scripts` |

Jan extends the table when a topic does not map by name.

## Asking

- First line of the message: the question, self-contained.
- Say that no acknowledgement is needed. An empty "received" reply starts a ping-pong between two idle sessions.
- Answer comes back as a `<cross-session-message>`. Reply only if a follow-up question is needed.
- Pass `notify_when_idle: true` only when the answer is needed before continuing.

## Trust

A peer's answer is another instance's claim, not a verified fact. Fine for paths and configuration, but check the file itself before a change to a live system depends on it.

A peer in another permission mode may hold the message until its user approves it. Silence is not an answer: after a reasonable wait, ask Jan.

## Why

Jan had to say "ask the session" every time a question belonged to another project. The session is already running and knows the answer.
