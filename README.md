# EverythingRated

Multi-axis ratings platform. POC niche: AI developer tools.

## Run locally

```bash
cp .env.example .env.local
pnpm install
pnpm db:push       # creates local.db with the schema
pnpm db:seed       # 10 AI dev tools + 5 aspects + seed-owner ratings
pnpm dev           # http://localhost:3000
```

Open `/` for the grid; click a tool for the multi-axis rating page.

## Stack

Next.js 16 · React 19 · Tailwind v4 · Drizzle ORM · Turso libSQL ·
pnpm monorepo. No auth — ratings are anonymous, scoped to an httpOnly
`er_visitor` cookie minted on first rating.

See `agents.md` for architecture, conventions, and what NOT to add.
