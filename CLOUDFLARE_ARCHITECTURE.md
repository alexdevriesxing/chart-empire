# Cloudflare Architecture

The Vite build is served by Cloudflare Pages. Marketing routes and the game shell are a client-side SPA; Pages `_redirects` returns `index.html` for public routes. `/api/*` is handled by Pages Functions before the SPA fallback.

D1 holds relational records. KV holds public configuration and short-lived rate-limit counters keyed by a truncated SHA-256 digest rather than a raw IP. R2 is reserved for authenticated player assets. Queues decouple contact notifications, save backups, moderation, and aggregation. Durable Objects are a future extension for live seasons and are not bound in the MVP.

All optional third-party browser integrations are gated by the local consent state. Server secrets never use the `VITE_` prefix.

Authentication is deliberately left disabled. Before enabling it, select an identity system, define verified-email and recovery flows, store only audited password hashes or provider identifiers, rotate sessions, add CSRF protections where relevant, and bind every save/upload to the authenticated user.
