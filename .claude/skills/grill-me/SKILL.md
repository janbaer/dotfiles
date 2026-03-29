---
name: grill-me
description: Interview the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. Use when user wants to stress-test a plan, get grilled on their design, or mentions "grill me".
---

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one.

If a question can be answered by exploring the codebase, explore the codebase instead.

Once the interview is done, and **only if not already being called from within the `forgejo-issue-create` skill**, ask the user if a new Forgejo issue should be created. If yes, use the `forgejo-issue-create` skill and follow the instructions from that skill.

For each question, provide your recommended answer.

---

If the user denies that a new Forgejo issue should be created, ask them what they want to do with the output of this interview. If the user wants to start working, ask him, if a OpenSpec should be created with that information.

If both options are not used, create a spec file in `./docs` folder.
