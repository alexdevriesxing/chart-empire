# Deployment

## 1. GitHub and Cloudflare Pages

1. Push the repository to GitHub with `main` as the production branch.
2. In Cloudflare, create a Pages project and connect the GitHub repository.
3. Set the build command to `npm run build`.
4. Set the output directory to `dist`.
5. Enable preview deployments for `develop` and feature branches.
6. Add the public environment variables from `.env.example`.

## 2. Provision Cloudflare resources

Use unique names if the defaults already exist:

```bash
npx wrangler login
npx wrangler d1 create chart-empire-db
npx wrangler kv namespace create KV_CONFIG
npx wrangler kv namespace create KV_RATE_LIMIT
npx wrangler r2 bucket create chart-empire-assets
npx wrangler queues create chart-empire-save-jobs
```

Copy the returned IDs into `wrangler.jsonc`. In the Pages project settings, create equivalent production and preview bindings for `DB`, `KV_CONFIG`, `KV_RATE_LIMIT`, `R2_ASSETS`, and `SAVE_QUEUE`.

Apply migrations:

```bash
npm run db:migrate:local
npm run db:migrate:prod
```

## 3. Secrets and Turnstile

Create a Turnstile widget for the production domain. Configure the public site key as `VITE_TURNSTILE_SITE_KEY` and add these encrypted Pages secrets:

- `TURNSTILE_SECRET_KEY`
- `SESSION_SECRET`
- `ADMIN_SECRET`

Do not enable account UI, cloud saves, or uploads until authentication is implemented and reviewed.

## 4. Domain and content

1. Add the production custom domain.
2. Replace `chart-empire.example.com` in `public/sitemap.xml`, `public/robots.txt`, and the default Wrangler origin.
3. Configure Xing Records, Indie Music Promotion, and Song of the Week environment values.
4. Keep Adsterra disabled until placement IDs, policy review, consent behavior, and frequency controls are approved.

## 5. Verification

Test:

1. `/api/health`
2. Homepage and every route in the sitemap
3. Guest start, save, reload, export, and import
4. Scouting, signing, recording, release, campaign, weekly resolution, charts, and finance
5. Contact with a valid Turnstile token
6. Consent rejection and acceptance
7. Song of the Week fallback and enabled embed
8. Mobile navigation and game menu
9. Lighthouse performance/accessibility/SEO
10. Preview and production deployments

`npm run cf:deploy` can publish `dist` manually, but Git integration is the recommended production path.
