# CLAUDE_ARCHIVE.md — Resolved / Historical Notes

These items have been resolved or are historical incidents. Kept for reference only — do not apply as active guidance.

---

## Logo Bug Fix (2026-03-23) — RESOLVED
`.auth-logo` and `.topbar-brand` use `display:flex`. Bare text nodes became separate flex items causing extra gaps around `<em>MOB</em>`. Fixed by wrapping brand text in a `<span>` so the whole word is one flex item. Fix is live in all portal files.

---

## `create-account-manager-user` Not Deployed on Initial Setup — RESOLVED
On original project setup, the `create-account-manager-user` edge function was not deployed. This caused the AM creation flow to fail silently. The function has since been deployed. All edge functions must be explicitly deployed before use — see Commands in CLAUDE.md.
