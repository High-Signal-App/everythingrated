// Augments OpenNext's CloudflareEnv with the everythingrated bindings.
declare global {
  interface CloudflareEnv {
    DB: D1Database;
    MODERATION_TOKEN?: string;
  }
}

export {};
