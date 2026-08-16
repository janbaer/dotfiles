# Before opening a pull request

Run `/simplify` and then `/review-diff` on the branch, and act on what they
report. This holds for every pull request, on Forgejo as much as on GitHub, and
again before pushing a follow-up commit to a PR that is already open.

**That order matters.** `/simplify` rewrites code, so it must not run last: the
version `/review-diff` blessed would not be the version being submitted. The
correctness check has to be the final one, because only then does it run on
what actually ships. If the review then forces a change big enough to reshape
the code, the pair runs again.

The exception is an approach that may be wrong at the root. Polishing something
that should not exist is wasted, so there a correctness look comes first.

## Why

A PR is where work stops being private. Someone else reads it, and once it is
open the sloppy version has already been seen. In practice both tools keep
finding things the author walked past — a case the tests do not cover, a
simpler formulation, an assumption that only holds on the machine it was
written on — and they find different things, so neither replaces the other.
`/simplify` has surfaced the most dangerous finding of a session, an output
shape that invited a destructive call, while `/review-diff` has caught silent
data loss `/simplify` walked straight past.

**On a repository Jan does not own the stakes are higher.** The PR carries his
GitHub identity, so a stranger judges his work, and unlike a commit in a
private repo it cannot be quietly amended later: it sits in a public thread
with his name on it.

## How to apply

- Run both from the repository the branch lives in, after the work is committed
  and before the PR is created.
- Fix what they find, or state plainly why a finding is being left as it is.
  Skipping one silently defeats the point.
- This comes on top of whatever the project itself demands (its test suite,
  linters, pre-commit hooks, CI), never instead of it. Watch for generated
  files a hook rewrites after `git add` — a regenerated README that stays
  unstaged has failed CI here twice.
- The same care applies to the PR text: it is read by someone with no context,
  so the reason for the change belongs in it, not just the change.
