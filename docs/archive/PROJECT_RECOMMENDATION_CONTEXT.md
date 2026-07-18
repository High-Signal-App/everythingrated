# Project Recommendation Context

Generated: 2026-06-06T21:14:19.550Z

This file is a CodeVetter Repo Unpacked-inspired audit written for Starboard recommendations. It is intentionally local, evidence-oriented, and safe to commit: it records product context, feature areas, stack inventory, and recommendation guidance without secrets or environment values.

## Project Identity

- Slug: `everythingrated`
- Registry description: Ratings and review-style app.
- Product grouping: `internal-first`
- Source path: `everythingrated`

## Product Context

Ratings and review-style app.

EverythingRated is a multi-axis ratings platform. The current POC tests whether directory-specific aspect rubrics are more useful than one collapsed score, using anonymous ratings and narrow seeded directories before adding accounts or broad submission workflows.

EverythingRated Multi-axis ratings platform. Instead of collapsing a tool, product, or service into one score, each directory defines the aspects that matter for that kind of thing and collects per-aspect ratings. Live app: <https://everythingrated.sarthakagrawal927.workers.dev Current POC directories: - AI developer tools - Databases - Hosting platforms Product Bet Most rating apps ask for one number and lose the actual decision context. EverythingRated is testing whether a directory-specific rubric is more useful: an AI editor should be judged on different axes than a database or hosting provider. The first version is anonymous and intentionally narrow so the multi-axis UX can be tested be

## Feature Map

- **Cloudflare and deploy**: Workers, Pages, edge runtime, queues, storage, and deploy automation. Keywords: cloudflare, worker, workers, pages, edge, deploy, wrangler, queue.
- **UI workflows**: Dashboards, tables, forms, component systems, charts, and user workflows. Keywords: ui, ux, dashboard, table, component, react, next, tailwind.
- **AI agents**: Agents, tool use, workflows, orchestration, RAG, evals, and model integration. Keywords: ai, agent, agents, llm, rag, embedding, eval, model.
- **Testing and quality**: Unit tests, browser tests, evals, CI quality gates, and regression checks. Keywords: test, testing, quality, vitest, playwright, ci, eval, benchmark.
- **Repo intelligence**: Repository understanding, metadata enrichment, code review, and evidence reports. Keywords: review, static, analysis, diff, history, evidence, verification.
- **Auth and identity**: Auth, OAuth, sessions, users, permissions, and account flows. Keywords: auth, oauth, identity, session, user, permission, login, nextauth.
- **Database and storage**: SQL, document storage, migrations, cache, queues, vectors, and persistence. Keywords: database, db, sql, sqlite, postgres, turso, libsql, drizzle.

## Runtime Surfaces and Entrypoints

- `apps/web/src/app/about/page.tsx`
- `apps/web/src/app/api-docs/page.tsx`
- `apps/web/src/app/aspects/page.tsx`
- `apps/web/src/app/directories.json/route.ts`
- `apps/web/src/app/humans.txt/route.ts`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/list/page.tsx`
- `apps/web/src/app/moderation/page.tsx`
- `apps/web/src/app/my/page.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/privacy/page.tsx`
- `apps/web/src/app/random/page.tsx`
- `apps/web/src/app/submit-directory/page.tsx`
- `apps/web/src/app/terms/page.tsx`
- `apps/web/src/app/trending/page.tsx`

## Current Stack

- Languages: `TypeScript`
- Frameworks/tools: `Cloudflare Workers`, `Drizzle`, `Next.js`, `OpenNext Cloudflare`, `Playwright`, `React`, `Tailwind CSS`
- Config files:
- `apps/web/next.config.ts`
- `apps/web/playwright.config.ts`
- `apps/web/wrangler.toml`
- `packages/db/drizzle.config.ts`

## OSS Already In Use

Direct dependencies:
- `@everythingrated/db`
- `@opennextjs/cloudflare`
- `@saas-maker/changelog-widget`
- `@saas-maker/feedback`
- `@saas-maker/testimonials`
- `class-variance-authority`
- `clsx`
- `drizzle-orm`
- `next`
- `posthog-js`
- `react`
- `react-dom`
- `tailwind-merge`

Development dependencies:
- `@cloudflare/workers-types`
- `@playwright/test`
- `@saas-maker/eslint-config`
- `@saas-maker/tsconfig`
- `@tailwindcss/postcss`
- `@types/node`
- `@types/react`
- `@types/react-dom`
- `drizzle-kit`
- `eslint`
- `eslint-config-next`
- `husky`
- `next`
- `tailwindcss`
- `tsx`
- `typescript`
- `wrangler`

Package scripts:
- `build`
- `cf:build`
- `db:generate`
- `db:migrate:local`
- `db:migrate:remote`
- `db:seed:local`
- `db:seed:remote`
- `db:studio`
- `deploy`
- `dev`
- `generate`
- `lint`
- `migrate:local`
- `migrate:remote`
- `prepare`
- `start`
- `studio`
- `test`
- `test:e2e`
- `typecheck`

## Testing and Quality Signals

- `apps/web/e2e/mobile.spec.ts`
- `apps/web/playwright.config.ts`
- `apps/web/src/lib/collections.test.ts`
- `apps/web/src/lib/comparison.test.ts`
- `apps/web/src/lib/directory-submissions.test.ts`
- `apps/web/src/lib/item-submissions.test.ts`

## Recommendation Guidance

Good matches:
- Repos that strengthen cloudflare and deploy without replacing already-installed libraries.
- Repos that strengthen ui workflows without replacing already-installed libraries.
- Repos that strengthen ai agents without replacing already-installed libraries.
- Repos that strengthen testing and quality without replacing already-installed libraries.
- Repos that strengthen repo intelligence without replacing already-installed libraries.
- Repos that strengthen auth and identity without replacing already-installed libraries.
- Repos that strengthen database and storage without replacing already-installed libraries.
- Tools with concrete support for src, page.tsx, item, cloudflare, moderation, aspect, directory, ratings.
- Implementation repos, SDKs, CLIs, testing utilities, adapters, and focused libraries are higher value than generic awesome lists.

Avoid recommending:
- Do not recommend packages already listed under direct or development dependencies unless the task is migration research.
- Do not recommend broad framework replacements unless the project context explicitly calls for a rewrite.
- Downrank curated lists, archived repos, stale demos, and generic UI kits that do not map to the feature catalog.

## Evidence Read

Primary docs and handoff files:
- `PROJECT_STATUS.md`
- `README.md`
- `agents.md`
- `docs/migrations.md`

Package manifests:
- `apps/web/package.json`
- `package.json`
- `packages/db/package.json`

Inventory notes:
- Files scanned: 129
- This pass uses deterministic repo inventory plus local documentation/source-path evidence. It does not claim a full manual line-by-line review of every source file.

## Confidence

Confidence: **high**

Why:
- PROJECT_STATUS.md present
- README.md present
- 15 entrypoint/runtime files identified
- package dependencies inventoried
- 6 test/quality files identified

Refresh command:

```bash
cd /Users/sarthak/Desktop/fleet/starboard
pnpm fleet:audit-recommendation-context
pnpm fleet:extract-projects
```
