// @ts-check
// EverythingRated documentation site — Blume presentation layer.
//
// The committed Markdown under docs/ is the source of truth. Blume is ONLY the
// presentation + search layer (see AGENTS.md → Documentation navigation). Do
// not edit docs content to satisfy Blume; edit Blume config to fit the docs.
//
// Usage:
//   pnpm install            # install Blume (pinned to 1.0.4)
//   pnpm docs:dev           # hot-reload preview
//   pnpm docs:build         # -> dist/ (gitignored)
//   pnpm docs:validate      # Blume link check (needs install)
//   pnpm docs:check         # fast dependency-free link check (no install)
//
// Blume requires Node >= 22.12. The app itself needs Node >= 20.
import { defineConfig } from 'blume';

export default defineConfig({
  // Site
  title: 'EverythingRated docs',
  description:
    'EverythingRated — multi-axis ratings platform narrowed to AI dev-tool adoption decisions. Architecture, product, development, operations, and learnings.',
  logo: {
    text: 'EverythingRated',
    href: '/',
  },

  // Content — the existing docs/ tree is the content root. No file moves needed.
  content: {
    root: 'docs',
  },

  // GitHub link in the header (also powers "Edit on GitHub" page actions).
  github: {
    owner: 'sarthakagrawal927',
    repo: 'everythingrated',
  },

  // Theme — quiet, technical.
  theme: {
    accent: 'indigo',
    radius: 'md',
    mode: 'system',
  },

  // Search — local, no hosted service.
  search: {
    provider: 'orama',
  },

  // Markdown
  markdown: {
    imageZoom: true,
    code: { icons: true, wrap: false },
    codeBlocks: {
      theme: { light: 'github-light', dark: 'github-dark' },
    },
  },

  // AI — emit llms.txt so agent crawlers can ingest the docs.
  ai: {
    llmsTxt: true,
    mcp: { enabled: false, route: '/mcp' },
  },

  // SEO
  seo: {
    og: { enabled: true },
    sitemap: true,
    robots: true,
    structuredData: true,
  },

  // Deployment — static output. The docs site is a separate concern from the
  // app Worker (everythingrated on ratings.highsignal.app). dist/ is gitignored.
  deployment: {
    output: 'static',
  },
});
