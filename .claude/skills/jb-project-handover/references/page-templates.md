# Page skeletons

Fill every row from a checked source and give it a status chip. Delete a section instead of leaving it empty. Start every page except the start page with a short note:

```
> [!note]
> In short: <the one thing to remember from this page>
```

Replace the angle brackets below with the project's facts.

## index.md

```
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

1. [Architecture](architecture.md) (3 min): <what to show>.
2. [Runbooks](runbooks.md) (5 min): <the first tasks>.
3. [Known issues](issues.md) (3 min): <the top two>.
4. [Recurring duties](duties.md) (2 min): <what to remember>.
5. [Access](access.md) and [decisions](decisions.md) (2 min): <what to remember>.

## At a glance

| Service | Who uses it | Maintenance window |
|---|---|---|

## Read these first
(cards block: Runbooks, Known issues, Recurring duties)

## The rest
(cards block: Architecture, Access, Decisions)
```

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

A table of the parts (name, address or location, what runs, ports), a `flow` diagram of the main request or deploy paths, a table of what the system talks to (System | Used for | How | Status), a short section on how the configuration or deployment is layered, and a note on infrastructure as code if it is outdated.

## access.md

A table of systems and where the credential lives (names of entries and variables only), a table of people and what they own, and a short list of where to find things in the repository. Say what is not recorded.

## decisions.md

A table of recent decisions (Date | Decision | Why | Source) with the owner's reason in one sentence each, and a list of planned work with its status (ticket or none). Leave out rejected attempts nobody needs to know about.
