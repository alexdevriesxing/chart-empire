import { challengeScenarios } from "../game/data/content";
import { siteConfig } from "../config/siteConfig";
import { mountTurnstile } from "../services/TurnstileService";
import { adSlot, contentBannerAd, escapeHtml, mediumRectangleAd, nativeAdContainer, shell, songOfWeek } from "./components";

const features = [
  ["✦", "Sign Artists", "Scout a world of generated fictional talent and negotiate your first roster."],
  ["◉", "Record Releases", "Turn creative quality, artist morale, and studio investment into songs."],
  ["↗", "Dominate Streaming", "Build release momentum across fictional playlists and discovery platforms."],
  ["⌁", "Battle for Radio", "Invest in relationships, formats, and campaigns without guaranteed results."],
  ["◎", "Build Fan Clubs", "Convert attention into resilient communities that can move the charts."],
  ["⚡", "Survive the Industry", "Manage cashflow, fatigue, rivals, trends, crises, and volatile careers."]
];

export function homePage(): string {
  return shell(`
    <section class="hero">
      <div class="hero-backdrop" aria-hidden="true"><div class="city"></div><div class="beam beam-a"></div><div class="beam beam-b"></div><div class="equalizer">${Array.from({ length: 28 }, (_, index) => `<i style="--i:${index}"></i>`).join("")}</div></div>
      <div class="hero-copy">
        <span class="eyebrow"><i></i> Free browser management game</span>
        <h1>Build Your Label.<br><span>Break New Artists.</span><br>Rule the Charts.</h1>
        <p>Create your own music company, sign fictional artists, record songs, fight for airplay, dominate streaming, survive scandals, and build a global music empire.</p>
        <div class="hero-actions"><a class="button button-primary button-large" href="/play" data-link>Play as Guest <span>→</span></a><a class="button button-ghost button-large" href="/play?account=1" data-link>Create Free Account</a></div>
        <div class="hero-proof"><span>✓ No download</span><span>✓ Guest saves</span><span>✓ Deep weekly simulation</span></div>
      </div>
      <div class="hero-dashboard" aria-label="Game preview">
        <div class="browser-header">
          <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
          <span class="address-bar">chart-empire.com/play</span>
        </div>
        <div class="hero-image-wrap">
          <img src="/images/chart_empire_hero.png" alt="Chart Empire Game Preview - Music Label Management Simulation">
          <div class="overlay-stats">
            <div class="notification">✦ <span><b>Festival offer received</b><small>Electric Horizon wants your headliner.</small></span></div>
          </div>
        </div>
      </div>
    </section>
    ${adSlot("Premium launch sponsor", "home")}
    <section class="section"><div class="section-heading"><span class="eyebrow">Your label. Your decisions.</span><h2>Every release starts a new story.</h2><p>Build careers in a living fictional industry where creative choices, timing, relationships, and cashflow all matter.</p></div>
      <div class="feature-grid">${features.map(([icon, title, copy]) => `<article class="feature-card"><span class="feature-icon">${icon}</span><h3>${title}</h3><p>${copy}</p></article>`).join("")}</div>
    </section>
    <section class="section split-section"><div><span class="eyebrow">A living industry</span><h2>Your rivals don't wait.</h2><p>Sixteen AI labels scout talent, release records, chase trends, and compete for the same fictional charts. Weekly decisions create new headlines and new problems.</p><ul class="signal-list"><li>Deterministic, replayable simulation</li><li>75+ generated artists across 11 markets</li><li>Campaigns, charts, finance, morale, and fatigue</li></ul><a class="text-link" href="/guide" data-link>Read the complete game guide →</a></div>
      <div class="news-stack"><article><span>INDIE PULSE WEEKLY</span><b>Is synth-soul the next global wave?</b></article><article><span>STARWAVE NETWORK</span><b>Midnight Arcade added to late-night rotation.</b></article><article><span>FANWIRE</span><b>#GlassSatellitesTour trends in six markets.</b></article></div>
    </section>
    ${adSlot("Native partner story", "native")}
    <section class="section partner-section"><div class="section-heading"><span class="eyebrow">From the game to the real world</span><h2>Discover music. Learn promotion.</h2></div>
      <div class="partner-grid"><article class="partner-card xing"><span class="partner-kicker">REAL RELEASES</span><h3>Xing Records</h3><p>Discover independent releases and the configurable Song of the Week.</p><a href="/xing-records" data-link>Enter the showcase →</a></article><article class="partner-card promo"><span class="partner-kicker">REAL CAMPAIGNS</span><h3>Indie Music Promotion</h3><p>Promoting an actual artist? Explore professional radio, press, and release support.</p><a href="/music-promotion" data-link>Learn music promotion →</a></article></div>
    </section>
    ${contentBannerAd()}
    <section class="section song-section"><div><span class="eyebrow">Featured this week</span><h2>Song of the Week</h2><p>A weekly spotlight from Xing Records featuring independent music.</p></div>${songOfWeek()}</section>
    <section class="final-cta"><span class="eyebrow">The office is open</span><h2>Your first artist is waiting.</h2><p>Start as a guest. No account, no download, no real-world music rights required.</p><a class="button button-primary button-large" href="/play" data-link>Build your label →</a></section>
  `, "home-page");
}

