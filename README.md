# EverythingRated

Multi-axis ratings platform. POC niche: AI developer tools.

## Run locally

```bash
cp .env.example .env.local
pnpm install
pnpm db:migrate:local
pnpm db:seed:local
pnpm dev           # http://localhost:3000
```

Open `/` for the grid; click a tool for the multi-axis rating page.

## Deploy

```bash
pnpm db:migrate:remote
pnpm db:seed:remote
pnpm deploy        # opennextjs-cloudflare build && deploy
```

## Stack

Next.js 16 · React 19 · Tailwind v4 · Drizzle ORM · Cloudflare D1 ·
`@opennextjs/cloudflare` on Workers · pnpm monorepo. No auth — ratings are
anonymous, scoped to an httpOnly `er_visitor` cookie minted on first rating.

See `agents.md` for architecture, conventions, and what NOT to add.
