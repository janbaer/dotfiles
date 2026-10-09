# Interview questions

Seed list for `grill-me`. Answer from the code wherever you can and ask Jan only the part that only he knows. Drop questions he calls known. "Unknown" and "never" are valid answers; record them as such. Ask the first group early: the reasons and unwritten rules are the part git does not hold.

## Core (every project)

**People and use**
1. Who uses it and for what? Who must be told before maintenance, and where (channel, list)?
2. Are there maintenance windows, or times when nobody may touch it?
3. Who takes over which part? (Skip if the team already knows.)

**Reasons and history**
4. Which substantial changes happened recently, and why was each made? (One sentence each is enough.)
5. What is planned next, with or without tickets? What is deliberately left as it is?

**Operating**
6. Which tasks do you do most often, and which rarely but critically? (This becomes the runbook list.)
7. Is there an unwritten rule before a risky task: snapshot, backup, version bump, announcement, order of steps?
8. Which steps in the repo docs are outdated, and which automated steps no longer work (blocked, removed, replaced)?
9. Which scheduled jobs or scripts did you inherit and never look at?

**Safety nets**
10. Has a restore or rollback ever been tested? Who knows how it works?
11. Where do alerts go and who reads them? Is that a person or a team address?
12. What recovers by itself when it breaks, and what needs a person?
13. How do you get in if the normal way fails (console, backup access)?

**Access and expiry**
14. Which systems and accounts does a new owner need, and do the colleagues already have them? Where do the secrets live (names only)? Is anything rotated, and on what schedule?
15. What expires (certificates, licenses, tokens, runtime or framework end of life), who owns each, and when is the next date?
16. Which other teams or vendors own something this depends on, and who do you ask there?

**Fragility**
17. What has gone wrong before? What fails under load or at certain times? What worries you?
18. What will the colleagues most likely get wrong first?

**Presentation**
19. Who will attend the walkthrough and what must it cover in 15 minutes?

## Tail: infrastructure and Ansible repos

- Which hosts or groups may never be touched without `--limit`? Which tags or roles are dangerous?
- Which roles are external, who owns them, and how are they updated?
- Where is the source of truth for network rules and VM definitions today?
- How are packages and OS releases upgraded, and is a reboot expected?

## Tail: Node.js or JavaScript services

- How is a release made, tagged and deployed? Who can do it, and how is it rolled back?
- Which environment variables and secrets does it need, and where do they come from?
- Which dependencies are outdated or pinned for a reason? Which runtime version is required and why?
- Are there workers, cron jobs or queues next to the main process? What happens to in-flight work during a deploy?
- How do you reproduce a production problem locally?

## Tail: Kubernetes deployment code

- Which clusters, contexts and namespaces does it touch, and who owns each cluster?
- What triggers a deploy (pipeline, manual command), and what does a rollback look like?
- How are images built, tagged and promoted? Which registry?
- How do config and secrets reach the pods? What happens when they change?
- Which Kubernetes API versions do the manifests use, and what happens at the next cluster upgrade?
- Which resource limits, probes and autoscaling settings were tuned on purpose, and why?
- What breaks first during cluster maintenance or a node drain?
