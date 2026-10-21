# Page skeletons

Fill every row from a checked source and give it a status chip. Delete a section instead of leaving it empty. Start every page except the start page with a short note:

```
> [!note]
> In short: <the one thing to remember from this page>
```

Replace the angle brackets below with the project's facts.

## index.md

The snapshot line is the anchor for later updates: `update` diffs the repo from that commit. Keep the full hash and the branch, and move both forward with every update.

````
---
title: <Project>: handover
nav: Start
order: 1
layout: wide
status: Draft — <date>
---

# <Project>

<Two sentences: what it is, who it serves, where it runs, how it is configured.>

> [!status]
> **Status:** Draft — <date>
>
> **Snapshot:** branch `<branch>`, base commit `<hash>` plus uncommitted changes (<what>).
>
> **Open:** <what was not tested, what comes only from the owner, what is not recorded.>

## Walkthrough: 15 minutes

1. [Architecture](architecture.md) (4 min): <what the system does and how a change reaches it>.
2. <Pages that explain a core part, for example [Proxy](proxy.md)> (3 min): <what to show>.
3. [Access](access.md) (2 min): <which systems and where the credentials live>.
4. [Runbooks](runbooks.md) (3 min): <the first tasks>.
5. [Known issues](issues.md), [decisions](decisions.md) and [recurring duties](duties.md) (3 min): <the top two issues, why things are as they are, what runs by itself>.

## At a glance

| Service | Who uses it | Maintenance window |
|---|---|---|

## Where to find it

| URL | What | Access |
|---|---|---|
| [https://<host>](https://<host>) | <service or UI> | <network (office, VPN), login and group> |

<One sentence on what the URLs share: the proxy or ingress that routes them, the host that answers.>

## Read these first

Understanding comes before tasks: what the system is, what each core part does, where the credentials live.

```cards
Architecture | architecture.md | <Parts and paths in one line> | 1
<Core part page> | <page>.md | <What it does in one line> | 2
Access | access.md | <Systems and where the credentials live> | 3
```

## The rest

```cards
Runbooks | runbooks.md | <The first tasks in one line> |
Known issues | issues.md | <The top two in one line> |
Decisions | decisions.md | <What changed recently and what is planned> |
Recurring duties | duties.md | <What expires or runs by itself> |
```

## Legend

The chips behind a fact say where it comes from.

| Chip | Meaning |
|---|---|
| {verified} | Checked in the code, in a command output or on the system |
| {owner} | Stated by the owner in the interview, not checked against the code |
| {inferred} | Derived from other facts, not seen directly |
| {unverified} | Not checked. Treat it as a question |
| {partial} | Partly checked, the label says which part |
| {done} | Fixed or closed during the handover |
````

Keep the legend at the bottom of the start page. Give the pages `order:` values in the same sequence (start, architecture, core part pages, access, runbooks, issues, decisions, duties).

## runbooks.md

Front matter with `toc: true`. One H2 per task, in the order colleagues will need them (connect and set up, run or deploy safely, release or upgrade, check backups, restore, routine maintenance, troubleshooting).

```
## <Task>

**When / before:** <preconditions, window, announcement, snapshot>

1. <Step with the command in a fenced block>
2. ...

**Verify:** <how you know it worked>

> [!source]
> Source: <files, docs, owner>. {verified}
```

Mark anything never executed (`{unverified: Untested}`) and say so in a note. A restore runbook built from vendor docs is a draft until someone has run it. Troubleshooting is a table: Symptom | Cheapest read-only checks.

## issues.md

An opening note: priorities and next steps are proposals, not decisions; say whether tickets exist. Then one table per priority (High, Medium, Low) and a "Done" table for what was fixed during the handover:

```
| Priority | Issue | What to do | Status |
|---|---|---|---|
| {high} | **<Bold lead.>** <Impact in one sentence.> | <One concrete next step.> | {verified} |
```

## duties.md

Three tables: what runs by itself (Duty | When | Where | What happens | If it fails), what needs a person (Item | Owner | Where it lives | Next action | Status), and maintenance windows (Service | Window | Announce).

## architecture.md

A table of the parts (name, address or location, what runs, ports), a `mermaid` diagram of the main request or deploy paths, a section for the system's main action step by step (for a deployment tool: what is created, what is always, conditionally or on request included, which resources appear in the target system, and any optional mode the users can pick, with who has to prepare it), a table of what the system talks to (System | Used for | How | Status), a short section on how the configuration or deployment is layered, and a note on infrastructure as code if it is outdated.

## access.md

A table of systems and where the credential lives (names of entries and variables only), a table of people and what they own, and a short list of where to find things in the repository. Say what is not recorded.

## decisions.md

A table of recent decisions (Date | Decision | Why | Source) with the owner's reason in one sentence each, and a list of planned work with its status (ticket or none). Leave out rejected attempts nobody needs to know about.