const educationalSections = [
  ["What does a record label do?", "A label coordinates investment, recording, distribution, promotion, rights administration, audience development, and long-term catalog strategy. The exact role changes with every deal."],
  ["What does artist management do?", "Management connects creative ambition to practical decisions: team building, schedules, negotiations, brand positioning, opportunities, and career health."],
  ["How music promotion works", "Promotion creates qualified opportunities for discovery. It cannot guarantee taste, virality, playlist placement, reviews, or chart positions."],
  ["Streaming discovery", "Signals can include completion, repeat listening, saves, shares, playlist context, audience fit, and release momentum. Sustainable discovery usually needs several signals working together."],
  ["Radio, press, and reviews", "Radio can create frequency and local familiarity. Press supplies context and credibility. Neither is a vending machine; relevance, timing, relationships, and a strong record matter."],
  ["Tours, festivals, and fan communities", "Live shows deepen loyalty and create revenue, but they also introduce routing costs and fatigue. Fan communities can coordinate attention more reliably than one-off reach."],
  ["Why songs go viral", "Virality combines a compelling moment, distribution, cultural timing, participation, and luck. A spike becomes a career only when the team can convert attention into repeat interest."],
  ["How independent labels compete", "Independent teams win through focus, speed, identity, trusted relationships, patient artist development, and disciplined spending rather than brute-force budgets."]
];

export function contentPage(path: string): string {
  const pages: Record<string, { eyebrow: string; title: string; lead: string; body: string }> = {
    "/guide": { eyebrow: "Game guide", title: "From first signing to global empire.", lead: "A practical guide to the systems that decide whether your label thrives, stalls, or runs out of cash.", body: guideBody() },
    "/how-the-music-industry-works": { eyebrow: "Educational guide", title: "How the music industry works.", lead: "Labels, managers, radio, streaming, press, fan communities, and live shows all shape a career differently.", body: educationalSections.map(([title, copy], index) => `<article class="prose-section"><span>0${index + 1}</span><div><h2>${title}</h2><p>${copy}</p></div></article>`).join("") },
    "/music-promotion": { eyebrow: "Real-world artist support", title: "Promote your music beyond the game.", lead: "Strategy starts with a strong release, clear positioning, realistic goals, and outreach that fits the artist.", body: promotionBody() },
    "/xing-records": { eyebrow: "Real independent music", title: "Discover Xing Records.", lead: "A real-world music home inside a completely fictional game universe.", body: `<section class="inline-feature"><div><h2>Song of the Week</h2><p>Feature a current Xing Records release through environment configuration.</p></div>${songOfWeek()}</section><section class="prose-grid"><article><h3>Featured releases</h3><p>Release cards are ready for curated artwork and links when owned media is supplied.</p></article><article><h3>Artist showcase</h3><p>Use this area for real Xing Records artists without mixing them into the fictional simulation.</p></article></section><a class="button button-primary" href="${siteConfig.xingRecordsUrl}" target="_blank" rel="noopener">Visit Xing Records ↗</a>` },
    "/song-of-the-week": { eyebrow: "Xing Records presents", title: "Song of the Week.", lead: "A weekly spotlight for a real independent release.", body: songOfWeek() },
    "/challenges": { eyebrow: "Challenge scenarios", title: "Ten ways to prove your strategy.", lead: "Each scenario changes the constraints, but not the fundamentals: protect cash, develop artists, and build durable demand.", body: `<div class="challenge-grid">${challengeScenarios.map((challenge, index) => `<article><span>${String(index + 1).padStart(2, "0")}</span><h3>${challenge.name}</h3><p>${challenge.description}</p><b>${challenge.target}</b><a class="text-link" href="/play?challenge=${challenge.id}" data-link>Play challenge →</a></article>`).join("")}</div>` },
    "/leaderboards": { eyebrow: "Global Pulse", title: "Public leaderboards.", lead: "Verified scores are calculated from registered cloud careers, not accepted directly from the browser.", body: `<div id="leaderboard-board" class="leaderboard-board"><div class="empty-state"><span>◎</span><h2>Loading the global season…</h2></div></div>` },
    "/privacy": { eyebrow: "Legal", title: "Privacy policy.", lead: "Chart Empire is designed so guest play works without an account.", body: legalBody("privacy") },
    "/terms": { eyebrow: "Legal", title: "Terms of use.", lead: "Play fairly, upload only content you own, and remember that the simulated industry is fictional.", body: legalBody("terms") },
    "/contact": { eyebrow: "Contact", title: "Talk to the team.", lead: "Questions about the game, Xing Records, or a real music-promotion campaign can be routed here.", body: contactBody() },
    "/admin": { eyebrow: "Restricted", title: "Admin console disabled.", lead: "Enable a real authentication guard and ADMIN_SECRET validation before exposing administrative controls.", body: `<div class="empty-state"><span>◇</span><h2>No public admin access.</h2><p>This route is intentionally a non-functional placeholder.</p></div>` }
  };
  const page = pages[path] || pages["/guide"]!;
  return shell(`<section class="page-hero"><span class="eyebrow">${page.eyebrow}</span><h1>${page.title}</h1><p>${page.lead}</p></section><section class="content-wrap">${page.body}</section>${nativeAdContainer()}`, "content-page");
}

