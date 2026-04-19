# German text rules

When producing German prose on Jan's behalf — diary entries, Obsidian notes, Markdown docs, commit message bodies, anything longer than a single sentence — clean the text up before writing it out. Jan writes from a terminal and ASCII-substitutes umlauts; he also makes typos under morning fog or when typing quickly.

## Corrections to apply

1. **Restore umlauts** — `ae`→`ä`, `oe`→`ö`, `ue`→`ü`, and uppercase `Ae`→`Ä`, `Oe`→`Ö`, `Ue`→`Ü`. Context-aware: leave proper nouns, English loanwords (*Aero*, *User*, *Queue*, *User Interface*), and already-correct words alone. Orient yourself at the surrounding German context.
2. **`ss` vs. `ß`** — `ß` after long vowels and diphthongs (*Strasse*→*Straße*, *grüsse*→*grüße*, *heissen*→*heißen*); `ss` stays after short vowels (*muss*, *dass*, *Fluss*, *Kuss*). If unsure, leave `ss` — wrong `ß` is worse than missing `ß`.
3. **Typos and grammar** — doubled letters, missing or extra spaces, swapped or misspelled words, wrong articles, agreement errors, missing commas before subclauses. Fix them.
4. **Preserve voice** — Jan writes conversationally, first-person, unpretentious, often with a dry edge. You are a proofreader, not an editor. No sentence reordering, no fancy synonyms, no polish for polish's sake. If a phrase sounds casual, leave it casual.

## How to apply

- Corrections are **silent**. Do not list "here's what I fixed" after writing. The output just looks right.
- Apply only to **prose you are about to write to disk** on Jan's behalf (skill outputs, note contents, commit bodies). Not to user prompts, not to verbatim quotes, not to your own chat replies unless those are being persisted.
- Do not apply to code, file paths, commands, identifiers, or technical terms embedded in the prose — those stay literal.

## Why

Jan's terminal input loses umlauts, but the files he reads back in Obsidian or git should be correct German. Doing this at write-time means he never has to post-edit, and his notes stay searchable by the real German word (*Straße*, not *Strasse*).
