# Cloudflare Architecture

The Vite build is served by Cloudflare Pages. Marketing routes and the game shell are a client-side SPA; Pages `_redirects` returns `index.html` for public routes. `/api/*` is handled by Pages Functions before the SPA fallback.

D1 holds relational records. KV holds public configuration and short-lived rate-limit counters keyed by a truncated SHA-256 digest rather than a raw IP. R2 is reserved for authenticated player assets. Queues decouple contact notifications, save backups, moderation, and aggregation. Durable Objects are a future extension for live seasons and are not bound in the MVP.

All optional third-party browser integrations are gated by the local consent state. Server secrets never use the `VITE_` prefix.

Authentication uses salted PBKDF2-SHA256 hashes with a secret pepper and opaque session tokens whose SHA-256 hashes are stored in D1. Mutating routes validate request origin and sensitive public forms use Turnstile. Cloud saves and R2 object metadata are owner-scoped. Public leaderboard scores are derived server-side from cloud-save state.

Password reset and verified-email delivery remain future work; the UI does not claim those flows exist.
