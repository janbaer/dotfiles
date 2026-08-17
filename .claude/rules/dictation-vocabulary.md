# Dictation vocabulary

A proper noun that keeps coming back wrong goes into
`~/.config/dictate/vocabulary.txt`, which `dictate.sh` reads at runtime, so the
entry works on the next dictation. The permanent list is `cleanupPrompt` in
`modules/home/desktop/dictate.nix` — only names worth keeping for years belong
there.

## When to add a term

Fires when I read text Jan dictated and a proper noun is still wrong: I see the
text after the cleanup model ran, so its remaining errors are exactly what the
prompt misses. All three must hold:

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

- Anything already in the `cleanupPrompt` list in `dictate.nix`, or already in
  the vocabulary file. Read both first.
- Terms that are stable for years (tools, distributions, long-term employers).
  Those go into `dictate.nix` on the next occasion, not here.

## How to apply

Append the term on its own line, under the matching comment group
(`# Personen`, `# Firmen`, …), creating the group when none fits. One term per
line, nothing else — no explanation on the line itself.

Then say in **one line** that the term was added, e.g. "Computacenter added to
the dictation vocabulary." Deliberately louder than the English-tutor rule,
which stays silent: a wrong entry changes future behaviour, so Jan has to be
able to veto it in the moment.

## Scope

Applies to Jan's own prompts and to text he dictated into a note. Not to code,
not to quoted output, not to text from other people.
