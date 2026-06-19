/**
 * Controlled vocabulary for the cross-stack recommender.
 *
 * The "interpretation" layer maps a user's free-text project description onto
 * three things we already model: which directories are relevant, which rating
 * aspects to emphasise, and which constraint tags to filter/boost on. This is a
 * deterministic keyword/synonym matcher — no LLM, no network, fully testable.
 *
 * A small embedding transformer (Workers AI bge-small) can later pre-rank these
 * same signals for fuzzier prose; see `embeddings.ts`. This vocabulary stays the
 * always-on fallback so the feature works offline and in tests.
 */

export type ConstraintTag = { key: string; value: string };

/** Structured intent the recommender consumes. */
export type StackIntent = {
  /** Directory slugs deemed relevant to the project. */
  directories: string[];
  /** aspectKey -> weight (1 = neutral, >1 = emphasise). Sparse. */
  weights: Record<string, number>;
  /** Constraint tags to match against item_tags. */
  tags: ConstraintTag[];
};

/** A directory and the phrases that signal it. */
type DirectorySignal = { slug: string; keywords: string[] };

/** A group of aspect keys and the phrases that signal "prioritise these". */
export type AspectSignal = {
  /** Display id for chips, e.g. "speed". */
  id: string;
  label: string;
  /** Real aspect keys (across directories) this emphasis boosts. */
  aspectKeys: string[];
  keywords: string[];
};

/** A constraint tag, the phrases that signal it, and aspects it also nudges. */
export type ConstraintSignal = {
  tag: ConstraintTag;
  label: string;
  keywords: string[];
  /** Aspect keys to additionally emphasise when this constraint is present. */
  boostsAspects?: string[];
};

export const DIRECTORY_SIGNALS: DirectorySignal[] = [
  { slug: "ai-dev-tools", keywords: ["ai editor", "copilot", "coding assistant", "ai coding", "code completion", "pair programmer", "ai dev tool", "code assistant"] },
  { slug: "databases", keywords: ["database", "databases", "db", "sql", "postgres", "postgresql", "mysql", "sqlite", "data store", "datastore", "relational", "nosql"] },
  { slug: "hosting", keywords: ["hosting", "host", "deploy", "deployment", "paas", "platform", "vercel", "netlify", "render", "fly.io"] },
  { slug: "vector-databases", keywords: ["vector", "vector database", "vector db", "embeddings", "semantic search", "rag", "pinecone", "similarity search"] },
  { slug: "observability", keywords: ["observability", "monitoring", "logging", "logs", "tracing", "apm", "metrics", "telemetry", "error tracking"] },
  { slug: "auth-platforms", keywords: ["auth", "authentication", "login", "sign in", "signin", "oauth", "sso", "identity", "users", "accounts"] },
  { slug: "queues-and-jobs", keywords: ["queue", "queues", "background job", "background jobs", "task queue", "message queue", "worker", "cron", "scheduled job"] },
  { slug: "payments", keywords: ["payment", "payments", "billing", "checkout", "stripe", "subscriptions", "subscription", "invoicing", "monetize", "monetisation"] },
  { slug: "analytics", keywords: ["analytics", "product analytics", "tracking", "events", "funnel", "funnels", "metrics dashboard", "usage tracking"] },
  { slug: "ci-cd", keywords: ["ci", "cd", "ci/cd", "cicd", "pipeline", "continuous integration", "continuous deployment", "build pipeline"] },
  { slug: "feature-flags", keywords: ["feature flag", "feature flags", "flags", "toggles", "experimentation", "rollout", "a/b test", "ab test"] },
  { slug: "frontend-frameworks", keywords: ["frontend framework", "frontend", "react", "vue", "svelte", "solid", "angular", "ui framework", "spa"] },
  { slug: "meta-frameworks", keywords: ["meta framework", "next.js", "nextjs", "next js", "nuxt", "remix", "astro", "sveltekit", "fullstack framework", "full stack framework", "ssr"] },
  { slug: "css-tools", keywords: ["css", "styling", "tailwind", "css framework", "styles", "stylesheet"] },
  { slug: "ui-component-libraries", keywords: ["component library", "ui kit", "ui library", "components", "design system", "shadcn", "material ui", "chakra"] },
  { slug: "orms", keywords: ["orm", "query builder", "database client", "prisma", "drizzle", "data mapper"] },
  { slug: "api-frameworks", keywords: ["api framework", "backend framework", "rest api", "graphql", "server framework", "web framework", "api server"] },
  { slug: "email-apis", keywords: ["email", "transactional email", "send email", "smtp", "email api", "mailer", "newsletter"] },
  { slug: "object-storage", keywords: ["object storage", "blob storage", "file storage", "s3", "buckets", "file uploads", "media storage"] },
  { slug: "llm-models", keywords: ["llm", "language model", "foundation model", "gpt", "claude", "gemini", "llama", "ai model"] },
  { slug: "llm-gateways", keywords: ["llm gateway", "ai gateway", "model router", "llm proxy", "model gateway"] },
  { slug: "image-generation", keywords: ["image generation", "image gen", "text to image", "diffusion", "generate images", "stable diffusion", "midjourney"] },
  { slug: "package-managers", keywords: ["package manager", "npm", "pnpm", "yarn", "bun install", "dependencies"] },
  { slug: "bundlers", keywords: ["bundler", "build tool", "webpack", "vite", "esbuild", "rollup", "bundling"] },
  { slug: "test-runners", keywords: ["test runner", "testing", "unit test", "unit tests", "jest", "vitest", "test framework"] },
  { slug: "linters-formatters", keywords: ["linter", "formatter", "lint", "eslint", "prettier", "biome", "code style"] },
  { slug: "validation-libraries", keywords: ["validation", "schema validation", "zod", "validator", "input validation", "parsing"] },
  { slug: "headless-cms", keywords: ["cms", "headless cms", "content management", "content", "contentful", "sanity"] },
  { slug: "state-management", keywords: ["state management", "state", "store", "redux", "zustand", "jotai", "global state"] },
  { slug: "ai-agent-frameworks", keywords: ["agent framework", "ai agent", "agents", "autonomous agent", "langchain", "agentic", "tool use"] },
  { slug: "mobile-frameworks", keywords: ["mobile", "mobile app", "ios", "android", "react native", "flutter", "expo", "mobile framework"] },
];

