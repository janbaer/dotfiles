---
name: grill-me
model: opus
description: Interview the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. Use when user wants to stress-test a plan, get grilled on their design, or mentions "grill me". `continue` resumes a paused interview.
argument-hint: "Topic of the interview, or 'continue' to resume a paused one from a handoff in the current directory"
---

If the argument is `continue`, resume a paused interview as described under **Pausing and continuing** below instead of starting a new one.

Interview the user relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled — the questions you can ask _now_ without guessing at answers you haven't heard yet. Ask the whole frontier in one round, then wait for the answers before the next round.

**Ask with the `AskUserQuestion` tool, with prepared answers.** The user walks through the questions one by one in a selection box, so none is forgotten and most are one keypress. Rules:

- Up to 5 interview questions per call, plus the pause question (see **Pausing and continuing**). A round with more questions goes out as several calls in a row, until every frontier question has been asked. Do not wait for the user to ask for the rest.
- Number each question in its text (`Q1: ...`) so the answers can be recorded and referred to later. The `header` is a 1-2 word label.
- Give 2 to 4 prepared answers per question. Your recommended answer comes first and ends with `(Recommended)`. The other options are the real alternatives, never filler. The description of each option says what follows from choosing it.
- The built-in "Other" is the way to give a name, a number, a channel or a correction. A question that only needs a fact from the user ("what is the entry called?") still gets a recommended option where there is a sensible default; otherwise ask it in plain text after the selection boxes.
- Read the answers literally. A free-text answer may say "off topic", "can be removed" or "ask differently". Follow it; do not map it to the nearest option. Record a dropped question as dropped.
- When the tool is not available, fall back to plain text: one block per question with a numbered title, the question and your recommended answer, and wait for the reply.

Each round the user answers reshapes the tree — settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent to find it — don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report — ask the rest of the frontier now. The _decisions_ are the user's — put each to them and wait.

The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on it until the user confirms you have reached a shared understanding.

## Pausing and continuing

Long interviews get interrupted. Make the last question of every call a pause question, header `Pause`, with the options `Continue (Recommended)` and `Pause and write handoff`. It is answered together with the block, so pausing costs no extra round trip. Leave it out of the final call of the interview.

On `Pause and write handoff`, record the answers of that call first, then create a handoff with the `handoff` skill, bare `in` so it lands in the current directory, and add the tag `grill-me` to the frontmatter. The handoff carries what the generic summary would lose:

- The goal of the interview and what happens with its result (Forgejo issue, spec, plan).
- Every settled decision as `Qn` with the answer. Dropped questions are listed as dropped.
- Questions already asked but not yet answered, verbatim: this is the open frontier.
- Branches of the design tree not visited yet.
- The instruction to continue with the `grill-me` skill.

Tell the user the filename, then stop asking.

On `continue`, look for open `handoff-*.md` files in the current directory that carry the tag `grill-me`. One match is loaded directly, several are offered with `AskUserQuestion`, none means saying so plainly and not starting a new interview. Load it as the `handoff` skill's resume does, recompute the frontier from the recorded decisions, and carry on.

When an interview that was resumed from a handoff is finished, mark that handoff done with the `handoff` skill, `done` and bare `in`. Otherwise it stays open and shows up in the next `continue`.

---

Once the interview is done, and **only if not already being called from within the `forgejo-issue-create` skill**, ask the user if a new Forgejo issue should be created. If yes, use the `forgejo-issue-create` skill and follow the instructions from that skill.

If the user denies that a new Forgejo issue should be created, ask them what they want to do with the output of this interview. If the user wants to start working, use the output of the interview as the plan.

If both options are not used, create a spec file in `./docs` folder.
