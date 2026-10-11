# Explore checklist

Give each subagent one area, ask for a summary (under about 800 words) with file paths and line numbers, and for anything it could not verify. No secret values.

## Every project

- **Parts and entry points:** services, hosts, packages, binaries, what starts what, where a request or a job enters.
- **Run, build, release, deploy:** exact commands and scripts, CI pipelines (jobs, triggers, environments), how a change reaches production, how it is rolled back.
- **Configuration and secrets:** where config lives per environment, which variables exist, where secrets come from (names of vault entries, secret stores, env files, never values).
- **Scheduled work:** cron, systemd timers, CI schedules, queue consumers, background jobs: when they run and what happens on failure.
- **Things that expire:** certificates, tokens, API keys, licenses, framework or runtime end of life, pinned versions.
- **State and backups:** databases, volumes, queues, caches; what is backed up, how, where to, how many copies, and whether a restore is documented or tested.
- **Monitoring and alerts:** what is watched, where alerts go (addresses by variable name only), what is not watched.
- **Dependencies on others:** other services, databases, registries, mail, identity providers, external APIs.
- **Weak spots:** missing error handling, ignored exit codes, unpinned versions, exposed ports, TODOs, dead code paths, repo docs that contradict the code.
- **The project's own docs:** README, `CLAUDE.md`, wiki links: list what each says and flag what is outdated.

## Stack hints

- **Ansible and other infrastructure repos:** playbook order and tags (especially `never`), roles local versus external, group variables, vault layout, inventories, provisioning scripts.
- **Terraform repos:** root modules and workspaces, state backend and locking, providers and pinned versions, variables per environment (`tfvars`, where they live), what runs `plan` and `apply` (pipeline or laptop), resources with `prevent_destroy` or `ignore_changes`, drift between state and the real infrastructure, what was imported by hand.
- **Node.js or JavaScript services:** `package.json` scripts, engines and lockfile, build output, environment loading, runtime process model, queues and workers, dependency age and security advisories, test and lint setup.
- **Kubernetes deployment code:** manifests or charts, how images are built and tagged, namespaces and contexts, config maps and secrets, ingress and certificates, resource limits, probes, rollout and rollback commands, the cluster API versions the manifests use.
- **Libraries and CLIs:** public API, release process, versioning policy, who consumes it.