export const ASPECT_SIGNALS: AspectSignal[] = [
  {
    id: "speed",
    label: "Speed / performance",
    aspectKeys: ["speed", "performance", "latency", "query_speed", "deploy_speed", "install_speed", "cold_start"],
    keywords: ["fast", "speed", "performance", "performant", "low latency", "latency", "quick", "snappy", "high throughput", "throughput"],
  },
  {
    id: "cost",
    label: "Low cost",
    aspectKeys: ["cost", "free_tier", "fees", "egress_pricing"],
    keywords: ["cheap", "cost", "low cost", "budget", "affordable", "pricing", "inexpensive", "free tier"],
  },
  {
    id: "dx",
    label: "Developer experience",
    aspectKeys: ["dx", "ergonomics", "learning_curve", "config_dx"],
    keywords: ["dx", "developer experience", "easy to use", "ergonomic", "ergonomics", "simple", "beginner friendly", "easy"],
  },
  {
    id: "reliability",
    label: "Reliability",
    aspectKeys: ["reliability", "durability", "observability"],
    keywords: ["reliable", "reliability", "stable", "uptime", "durable", "durability", "production ready", "battle tested"],
  },
  {
    id: "ecosystem",
    label: "Ecosystem / integrations",
    aspectKeys: ["ecosystem", "integrations", "plugin_ecosystem", "integration_depth"],
    keywords: ["ecosystem", "community", "integrations", "plugins", "extensible", "popular", "mature"],
  },
  {
    id: "type_safety",
    label: "Type safety",
    aspectKeys: ["type_safety", "ts_support", "ssr_support"],
    keywords: ["type safe", "type safety", "typed", "type-safe"],
  },
  {
    id: "security",
    label: "Security / compliance",
    aspectKeys: ["security", "privacy", "compliance"],
    keywords: ["secure", "security", "privacy", "compliance", "soc2", "gdpr", "hipaa"],
  },
  {
    id: "scale",
    label: "Scalability",
    aspectKeys: ["scale", "regions", "durability"],
    keywords: ["scale", "scalable", "scalability", "high traffic", "high scale", "enterprise scale", "millions of users"],
  },
  {
    id: "quality",
    label: "Output quality",
    aspectKeys: ["accuracy", "quality", "output_quality", "ui_quality", "design_quality", "reasoning"],
    keywords: ["accurate", "accuracy", "high quality", "quality", "best in class", "polished"],
  },
];

export const CONSTRAINT_SIGNALS: ConstraintSignal[] = [
  {
    tag: { key: "runs-on", value: "cloudflare" },
    label: "Runs on Cloudflare",
    keywords: ["cloudflare", "cloudflare workers", "workers", "wrangler", "cf workers"],
  },
  {
    tag: { key: "deploy", value: "edge" },
    label: "Edge runtime",
    keywords: ["edge", "edge runtime", "edge functions", "edge network"],
  },
  {
    tag: { key: "deploy", value: "serverless" },
    label: "Serverless",
    keywords: ["serverless", "lambda", "functions as a service", "faas"],
  },
  {
    tag: { key: "pricing", value: "free-tier" },
    label: "Generous free tier",
    keywords: ["free", "free tier", "no cost", "hobby", "side project", "cheap", "budget"],
    boostsAspects: ["cost", "free_tier"],
  },
  {
    tag: { key: "self-hostable", value: "yes" },
    label: "Self-hostable / open source",
    keywords: ["self host", "self-host", "self hosted", "self-hosted", "on prem", "on-prem", "on premise", "open source", "open-source", "oss"],
  },
  {
    tag: { key: "language", value: "typescript" },
    label: "TypeScript-first",
    keywords: ["typescript", "ts", "type script"],
    boostsAspects: ["type_safety", "ts_support"],
  },
  {
    tag: { key: "language", value: "python" },
    label: "Python",
    keywords: ["python", "py", "django", "flask", "fastapi"],
  },
  {
    tag: { key: "realtime", value: "yes" },
    label: "Realtime / collaborative",
    keywords: ["realtime", "real-time", "real time", "websocket", "websockets", "live", "collaborative", "multiplayer"],
    boostsAspects: ["latency", "performance"],
  },
];
