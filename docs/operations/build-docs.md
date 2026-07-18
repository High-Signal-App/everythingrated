# Building the docs site (Blume)

The committed Markdown under `docs/` is the source of truth. **Blume is only
the presentation and search layer** — it renders those same files into a
searchable site. Never edit docs content to satisfy Blume; edit Blume config
to fit the docs. See [`blume.config.ts`](../../blume.config.ts) at repo root.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm docs:check` | Dependency-free Markdown link + structure check (no Node build needed). The CI gate. |
| `pnpm docs:validate` | `blume validate` — Blume's own link check (needs install). |
| `pnpm docs:build` | `blume build` → static site in `dist/` (gitignored). |
| `pnpm docs:dev` | `blume dev` — hot-reload preview server. |
| `pnpm docs:preview` | `blume preview` — serve the last build. |
| `pnpm docs:doctor` | `blume doctor` — diagnose config/content problems. |

`pnpm docs:check` is the fast, no-install validator backed by
[`scripts/validate-docs.sh`](../../scripts/validate-docs.sh). Use it for
day-to-day edits. The Blume commands need `pnpm install` to pull the pinned
`blume` dev dependency (Node ≥ 22.12).

## When to build

You do **not** need to build Blume to validate docs. The committed Markdown
stands on its own. Build Blume only to:

- Preview the published docs site locally (`pnpm docs:dev`).
- Verify a production render before a docs deploy (`pnpm docs:build` &&
  `pnpm docs:validate`).
- Catch a frontmatter/`meta.ts` issue that the fast link checker cannot see.

The `docs.yml` workflow runs the link check on every push/PR (blocking) and
the Blume render verify on opt-in (non-blocking, `continue-on-error: true`).

## `pnpm docs:check` vs `pnpm docs:validate` — which is authoritative

**`pnpm docs:check` is the authoritative link gate.** It is a dependency-free
Python checker (`scripts/validate-docs.sh`) that resolves **every** internal
Markdown link in the repo — including links from `docs/` to root files
(`../STATUS.md`, `../PROJECT_STATUS.md`, `../agents.md`), to code
(`../../packages/db/src/schema.ts`), and to `.github/` / `.husky/` paths. It
runs in CI with no install.

**`pnpm docs:validate` (`blume validate`) only checks links *inside* the
`docs/` content root** — i.e. links to other rendered pages. It will report
`BLUME_BROKEN_LINK` for any link that points outside `docs/` (root docs, code,
workflow files, husky hooks) because those are not pages in the Blume site.
Those reports are **expected and not defects**: the link is valid in the
Markdown source (and passes `docs:check`), it just is not a rendered docs
page. This is why `blume-build` is `continue-on-error` in CI.

If you want a link to be a real docs page, it must live under `docs/`. If it
is a repo-context reference (code, root doc, CI file), keep it as-is —
`docs:check` covers it.

## Output

`blume build` writes to `dist/` (gitignored — see `.gitignore`). Blume's own
runtime cache (`.blume/`, `.blume-verify/`, `.astro/`) is also gitignored. Do
not commit generated docs artifacts; the Markdown is the source of truth.

## Node version

Blume requires Node ≥ 22.12. The app itself needs Node ≥ 20. CI uses Node 22
for both. Locally, use a Node 22+ runtime when running `pnpm docs:dev` /
`pnpm docs:build`; `pnpm docs:check` works on any Node with `python3`.

## pnpm hoisting (`.npmrc`)

Blume generates an Astro project under `.blume/` whose `astro.config.mjs`
imports `astro/config`, `@astrojs/*`, `@shikijs/*`, and `@tailwindcss/vite`.
pnpm's strict `node_modules` does not hoist these transitive deps, so the
repo-root [`.npmrc`](../../.npmrc) declares scoped `public-hoist-pattern`
entries for the astro/blume ecosystem. **Do not remove `.npmrc`** — `pnpm
docs:build` and `pnpm docs:dev` will fail with `Cannot find module
'astro/config'` without it. It only adds visibility at the top-level
`node_modules`; it does not change the app's own dependency graph.

## Related

- [../index.md](../index.md) — docs map and maintenance rules.
- [jobs.md](jobs.md) — the `docs.yml` CI workflow.
- [../development/setup.md](../development/setup.md) — local dev setup.
