# Chart Empire: The Music Label Manager

A premium fictional music-industry management game and marketing website built with Vite, TypeScript, Phaser 4, and Cloudflare Pages.

Players create a label, scout generated artists, sign a roster, record and release songs, run campaigns, resolve weekly simulations, compete against AI labels, read industry news, manage cashflow, and pursue chart success. Guest play works without registration.

## Current MVP

- Premium responsive landing site and all requested public routes
- Lazy-loaded Phaser 4 animated game layer on `/play`
- DOM-based accessible management UI
- Label creation, visual mark selection, 12 strategies, and 11 markets
- 75 procedurally generated fictional artists
- 16 rival labels, 12 publications, 12 radio networks, and 10 streaming platforms
- Scouting, signing, recording, releasing, promotion, weekly resolution, charts, finance, news, and achievements
- 150 deterministic event templates, 25 trend themes, fictional social posts, staff hiring, touring, contracts, and challenge progress
- IndexedDB guest saves with LocalStorage fallback
- Save export/import
- PBKDF2 password accounts with opaque HttpOnly sessions
- Authenticated D1 cloud careers, account export/deletion, server-verified leaderboards, and R2 logo uploads
- Consent-gated external media and ad hooks
- Xing Records and Indie Music Promotion partner pages
- Cloudflare Pages Functions, D1 migrations, KV/R2/Queue bindings, security headers, and rate-limit hooks
- PWA manifest, offline fallback, sitemap, robots, structured metadata, and CI

Registered careers use Workers Web Crypto PBKDF2-SHA256 password hashes with per-user salts and a secret production pepper. Sessions are opaque, hashed in D1, HttpOnly, Secure, SameSite=Lax, and expire after 30 days. Registration, login, deletion, and contact require server-validated Turnstile.

## Local development

Prerequisites: Node.js 22+ and npm 10+.

```bash
npm install
npm run dev
```

Open the Vite URL. Useful checks:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run preview
```

## Configuration

Copy `.env.example` to `.env.local` and configure public values. Never put secrets in a `VITE_` variable.

Song of the Week:

- `VITE_SONG_OF_WEEK_YOUTUBE_ID`
- `VITE_SONG_OF_WEEK_TITLE`
- `VITE_SONG_OF_WEEK_ARTIST`
- `VITE_SONG_OF_WEEK_URL`

Partners:

- `VITE_XING_RECORDS_URL`
- `VITE_INDIE_MUSIC_PROMOTION_URL`

Advertising is disabled by default. Configure the `VITE_ADSTERRA_*` placeholders only after reviewing provider requirements and regional consent behavior.

## Guest saves

The game writes the career to IndexedDB and mirrors it to LocalStorage. Use **Export save** before clearing browser storage or moving devices. Import accepts Chart Empire version-1 JSON saves.

## Cloudflare

The project targets Cloudflare Pages with Pages Functions:

- `DB`: D1
- `KV_CONFIG`: public configuration and lightweight job state
- `KV_RATE_LIMIT`: hashed-IP rate counters
- `R2_ASSETS`: future authenticated label-logo uploads
- `SAVE_QUEUE`: contact, save backup, and aggregation jobs
- `TURNSTILE_SECRET_KEY`, `SESSION_SECRET`, `ADMIN_SECRET`: secrets
- `PASSWORD_PEPPER`: independent password-hash pepper

See [DEPLOYMENT.md](./DEPLOYMENT.md) and [CLOUDFLARE_ARCHITECTURE.md](./CLOUDFLARE_ARCHITECTURE.md).

## Registered careers

Configure a Turnstile widget for the production domain, set `VITE_TURNSTILE_SITE_KEY` at build time, and add `TURNSTILE_SECRET_KEY`, `SESSION_SECRET`, and `PASSWORD_PEPPER` as Pages secrets. Registered players can:

- create and sign into an account;
- create up to 10 private cloud careers;
- synchronize the current career;
- publish a server-calculated leaderboard score;
- upload a PNG, JPEG, or WebP label logo to R2;
- export or permanently delete their account data.

## Content expansion

Fictional catalog data lives in `src/game/data/content.ts`. Add names only after checking `CONTENT_GUIDELINES.md`. Simulation rules live outside Phaser in `src/game/systems/SimulationEngine.ts`; renderer changes should not mutate save data directly.

## Project memory

Future sessions should read [PROJECT_MEMORY.md](./PROJECT_MEMORY.md) before making structural changes.

## Troubleshooting

- Blank game canvas: the management UI remains functional; check WebGL/canvas support and the browser console.
- Cloudflare API says “not configured”: bind the relevant resource in `wrangler.jsonc`.
- Contact form fails locally: production requires D1 and Turnstile configuration; non-production Turnstile validation is bypassed when no secret is present.
- SPA route returns 404: ensure `public/_redirects` is included in the Pages build.
