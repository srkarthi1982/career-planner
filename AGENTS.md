⚠️ Mandatory: AI agents must read this file before writing or modifying any code.

MANDATORY: After completing each task, update this repo’s AGENTS.md Task Log (newest-first) before marking the task done.
This file complements the workspace-level Ansiversa-workspace/AGENTS.md (source of truth). Read workspace first.

⚠️ Mandatory: AI agents must read this file before writing or modifying any code in the career-planner repo.

# AGENTS.md
## Career Planner Repo – Session Notes (Codex)

This file records what was built/changed so far for the career-planner repo. Read first.

---

## 1. Current Architecture (Career Planner)

- Astro mini-app aligned to Ansiversa standards.
- Auth handled by parent app JWT; middleware enforces auth.
- Shared layouts: `AppShell.astro` and `AppAdminShell.astro`.
- Notification unread count fetched in AppShell via parent API (SSR).
- One global Alpine store per app pattern.
- Minimal Career Planner landing + help page.

---

## 2. DB Tables

Defined in `db/tables.ts`:

- None (baseline reset; add domain tables when ready)

---

## 3. Task Log (Newest first)

- 2026-02-03 Built Career Planner V1 (goals/milestones/tasks, FREE_LIMITS, actions, pages, notifications, summary push).
- 2026-02-03 Career Planner baseline reset to App Starter (removed example module + admin pages, updated identity).
- 2026-02-02 Corrected notifications payload contract and tightened billing/webhook/unread-count rules in APPSTARTER-INTEGRATIONS.md.
- 2026-02-02 Updated APPSTARTER-INTEGRATIONS.md with bootstrap rules, contracts, cleanup, and checklist clarifications.
- 2026-02-01 Added `/help` page and wired Help link into the mini-app menu.
- 2026-02-01 Implemented AppStarter core integrations (requirePro, paywall pattern, dashboard + notification webhooks, safe auth redirects, summary schema).
- 2026-02-01 Added APPSTARTER-INTEGRATIONS.md checklist in repo root.
- 2026-01-31 Normalized payment fields in `Astro.locals.user` to avoid undefined values (stripeCustomerId/plan/planStatus/isPaid/renewalAt).
- 2026-01-31 Added locals.session payment flags in middleware/types and a temporary `/admin/session` debug page for Phase 2 verification.
- 2026-01-29 Added parent notification helper and demo item-created notification in example flow.

- 2026-01-28 Added app-starter mini-app links (Home, Items) and bumped @ansiversa/components to ^0.0.119.
- 2026-01-28 Added local/remote dev+build scripts for dual DB mode support.
- 2026-01-25 Updated README to match standardized file-based remote DB workflow and db:push command.
- 2026-01-25 Added missing .env for local dev defaults (auth secrets + dev bypass values).
- 2026-01-25 Standardized Astro DB scripts: we intentionally run file-based remote mode locally; use `npm run db:push` for schema push.
- 2026-01-17 Expanded README with mental model, first-run checklist, and standards framing.
- 2026-01-17 Added DEV_BYPASS_AUTH env defaults to enable local dummy session.
- 2026-01-17 Expanded public routes/static allowlist and simplified admin role check in middleware.
- 2026-01-17 Added DEV_BYPASS_AUTH dummy session injection for community development.
- 2026-01-17 Added freeze note to README and AGENTS (Starter Freeze Jan-17-2026).
- 2026-01-17 Fixed typecheck errors by tightening auth guard typing and SSR items typing.
- 2026-01-17 Updated admin items description and README command list for current scripts.
- 2026-01-17 Removed unused user sort branches and required cookie domain in prod.
- 2026-01-17 Aligned env typing and admin items copy with standards; enforced prod session secret check.
- 2026-01-17 Rebuilt admin landing to match web layout with a single Items card.
- 2026-01-17 Switched dev/build to persistent local DB using file-based remote mode; added db push script.
- 2026-01-17 Set admin items pagination to 10 per page.
- 2026-01-17 Tightened /items breadcrumb spacing using existing crumb styles.
- 2026-01-17 Added breadcrumb to /items SSR page.
- 2026-01-17 Made /items page read-only SSR list (removed create/update/delete UI).
- 2026-01-17 Exported adminCreateItem action to fix admin item creation.
- 2026-01-17 Added admin items create/edit drawer, user-name display, and per-user filtering to mirror roles page behavior.
- 2026-01-17 Added sorting and toolbar actions on admin items to match roles page.
- 2026-01-17 Aligned admin items page layout with web roles pattern (toolbar, empty state, pager, confirm dialog).
- 2026-01-17 Switched local dev/build scripts to non-remote Astro DB; added remote scripts.
- 2026-01-17 Verified local Astro DB via shell; created ExampleItem table and inserted a test row.
- 2026-01-17 Removed remote Astro DB credentials to use local DB defaults.
- 2026-01-16 App-starter rebuilt from quiz golden base; example CRUD module added; README/AGENTS updated.
- 2026-01-16 AppShell now calls local notification proxy; env docs updated with PARENT_APP_URL and auth secret note.
- 2026-01-26 Fixed Astro DB scripts overriding remote envs by removing hardcoded ASTRO_DB_REMOTE_URL; added .env.example guidance and ignored .env.local/.env.*.local so Vercel uses env vars.
- 2026-01-26 Bumped @ansiversa/components to ^0.0.117 to align with latest resume schema (declaration field).
- 2026-01-26 Added APP_KEY config and wired miniAppKey into AppShell to show AvMiniAppBar; bumped @ansiversa/components to ^0.0.118.
- 2026-01-26 Added local ASTRO_DB_REMOTE_URL (file:.astro/content.db) in .env to fix ActionsCantBeLoaded for local dev; no repo config changes.

## Verification Log

- 2026-02-03 Typecheck hints cleaned to 0.
- 2026-02-03 `npm run typecheck` (pass; 0 hints).
- 2026-02-03 `npm run build` (pass).
- 2026-02-03 `npm run typecheck` (pass; 6 hints: baseRepository + auth redirect pages unused imports).
- 2026-02-03 `npm run build` (pass).
- 2026-02-01 `npm run typecheck` (pass; 6 hints in redirect pages/baseRepository).
- 2026-02-01 `npm run build` (pass).
- 2026-01-31 Pending manual check: paid user sees non-null fields; free user sees null/false in `Astro.locals.user`.
- 2026-01-31 Pending manual check: `/admin/session` shows isPaid true for paid user and false for free user.
- 2026-01-29 `npm run typecheck` (pass; 1 hint in baseRepository).
- 2026-01-29 `npm run build` (pass).
- 2026-01-29 Smoke test: not run (manual create item).

---

## Verification Checklist (Template)

- [ ] Auth locals normalized
- [ ] Billing flags present
- [ ] `requirePro` guard works
- [ ] Paywall UI pattern present
- [ ] Dashboard webhook push works
- [ ] Notifications helper wired
- [ ] Admin guard works
- [ ] Layout + `global.css` correct
- [ ] Webhook timeouts + retries documented
- [ ] Build/typecheck green

## Task Log (Recent)
- Keep newest first; include date and short summary.
- 2026-02-09 Enforced repo-level AGENTS mandatory task-log update rule for Codex/AI execution.
- 2026-02-09 Verified repo AGENTS contract linkage to workspace source-of-truth.