function guideBody(): string {
  const items = [
    ["Sign with intent", "Talent sets the ceiling, appeal affects reach, and weekly cost can destroy a young label. Scout before you commit."],
    ["Record when morale is healthy", "Artist talent, morale, and a controlled random factor determine master quality. Fatigue rises in the studio."],
    ["Release before promoting", "Campaigns only work on released songs. Use social, radio, press, playlists, and fan clubs to create different kinds of momentum."],
    ["Protect runway", "Every signed artist creates weekly expenses. A promising chart result can still be a bad business decision if the campaign overspend."],
    ["Read the chart", "Song quality, artist appeal, buzz, active campaign investment, release decay, and market volatility produce the weekly score."],
    ["Build a catalog", "Older songs continue earning while their momentum decays. Multiple healthy releases are safer than betting the company on one hit."]
  ];
  return `<div class="guide-grid">${items.map(([title, copy], index) => `<article><span>${index + 1}</span><h2>${title}</h2><p>${copy}</p></article>`).join("")}</div>${contentBannerAd()}<section class="callout"><h2>Beginner sequence</h2><p>Create a label → sign one affordable artist → record one song → release it → launch one focused campaign → advance the week → study revenue and chart position before spending again.</p></section>`;
}

function promotionBody(): string {
  return `<div class="prose-grid"><article><h2>Release planning</h2><p>Set a goal, define the audience, prepare assets, create a timeline, and decide what success actually means before outreach begins.</p></article><article><h2>Radio promotion</h2><p>Target relevant formats and territories. Credible reporting matters more than inflated promises.</p></article><article><h2>Press outreach</h2><p>A useful story, clear positioning, strong music, and correct targeting give writers a reason to engage.</p></article><article><h2>Campaign reporting</h2><p>Review placements, reach, responses, and next actions. Promotion should produce learning even when a target says no.</p></article></div>${mediumRectangleAd()}<section class="callout accent"><span class="eyebrow">Promoting a real artist?</span><h2>Explore Indie Music Promotion.</h2><p>Professional radio, press, positioning, release strategy, and campaign support outside the game.</p><a class="button button-primary" href="${siteConfig.indieMusicPromotionUrl}" target="_blank" rel="noopener">Visit Indie Music Promotion ↗</a></section>`;
}

