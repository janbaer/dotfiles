## Description

The default `bash tests/run_all.sh` (#80, PR #84) takes about 85 seconds without `test_renovate_sweep.py`, which takes about three minutes and is left out of the default run by a `SLOW` list. Measured on 2026-10-24 on the author's machine, per file:

| File | Time | Cause |
| --- | --- | --- |
| `test_renovate_sweep.py` | 172 s | `DryRunReleaseTests(SweepTests)` inherits the 31 tests of `SweepTests` and adds 3, so 65 tests are defined and 96 run; `SweepTests` alone takes 82 s, four of its tests take 53 s (real git repos with commit and push) |
| `test_decision_approval_gate.py` | 33 s | not git and not a subprocess: `setUp` starts an HTTP server per test with `serve_forever()` at its default `poll_interval` of 0.5 s, and `shutdown()` waits up to that long; the file idles at about 4 % CPU. With `poll_interval=0.05` a review measured 6.8 s |
| `test_forgejo_route_cleanup.py` | 18 s | git-bound |
| `test_review_tier.py` | 11 s | not analysed |
| `test_route_gate.py` | 10 s | runs the gate as a subprocess |
| `test_deploy_on_push.py` | 6 s | bare repo and clone per test |
| everything else | about 7 s in total | |

This issue covers the changes that need no mocks:

- `test_decision_approval_gate.py`: start the server with a small `poll_interval` (0.05).
- `test_renovate_sweep.py`: move the shared helpers (`make_origin`, `branch`, `fake_bun`) into a base class without tests, so `SweepTests` and `DryRunReleaseTests` no longer run the same 31 tests twice; name any test that is dropped in the commit message.
- One marker for integration tests, a decorator in `tests/` that skips the test unless `RUN_INTEGRATION=1`. The git-heavy tests carry it. `bash tests/run_all.sh --all` sets it; the `SLOW` list of the runner is removed.
- `tests/run_all.sh` prints the unittest summary (`Ran N tests`, skipped count) behind `pass`.
- `AGENTS.md` names the marker and both run commands.

Not part of this issue: replacing git and subprocess parts by mocks in the other test files.

## Motivation

A suite that takes 85 seconds, or three minutes with the slow file, is not run before every change. Fast tests for the logic and a separate, named integration run keep the quick check quick and the slow one explicit.

## Acceptance Criteria

- [ ] `test_decision_approval_gate.py` runs in under 10 seconds with the same number of tests
- [ ] `SweepTests` and `DryRunReleaseTests` no longer run the same tests twice; the number of tests of `test_renovate_sweep.py` drops from 96 to 65 and no distinct test is lost
- [ ] `bash tests/run_all.sh` finishes in under 60 seconds without `RUN_INTEGRATION`, with the marked tests skipped and named as skipped
- [ ] `bash tests/run_all.sh --all` runs the marked tests as well and finishes without a timeout
- [ ] The `SLOW` list in `tests/run_all.sh` is gone
- [ ] The runner prints `Ran N tests` and the skipped count per Python file
- [ ] `AGENTS.md` describes the marker and both run commands

## How to Test

- `time bash tests/run_all.sh` and `time bash tests/run_all.sh --all`
- `python3 -m unittest tests.test_decision_approval_gate` and compare the test count with `main`
