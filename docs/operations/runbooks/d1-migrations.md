# D1 migration runbook

Drizzle generates SQL into `packages/db/migrations/`. Wrangler applies them via
`pnpm db:migrate:local` (local `.wrangler` D1) or `pnpm db:migrate:remote`
(production binding `everythingrated-db`).

## Day-to-day

1. Edit `packages/db/src/schema.ts`.
2. `pnpm db:generate` — drizzle-kit writes a new `NNNN_*.sql` file.
3. Review the SQL diff. D1 SQLite supports a limited `ALTER TABLE` set —
   column drops and type changes will be emitted as rebuild scripts.
4. `pnpm db:migrate:local` and run the app to sanity-check.
5. Commit migration + schema together.
6. `pnpm db:migrate:remote` as part of deploy.

## Rollback

D1 has no transactional schema rollback and no `migrations down` command, so
treat every migration as forward-only. To undo:

- **Local** — delete the affected migration file from
  `packages/db/migrations/`, drop the row from the `meta/` journal, and rerun
  `pnpm db:migrate:local`. Local D1 lives in `.wrangler/` and can be wiped:
  `rm -rf apps/web/.wrangler/state/v3/d1`.
- **Remote** — write a *new* compensating migration (e.g. `DROP COLUMN`,
  reverse data backfill). Do not delete a migration that has already been
  applied to production; the `d1_migrations` table on the remote DB tracks
  applied filenames and will refuse to reapply or skip them.
- **Data loss** — if a migration corrupted data, restore from the latest
  `wrangler d1 export everythingrated-db --output=...` backup. There is no
  automated backup, so run an export before any destructive migration:

  ```bash
  wrangler d1 export everythingrated-db \
    --remote \
    --output=backup-$(date +%Y%m%d).sql \
    --config=apps/web/wrangler.toml
  ```

## Disaster recovery

If the remote DB drifts from local schema (e.g. partial apply), inspect with:

```bash
wrangler d1 execute everythingrated-db --remote \
  --command "SELECT name FROM d1_migrations ORDER BY id" \
  --config=apps/web/wrangler.toml
```

Compare against `packages/db/migrations/meta/_journal.json`. Apply any missing
migration explicitly, or restore from the most recent export.
