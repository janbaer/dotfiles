# Infra root-cause debugging

When root-causing an infrastructure or system problem, first find out what changed, then state competing hypotheses before you touch anything.

## Step 0: what changed

Ask Jan what he changed in the last days, including things that seem unrelated. Ask "what did you change", not "what could be related": he filters the answer otherwise. Then look yourself, before listing hypotheses: `git log` of the affected repos, creation dates of Docker networks and containers, firmware and uptime. Ask the peer session of the project if one runs. Every change near the start of the problem becomes its own hypothesis, with its disproof command.

## Hypotheses For each hypothesis, name the single cheapest read-only command that would disprove it. Run those commands first, in that order, and report which hypotheses survive. Only then propose a change.

## Why

Kernel upgrades, logrotate, unattended-upgrades, flake-version issues — these get solved correctly in the end, but only after several disproven theories along the way, and one false-positive alert was never resolved. On 2026-11-08 a VPN problem was searched in firewall, DNS and client for hours; the cause was the Caddy switch three days earlier, whose new Docker network took a subnet overlapping the VPN range. Nobody asked what had changed. Stating the hypotheses first, ranked, with a cheap disproof command each, makes the elimination path explicit instead of trial-and-error.

## Scope

- Applies to root-causing a live infra or system problem: servers, Kubernetes, NixOS, services, configs — anywhere state can be inspected before it is changed.
- Does not replace `coding-discipline.md`'s test-first approach for code bugs. That rule already covers reproducing a bug with a test; this one is for cases where "write a test" does not apply because the thing under investigation is running system state, not code.