function legalBody(type: "privacy" | "terms"): string {
  if (type === "privacy") return `<div class="legal-copy"><h2>Our Privacy Commitment</h2><p>We keep Chart Empire completely free to play thanks to advertisements displayed throughout the site. We do not collect any personal information, and we will never sell or share any data.</p><h2>Local Game Saves</h2><p>Guest career saves are stored entirely on your local device using IndexedDB/LocalStorage. No personal identifier is linked to this local storage.</p><h2>Advertising</h2><p>Third-party advertising partners may use cookies to serve relevant ads. These ads keep the game free for all players.</p></div>`;
  return `<div class="legal-copy"><h2>Fictional simulation</h2><p>Game entities and outcomes are fictional and do not represent real artists, companies, charts, or guarantees about the music industry.</p><h2>User content</h2><p>Upload only logos and artwork you own or have permission to use. Do not upload illegal, hateful, deceptive, or rights-infringing material.</p><h2>Availability</h2><p>The service may change as game balance, infrastructure, and integrations evolve. Guest players are responsible for exporting important local saves.</p><h2>Fair use</h2><p>Do not attack the service, bypass rate limits, manipulate leaderboards, automate abusive traffic, or impersonate another person.</p></div>`;
}

function contactBody(): string {
  return `<form id="contact-form" class="contact-form"><label>Name<input name="name" maxlength="80" required autocomplete="name"></label><label>Email<input name="email" type="email" maxlength="160" required autocomplete="email"></label><label>Topic<select name="topic"><option>Game feedback</option><option>Music promotion</option><option>Xing Records</option><option>Partnership</option></select></label><label>Message<textarea name="message" minlength="10" maxlength="2000" required rows="7"></textarea></label><input type="hidden" name="sourcePage" value="/contact"><input type="hidden" name="turnstileToken"><div id="contact-turnstile" class="turnstile-slot"></div><button class="button button-primary" type="submit">Send message</button><p class="form-status" role="status"></p></form>`;
}

export function bindContentPage(path: string): void {
  if (path === "/contact") {
    document.querySelector<HTMLFormElement>("#contact-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget as HTMLFormElement;
      const status = form.querySelector<HTMLElement>(".form-status")!;
      status.textContent = "Sending…";
      try {
        const response = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
        if (!response.ok) throw new Error("Unable to send");
        form.reset();
        status.textContent = "Message received.";
      } catch {
        status.textContent = "The contact API is unavailable locally. Please try again after Cloudflare deployment.";
      }
    });
    const container = document.querySelector<HTMLElement>("#contact-turnstile");
    const token = document.querySelector<HTMLInputElement>('#contact-form input[name="turnstileToken"]');
    if (container && token) void mountTurnstile(container, "contact", token);
  }
  if (path === "/leaderboards") void loadLeaderboards();
}

async function loadLeaderboards(): Promise<void> {
  const root = document.querySelector<HTMLElement>("#leaderboard-board");
  if (!root) return;
  try {
    const response = await fetch("/api/leaderboards", { cache: "no-store" });
    if (!response.ok) throw new Error("Leaderboard unavailable");
    const data = await response.json() as { entries: Array<{ labelName: string; playerName?: string; score: number; week: number; scenario: string; createdAt: string }> };
    if (!data.entries.length) {
      root.innerHTML = `<div class="empty-state"><span>◎</span><h2>The first season is open.</h2><p>Sign in, sync a career, and publish its verified score from the game sidebar.</p><a class="button button-primary" href="/play?account=1" data-link>Create a cloud career</a></div>`;
      return;
    }
    root.innerHTML = `<div class="public-chart"><div class="public-chart-head"><span>Rank</span><span>Label</span><span>Scenario</span><span>Week</span><span>Score</span></div>${data.entries.map((entry, index) => `<article><b>#${index + 1}</b><div><strong>${escapeHtml(entry.labelName)}</strong><small>${escapeHtml(entry.playerName || "Independent manager")}</small></div><span>${escapeHtml(entry.scenario)}</span><span>W${entry.week}</span><em>${new Intl.NumberFormat("en").format(entry.score)}</em></article>`).join("")}</div>`;
  } catch {
    root.innerHTML = `<div class="empty-state"><span>!</span><h2>Leaderboard temporarily unavailable.</h2><p>The game remains playable and cloud careers remain private.</p></div>`;
  }
}

export function notFoundPage(path: string): string {
  return shell(`<section class="page-hero"><span class="eyebrow">404</span><h1>That venue is not on the tour.</h1><p>No route exists at <code>${escapeHtml(path)}</code>.</p><a class="button button-primary" href="/" data-link>Return home</a></section>`, "content-page");
}
