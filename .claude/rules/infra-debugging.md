# Infra root-cause debugging

When root-causing an infrastructure or system problem, state competing hypotheses before you touch anything. For each hypothesis, name the single cheapest read-only command that would disprove it. Run those commands first, in that order, and report which hypotheses survive. Only then propose a change.

## Why

Kernel upgrades, logrotate, unattended-upgrades, flake-version issues — these get solved correctly in the end, but only after several disproven theories along the way, and one false-positive alert was never resolved. Stating the hypotheses first, ranked, with a cheap disproof command each, makes the elimination path explicit instead of trial-and-error.

## Scope

- Applies to root-causing a live infra or system problem: servers, Kubernetes, NixOS, services, configs — anywhere state can be inspected before it is changed.
- Does not replace `coding-discipline.md`'s test-first approach for code bugs. That rule already covers reproducing a bug with a test; this one is for cases where "write a test" does not apply because the thing under investigation is running system state, not code.
