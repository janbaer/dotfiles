# Dictation vocabulary

Jan dictates a lot of his text. It runs through a cleanup model whose prompt
carries a list of recurring proper nouns, but that list cannot hold names that
change from month to month. When I spot a name the cleanup missed, I put it into
the vocabulary file instead of correcting it again in the next session.

## Why

The cleanup prompt lives in `modules/home/desktop/dictate.nix` in `nixos-config`,
so every change to it costs a NixOS rebuild. Company names from a running
application round are worth a few weeks and no rebuild at all. They belong in
`~/.config/dictate/vocabulary.txt`, which `dictate.sh` reads at runtime.

I see Jan's text *after* the cleanup model ran, so what still looks wrong is
exactly what the current prompt fails on. Nobody else is in that position.

## When to add a term

All three must hold:

1. **It is a proper noun** — a person, a company, a product, a host name. Not an
   ordinary word, not a phrase.
2. **The wrong spelling is a speech-recognition error** — it sounds like the
   right one. "Computer Center" for *Computacenter*, "Kates" for *K3s*. A plain
   typo is not a dictation problem and does not belong here.
3. **The correct spelling is documented** — it comes from the diary, a repo, a
   mail, a ticket, or Jan's own correction in the conversation. Never from my
   guess about how a name is probably written.

Point 3 is the one that matters. A wrong entry does not stay a one-off error:
the prompt then corrects *towards* the wrong spelling on every future dictation.
When the spelling is not documented, ask instead of writing.

## What not to add

- Anything already in the `cleanupPrompt` list in `dictate.nix`. Check first —
  a duplicate is noise, and the file is meant to be readable by hand.
- Terms that are stable for years (tools, distributions, long-term employers).
  Those go into `dictate.nix` on the next occasion, not here.
- A term that is already in the file. Read it before appending.

## How to apply

Append the term on its own line, under the matching comment group
(`# Personen`, `# Firmen`, …), creating the group when none fits. One term per
line, nothing else — no explanation on the line itself.

The file is read at runtime, so the entry works on the next dictation. No
rebuild, no restart.

Then say in **one line** that the term was added, e.g. "Computacenter added to
the dictation vocabulary." That is deliberately louder than the English-tutor
rule, which stays silent: a wrong entry here changes future behaviour, so Jan
has to be able to veto it in the moment.

## Scope

Applies to Jan's own prompts and to text he dictated into a note. Not to code,
not to quoted output, not to text from other people.
