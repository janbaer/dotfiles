# Lessons learned

From the first run (an Ansible and Terraform repository, October 2026). Read before starting.

## What worked

1. Exploring with subagents and asking for summaries with file paths, not dumps.
2. One checkpoint: the proposed page set, the new code facts and the interview questions together, approved before any writing.
3. Asking all interview questions in one round, accepting "unknown", and dropping the ones Jan called known.
4. Checking every owner answer against the repo. Two answers differed from the code (the alert mail address, a script that existed only on the server).
5. A source and a status on every row, and a Draft marker on every page.
6. Rendering the pages and checking every link and anchor before handing back.

## Pitfalls

- **The repo changes while you work.** In one day the jump host moved and the platform migrated. Stamp the snapshot (commit, date, uncommitted changes), re-read the repo before building, and label facts that depend on a changed platform instead of deleting them.
- **Subagent summaries are wrong in small ways** (a cron job reported as missing that existed, one local backup copy where there were two, a README step for a file that was not in the repo). Re-read any fact a page leans on.
- **A learner framing does not fit a handover.** Quizzes and a teacher voice cost the owner time and the colleagues do not use them. Write references and a walkthrough instead.
- **Reasons are scarce.** Git shows what changed, not why. Ask for the reason of each decision in the first round, one sentence each, and leave "not recorded" visible rather than guessing.
- **A restore that was never tested is a finding**, not a footnote. Give it the top priority.
- **The owner cuts what you over-produced.** A from-scratch setup runbook and a findings ledger that duplicated the issues page were both removed. Ask which runbooks colleagues will use, and keep one register.
- **Automated steps rot quietly.** A download that Tableau later blocked left dead tasks in the role. Ask "does this still work?" for every automated step.
- **Unwritten rules are the real runbook:** "snapshot first", "always bump the build number". Ask for them per risky task.
- **Inherited jobs nobody knows** (a weekly cleanup script copied from a blog post) are worth a line in the duties page and a question to the owner.
- **Repo documentation rots first:** README script names, removed directories, a stale `CLAUDE.md`. List them as issues; it costs nothing.

## Process notes

- Time estimates: the converter and a three-page pilot took well under an hour, writing the pages is faster than the interview and the review. The real cost is the owner's review time, so make that easy: short pages, statuses visible, open questions listed.
- Convert existing HTML to Markdown with a throwaway script and compare the text of every page before and after, instead of retyping long pages. Do it when a project already has HTML docs.

## Evaluated and not adopted

- **Pandoc instead of `Bun.markdown`** (checked October 2026 with Pandoc 3.7.0.2). `pandoc -f gfm -t chunkedhtml --split-level=1 a.md b.md ...` joins several Markdown files into one document and splits it into linked pages with navigation, a sitemap and resolved internal anchors. `> [!note]` and the other GitHub alert types work natively. Not adopted, because:
  - chips, `[!source]`, `[!status]`, `cards` and `flow` blocks and the `.md` link rewrite all need Lua filters;
  - front matter must be valid YAML (our unquoted values with a colon fail);
  - page files are named by number and H1 slug, and the layout needs a Pandoc template;
  - the link check stays, and Pandoc is an external binary.

  Net effect: about 60 lines of navigation code in `build.ts` would be replaced by about as many lines of Lua plus a template. Revisit if `Bun.markdown` breaks (the parser is one call in `build.ts`) or if other output formats are wanted.
- **Static site generators** (compared from their documentation, not tried): Docsify needs a server and loads from a CDN by default, Docusaurus needs a full project scaffold, VitePress has a hand-written sidebar and a community Mermaid plugin, Starlight's Mermaid support was not verified. For about eight pages none beats the 200-line converter.
