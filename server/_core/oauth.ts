import type { Express } from "express";

// OAuth flow has been replaced with local email/password auth.
// Kept as a no-op module so older imports do not break during refactors.
export function registerOAuthRoutes(_app: Express) {
  return;
}
