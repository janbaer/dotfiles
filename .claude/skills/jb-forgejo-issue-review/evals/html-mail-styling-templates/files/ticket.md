# Draft: Style the HTML summary mails so they are easy to read

## Description

Since #76 the summary mails of `meetup-event-check` and `weekly-model-scouting` carry an HTML part, but it is unstyled browser default. The scouting mail of 2026-10-24 shows the problems: the text runs across the full window width, list entries are dense blocks with no spacing, code spans look like plain text in a monospace font, and nothing separates the header, the list and the closing lines.

`markdown_to_html.py` produces a bare fragment (`<p>`, `<ul>`, `<li>`, `<code>`, `<strong>`, `<em>`, `<a>`, `<br>`). The styling is added in a separate step, so the exact-output tests of `convert()` stay valid: a function in `markdown_to_html.py` that the command line entry point and `notify-mail.sh` use.

- A wrapper document with a content column of at most 640px, centred, with padding.
- Inline `style` attributes on the elements, because mail clients drop or rewrite `<style>` blocks: a system font stack, 15px text with a line height of 1.5, paragraph and list item spacing, a light background for `<code>`, a link colour.
- Colours are set explicitly for text and background (dark text on white), so a mail client in dark mode does not render dark text on a dark background.
- No remote images, no web fonts, no `<style>` block, no scripts.
- The text part of the mail, the escaping and the link rules from #73 do not change.

## Motivation

The content is correct and hard to read. The scouting summary is read once a week and decides the model choice, so a layout that can be scanned is worth a small change.

## Acceptance Criteria

- [ ] The HTML part is a complete document with a content column of at most 640px
- [ ] Every element the converter emits carries its style inline; the output has no `<style>`, no `<script>`, no `<link>` and no remote URL except those from Markdown links
- [ ] `convert()` returns the same strings as before; the existing tests in `tests/test_markdown_to_html.py` pass unchanged
- [ ] A test covers the styled output for the meetup and the model scouting summary format, including a code span, a list and a link
- [ ] Escaping, the URL scheme check and the text-only fallback keep working (the existing tests for them pass)
- [ ] The look of one real summary in a mail client is checked after the merge; created and verified by Jan

## How to Test

- `python3 -m unittest tests.test_markdown_to_html` and `bash tests/test_notify_mail.sh`
- Send the weekly job once and compare the mail with the 2026-10-24 version

Not part of this issue: the content of the scouting entries. The long reason text per category is what makes the mail dense; shortening it or splitting it into fields is a change in `weekly-model-scouting-verify.sh` and a separate decision.
