---
name: photo-organizer
description: >
  Organizes and renames a folder of trip or event photos by analyzing each image
  visually, generating descriptive names, detecting near-duplicate burst shots, and
  copying everything into a renamed/ subfolder. Automatically detects the event name
  and date from the current folder name and asks the user to confirm before proceeding.
  Use this skill whenever the user wants to rename, organize, describe, or catalog
  photos from a trip, event, or photo shoot — triggered by phrases like "organize my
  photos", "rename the photos in this folder", "analyze and name my trip photos",
  "clean up my photo folder", or whenever the working directory looks like a photo
  collection (contains many .jpg/.JPG files).
---

# Photo Organizer

Rename and organize a folder of event or trip photos: detect context from the folder
name, analyze each image visually, detect duplicate burst shots, and copy everything
into a `renamed/` subfolder with descriptive, date-stamped filenames.

---

## Phase 1 — Detect Folder Context

Parse the **name of the current working directory** to extract:

- **Event name** — the human-readable trip or event label
- **Date hint** — any year/month embedded in the folder name

Recognise these common patterns (and reasonable variations):

| Folder name | Event | Date hint |
|---|---|---|
| `202604 - Erfurt` | Erfurt | April 2026 |
| `20260403 - Paris Trip` | Paris Trip | 3 Apr 2026 |
| `2026-07 Mallorca` | Mallorca | July 2026 |
| `Rome 2026` | Rome | 2026 |
| `Hochzeit Anna & Tom` | Hochzeit Anna & Tom | (none) |

Present your reading to the user and ask for confirmation before doing anything else:

> "I detected this folder as: **Event = Erfurt**, date context **April 2026**.
> Does that look right, or would you like a different event name?"

---

## Phase 2 — Clarify Preferences

Combine these into **one message** to keep it efficient:

1. **Description language** — which language for photo descriptions? (suggest German if folder/event name is German, otherwise English)
2. **Counter scope** — global counter across all photos (e.g. 001–078), or reset per day?
3. **Output folder** — default is a `renamed/` subfolder inside the current directory; ask if they want something different

---

## Phase 3 — Extract Timestamps

List all image files (`.JPG`, `.jpg`, `.jpeg`, `.JPEG`), then extract `DateTimeOriginal`
from EXIF data for the whole batch at once using ImageMagick:

```bash
identify -format "%[EXIF:DateTimeOriginal]|%f\n" *.JPG *.jpg 2>/dev/null | sort
```

Sort chronologically. Each line gives you `YYYY:MM:DD HH:MM:SS|filename` — parse the
date into `YYYYMMDD` for the output filename.

> **If `identify` is not available**, fall back to reading the date from the filename
> itself (works for smartphone files like `IMG20260403161247.jpg`) or use Python's
> `PIL.Image._getexif()`.

---

## Phase 4 — Visual Analysis

Read each photo using the `Read` tool — Claude is multimodal and can see the images.
Process in **batches of 6 parallel Read calls** for speed.

For each photo, note:

- A **concise description** (3–6 words) in the chosen language — be specific about
  what's actually visible (landmark name if recognisable, scene type, key subject)
- Whether it is a **near-duplicate** of the immediately preceding photo

**Duplicate detection rule:** mark a photo as a duplicate only when all of these hold:
- Taken within ~30 seconds of the previous photo (check timestamps)
- Shows the same subject/scene from essentially the same angle
- Offers no meaningfully new information compared to the previous shot

Do **not** flag as a duplicate just because it shows the same landmark visited earlier
or shot from a different camera (e.g. phone vs. DSLR). Only flag true burst/
accidental double-shots.

---

## Phase 5 — Build the Rename Mapping

Compile a mapping table:

```
counter | original_file | date (YYYYMMDD) | description | duplicate_of
```

Rules:
- Counter increments only for **non-duplicate** photos
- Duplicates inherit the counter of the photo they duplicate
- Zero-pad the counter to 3 digits: `001`, `002`, …

**Output filename format:**
```
YYYYMMDD - {EventName} - {NNN} - {Description}.jpg
```

**Duplicate filename format** (append after the description, before `.jpg`):
- German: `(Duplikat 2)`, `(Duplikat 3)`, …
- English: `(duplicate 2)`, `(duplicate 3)`, …

**Umlaut rule — always apply to both the description AND the event name:**

Never use German umlauts or ß in filenames. Replace them with the standard German
alternative spelling before constructing any filename:

| Character | Replace with |
|-----------|-------------|
| ä / Ä | ae / Ae |
| ö / Ö | oe / Oe |
| ü / Ü | ue / Ue |
| ß | ss |

Examples: `Krämerbrücke` → `Kraemerbruecke`, `Straße` → `Strasse`,
`Überblick` → `Ueberblick`, `Fußgängerzone` → `Fussgaengerzone`

Apply this substitution as the final step before writing the filename — after the
description is finalized, before calling `shutil.copy2`.

---

## Phase 6 — Execute Copies

1. Create the output folder (`mkdir -p`)
2. Write a short Python script that calls `shutil.copy2(src, dst)` for each mapping
   entry — `copy2` preserves EXIF and file timestamps
3. Run it and report any errors
4. **Verify**: file count in output folder must equal total input file count
5. **Confirm originals untouched**: re-count files in the source directory

---

## Phase 7 — Summary

Report:
- Total photos processed
- Unique photos (= final counter value)
- Duplicates detected (count and which groups)
- Output folder path
- Sample of generated names (first 5 + last 5)
