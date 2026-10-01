# Translation needed — Mongolian

A worklist, not a translation. **Nothing here has been machine-translated**, and
nothing should be: the Mongolian in this repo is written, and a transliterated
stand-in would be worse than an honest gap.

Generated 2026-09-30 by classifying every tracked `.md` as entirely English,
bilingual (has a `Монголоор` half), or mixed.

**Priority is about who reads the file.** This repo is unusual in the Tatar
family: its users are **Mongolian-speaking members of the public**, not
operators. A non-technical user who hits a false alarm on their own bank and
wants to report it should not meet an English form.

---

## High — end-user facing

**Closed 2026-09-30.** Both issue templates are now bilingual, Mongolian first,
in one file each — so GitHub's template picker stays simple and a reporter meets
their own language before anything else. The bug template also gained a warning
never to paste a password, OTP or account number, which the English original did
not carry and which matters most for exactly the readers who needed the
translation.

## Low — contributor-facing

**Closed 2026-09-30:** `.github/PULL_REQUEST_TEMPLATE.md` is bilingual, and
`docs/permissions.md` gained a Mongolian section. The English half of
`permissions.md` deliberately stays FIRST, because its primary reader is a
Chrome Web Store reviewer.

**Still open:**

| Section | File | Words | Note |
|---|---|---:|---|
| *(whole file)* | `CODE_OF_CONDUCT.md` | 313 | **Do not hand-translate.** Contributor Covenant v2.1 has an official Mongolian translation — use it rather than writing a second, divergent wording of a document whose exact phrasing is the point. |

---

## Deliberately *not* a gap

- **`docs/permissions.md`** (134 words) is written **for Chrome Web Store
  reviewers**, who read English. Translating it would serve nobody. It is
  English on purpose.
- **`docs/store-listing-en.md`** is the English store listing and has a
  Mongolian counterpart in `docs/store-listing-mn.md`.
- **`README.md` and `PRIVACY.md`** already carry a Mongolian half.
  `scripts/check-readme-parity.js` gates the README's two halves structurally in
  CI, so drift there is caught automatically.
- **`CONTRIBUTING.md`, `CHANGELOG.md`, `docs/recording-guide-mn.md`** are
  already Mongolian or mixed.

## If you translate one thing

The two issue templates — 143 words total, and they sit directly between a
worried user and the report that tells you a real bank is being flagged.
