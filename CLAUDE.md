# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Warning: newer Next.js

This project uses Next.js 16. APIs, conventions, and file structure may differ from training data. Check `node_modules/next/dist/docs/` before writing code involving routing, rendering, or config.

## Commands

```bash
pnpm dev          # start dev server (localhost:3000)
pnpm build        # static export to out/
pnpm lint         # eslint
pnpm exec tsc -p tsconfig.json --noEmit   # type-check
pnpm exec cap sync          # sync web assets to native projects after build
pnpm exec cap open ios      # open Xcode
pnpm exec cap open android  # open Android Studio
```

No test suite yet.

## Architecture

**Cross-platform target:** Next.js static export (`output: 'export'`, `webDir: out`) wrapped by Capacitor (`com.jonathan.jazzpractice`). There is no server at runtime — every page must be `'use client'` and all data access is client-side SQLite.

**DB stack:** TypeORM 1.0 with `type: 'capacitor'` driver (`@capacitor-community/sqlite`). Entities are defined with `EntitySchema` (not decorators) to avoid the SWC / `emitDecoratorMetadata` conflict. On web, `jeep-sqlite` provides a WASM SQLite fallback, initialised as a custom element before the DataSource opens.

**DB initialisation flow:**
1. `lib/db-provider.tsx` — `DbProvider` mounts, creates `SQLiteConnection`, calls `initWebStore` on web, then initialises the TypeORM `DataSource` (which auto-runs migrations), then runs `seed()`.
2. `lib/db/data-source.ts` — `createDataSource(sqliteConnection)` factory; registers all EntitySchemas and the migration list.
3. `lib/db/migrations/001_initial.ts` — creates all 7 tables.
4. `lib/db/seed.ts` — inserts categories, rates, tasks, and songs once (guarded by `COUNT(*) > 0` on categories).

**Data access pattern:** Always use `ds.query(sql, params)` for queries. Do not use `createQueryBuilder` — no relations are defined in the EntitySchemas, so joins must be written as raw SQL. Get `ds` via the `useDb()` hook (throws if called outside `DbProvider`). TanStack Query wraps all `queryFn`s; cache is held in `app/providers.tsx`.

**Schema summary:**

| Table | Key columns |
|---|---|
| `categories` | id, name, monthly_target, sort_order |
| `rates` | id, name, value (times/week: 7=daily 3=3× 2=2× 1=weekly) |
| `tasks` | id, name, category_id (NOT NULL), rate_id (NULL when per_song=1), per_song, required |
| `songs` | id, name, status (not_started\|active\|maintenance) |
| `sessions` | id, date (YYYY-MM-DD), song_id (nullable), notes |
| `session_tasks` | session_id + task_id (composite PK) — weekly-rate task completions |
| `song_tasks` | song_id + task_id + completed_at (composite PK) — row existing = per-song task done |

**Per-song vs. weekly tasks:** Tasks with `per_song = 1` are one-time per standard (e.g. "Listen to three recordings"). Their completion is recorded in `song_tasks`, not `session_tasks`. Tasks with `per_song = 0` have a `rate_id` and are logged per session in `session_tasks`.

**Routing:** File-based App Router under `app/`. Nav links defined in `components/Nav.tsx`. Pages not yet built: `/session/new`, `/sessions`, `/sessions/[id]`, `/songs`, `/tasks`, `/settings`.

**Adding a migration:** Create `lib/db/migrations/NNN_name.ts` implementing `MigrationInterface`, then register it in the `migrations` array in `lib/db/data-source.ts`. Migrations run automatically on `DataSource.initialize()`.
