# Chart Empire — Project Memory

This file is the durable context for future Codex sessions. Read it before changing architecture, game rules, public copy, integrations, or deployment configuration.

## Original request

Build and publish a premium, production-ready browser game and marketing site titled **“Chart Empire: The Music Label Manager.”** The player runs a fictional music label / artist-management company: create a label, sign artists, record and release music, promote it, grow fan communities, compete with AI labels, manage finances and crises, and pursue global chart success.

The result must be a real playable project, not only a design document. When a requested feature is too large for the first implementation, ship a working simplified version with a clean extension point and honest documentation.

## Non-negotiable IP rules

- All simulated artists, bands, labels, publications, radio networks, streaming services, playlists, festivals, venues, awards, producers, agencies, managers, sponsors, influencers, podcasts, and charts must be fictional.
- Do not copy or publicly reference protected names, UI, layouts, mechanics, characters, art, music, jokes, or branding from existing games.
- The only real-world promotional properties allowed inside the project are:
  - Xing Records — <https://www.xingrecords.com>
  - Indie Music Promotion — <https://www.indiemusicpromotion.com>
- Do not bundle copyrighted music or celebrity likenesses.

## Required product shape

- Premium dark neon identity: nightlife, studio atmosphere, festival energy, industry glamour, indie grit, streaming analytics, fan culture, and backstage drama.
- Design tokens center on `#080B1A`, glass panels, magenta, cyan, purple, gold, emerald, strong contrast, rounded cards, and restrained glow.
- Responsive and accessible on desktop and mobile.
- Weekly-turn deterministic management simulation.
- Guest play requires no registration and saves to IndexedDB with LocalStorage fallback.
- Guest saves can be exported and imported as JSON.
- Account/cloud-save architecture is Cloudflare-ready.
- Marketing pages remain useful and indexable without starting Phaser.
- Phaser is lazy-loaded only on `/play`.
- Dense management UI belongs in accessible DOM; Phaser owns animated presentation and effects.

## Core gameplay

The start flow lets the player choose a mode, label name, visual mark/logo, starting market, and strategy. Strategies include indie credibility, idol development, viral creators, radio pop, underground electronic, hip-hop/street culture, rock revival, global fusion, boutique development, commercial hit factory, gospel/soul, and comedy/novelty.

The playable loop must support:

1. Scout generated fictional artists.
2. Sign an artist and pay an advance/weekly costs.
3. Record a song with quality affected by artist state.
4. Release the song.
5. Fund social, radio, press, playlist, or fan-club promotion.
6. Resolve the week.
7. Calculate streams, radio spins, revenue, expenses, fans, morale, fatigue, buzz, charts, AI competition, news, and achievements.
8. Save locally after meaningful actions.

The world target includes at least 75 generated artists, 16 AI labels, 12 publications, 12 radio networks, 10 fictional streaming/playlist platforms, 11 markets, 25 trends, 150 event variations, and 10 challenge scenarios. Procedural deterministic generation is preferred over oversized static payloads.

## Website routes

- `/` — premium landing page and conversion funnel
- `/play` — game shell and Phaser canvas
- `/guide`
- `/how-the-music-industry-works`
- `/music-promotion`
- `/xing-records`
- `/song-of-the-week`
- `/leaderboards`
- `/challenges`
- `/privacy`
- `/cookies`
- `/terms`
- `/contact`
- `/admin` — disabled/future-ready placeholder

Homepage headline: **“Build Your Label. Break New Artists. Rule the Charts.”**

Primary calls to action:

- Play as Guest
- Create Free Account
- Watch Song of the Week
- Learn Music Promotion

## Integrations and monetization

- Song of the Week is configurable with `VITE_SONG_OF_WEEK_*` values and uses a consent-gated, lazy YouTube embed.
- Xing Records and Indie Music Promotion links should be tasteful partner modules, not intrusive ads.
- Adsterra integration is configuration-driven and disabled by default.
- Ad and external-media scripts must not load before applicable consent.
- Core gameplay must continue if personalized tracking is rejected.
- Never place ads over controls or during critical decisions/tutorial steps.
- Interstitial target cap: no more than once per three minutes and five times per hour.
- Consent categories: necessary, analytics, ads, personalized ads, external media, functional saves.

## Cloudflare architecture

The repository must remain deployable through GitHub to Cloudflare:

- Pages: static site, game build, SEO pages, previews.
- Pages Functions / Workers: `/api/*`.
- D1: users, sessions, saves, leaderboards, achievements, challenges, leads, consent records, Song of the Week, site config.
- KV: config/cache, rate limits, feature flags, ad configuration, maintenance state.
- R2: uploaded label logos and future media.
- Queues: save backups, leaderboard recalculation, moderation, notifications, aggregation.
- Durable Objects: future live chart/season rooms only; do not overbuild for MVP.
- Workers AI: optional fictional text generation with deterministic fallback templates.
- Turnstile: registration and contact abuse prevention.

Never expose secrets through `VITE_` variables. Validate body sizes, sanitize names, use CSP/security headers, hash sensitive tokens, and avoid storing raw IP addresses unless necessary.

## Required repository assets

- Vite + TypeScript + Phaser 4
- Cloudflare Wrangler configuration
- D1 migrations
- `.env.example`
- README and deployment documentation
- Architecture/game-design/content-guideline documentation
- PWA manifest, icon, offline fallback, and safe service worker
- Sitemap, robots, canonical metadata, Open Graph, semantic HTML, JSON-LD, and useful educational copy
- Tests for deterministic RNG, generated names/content, chart/simulation behavior, save round trips, finance, and consent gates
- GitHub Actions check for install, lint, typecheck, test, and build

## Quality gates

Before claiming completion:

- `npm install` succeeds.
- `npm run lint` succeeds.
- `npm run typecheck` succeeds.
- `npm run test` succeeds.
- `npm run build` succeeds.
- All public routes render without broken navigation.
- Guest start, scouting, signing, recording, release, promotion, weekly simulation, charts, finance, save, export, and import work.
- The `/play` bundle is lazy-loaded.
- Consent controls and ad placeholders do not break layout.
- Song of the Week has a consent-safe fallback.
- Mobile layout and keyboard navigation are usable.
- Cloudflare APIs fail gracefully when bindings are absent locally.
- In-game names remain fictional except for the two explicitly allowed properties.

## Build priority

1. Stable architecture
2. Cloudflare-ready deployment
3. Playable core loop
4. Premium responsive UI
5. Save system
6. AI label simulation
7. Charts and events
8. SEO and educational pages
9. Consent-safe ads and embeds
10. Xing Records and Indie Music Promotion integration
11. Account/cloud saves
12. R2 uploads and leaderboards
13. Future live systems

## Repository ownership

Publish this project to GitHub under the `alexdevriesxing` account, with `main` as the production branch.

## Implementation status

The repository now includes the playable core loop plus registered accounts, D1 cloud careers, R2 logo uploads, verified leaderboards, staff, touring, contracts, trends, 150 event templates, fictional social posts, challenge starts/progress, valuation, awards, and extended achievements. Production account activation still requires a real Turnstile widget for `chart-empire.pages.dev`; never substitute Cloudflare’s public test keys in production.
