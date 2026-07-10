import { escapeHtml, header, mobileHeaderAd, sidebarSkyscraperAd, triggerAdsterraLoads } from "./components";
import { challengeScenarios, markets, strategies } from "../game/data/content";
import { SimulationEngine } from "../game/systems/SimulationEngine";
import { SaveSystem } from "../game/systems/SaveSystem";
import { authService, type AccountUser } from "../services/AuthService";
import { assetUploadService } from "../services/AssetUploadService";
import { audioService } from "../services/AudioService";
import { analyticsService } from "../services/AnalyticsService";
import { cloudSaveService, type CloudSaveSummary } from "../services/CloudSaveService";
import { mountTurnstile } from "../services/TurnstileService";
import { siteConfig } from "../config/siteConfig";
import type { Campaign, Difficulty, GameState, GameView, NewsItem, StrategyId, WeekReport } from "../types/game";

const saves = new SaveSystem();
let engine: SimulationEngine | null = null;
let currentView: GameView = "dashboard";
let accountUser: AccountUser | null = null;
let cloudSaveId: string | null = null;
let cloudSummaries: CloudSaveSummary[] = [];
let cloudSyncState: "local" | "syncing" | "synced" | "error" = "local";
let cloudSyncTimer: number | null = null;
let cloudSyncPromise: Promise<void> | null = null;
let accountsEnabled = false;
let keydownHandler: ((event: KeyboardEvent) => void) | null = null;

export function playPage(): string {
  return `${header()}${mobileHeaderAd()}<main id="main-content" class="play-page"><div id="phaser-stage" aria-hidden="true"></div><section id="game-ui" class="game-ui" aria-live="polite"><div class="game-loader"><span></span><p>Opening the label office…</p></div></section></main>`;
}

export async function setupPlayPage(): Promise<void> {
  const stage = document.querySelector<HTMLElement>("#phaser-stage");
  if (!stage) return;
  const { bootGame } = await import("../game/bootstrap");
  bootGame(stage);
  try {
    const auth = await authService.me();
    accountUser = auth.user;
    accountsEnabled = auth.enabled && Boolean(siteConfig.turnstileSiteKey);
    if (accountUser) cloudSummaries = await cloudSaveService.list();
  } catch {
    accountUser = null;
  }
  const saved = await saves.load();
  const params = new URLSearchParams(window.location.search);
  const wantsAccount = params.has("account");
  const requestedChallenge = params.get("challenge");
  if (wantsAccount && !accountUser) {
    if (accountsEnabled) renderAuthScreen("register");
    else renderAccountsUnavailable();
  } else if (accountUser) {
    renderAccountHub(saved);
  } else if (saved) {
    renderWelcomeBack(saved);
  } else {
    renderStart(false, requestedChallenge);
  }
  bindGameEvents();
}

function renderWelcomeBack(saved: GameState): void {
  gameRoot().innerHTML = `<div class="start-screen"><div class="start-card compact"><span class="eyebrow">Local career found</span>${logoMarkup(saved.logo, saved.labelName)}<h1>Welcome back to ${escapeHtml(saved.labelName)}.</h1><p>Week ${saved.week} · ${saved.artists.filter((artist) => artist.signed).length} signed artists · ${formatMoney(saved.cash)} cash</p><div class="start-actions"><button class="button button-primary button-large" data-game-action="resume">Continue career</button><button class="button button-ghost" data-game-action="account">Sign in for cloud saves</button><button class="button button-ghost" data-game-action="new">Start new label</button><button class="button button-ghost" data-game-action="export-saved">Export save</button></div></div></div>`;
}

function renderStart(registered = Boolean(accountUser), selectedChallenge: string | null = null): void {
  gameRoot().innerHTML = `
    <form id="new-game-form" class="start-screen">
      <div class="start-card">
        <span class="eyebrow">${registered ? "Registered career" : "Guest quick start"}</span><h1>Name your next empire.</h1>
        <p>${registered ? `Signed in as ${escapeHtml(accountUser?.displayName || "")}. This career will sync to Cloudflare.` : "Your guest career is stored on this device. You can export it at any time."}</p>
        <label class="field-label">Label name<input name="labelName" maxlength="40" required value="Electric North Records" autocomplete="organization"></label>
        <fieldset><legend>Choose a mark</legend><div class="logo-options">${["logo-cyan", "logo-magenta", "logo-gold", "logo-emerald"].map((logo, index) => `<label class="logo-choice"><input type="radio" name="logo" value="${logo}" ${index === 0 ? "checked" : ""}><span class="logo-preview ${logo}">EN</span></label>`).join("")}</div></fieldset>
        <fieldset><legend>Starting market</legend><div class="choice-pills">${markets.map((market, index) => `<label><input type="radio" name="market" value="${market}" ${index === 0 ? "checked" : ""}><span>${market}</span></label>`).join("")}</div></fieldset>
        <fieldset><legend>Difficulty</legend><div class="choice-pills"><label><input type="radio" name="difficulty" value="rising"><span>Rising · forgiving</span></label><label><input type="radio" name="difficulty" value="competitive" checked><span>Competitive</span></label><label><input type="radio" name="difficulty" value="mogul"><span>Mogul · volatile</span></label></div></fieldset>
        <fieldset><legend>Label strategy</legend><div class="strategy-grid">${Object.entries(strategies).map(([id, strategy], index) => `<label class="strategy-choice"><input type="radio" name="strategy" value="${id}" ${index === 0 ? "checked" : ""}><span><b>${strategy.name}</b><small>${strategy.description}</small><em>${formatMoney(strategy.cash)} start</em></span></label>`).join("")}</div></fieldset>
        <fieldset><legend>Career mode</legend><div class="strategy-grid"><label class="strategy-choice"><input type="radio" name="challengeId" value="" ${selectedChallenge ? "" : "checked"}><span><b>Open Career</b><small>Build freely and pursue your own milestones.</small><em>Standard progression</em></span></label><label class="strategy-choice"><input type="radio" name="challengeId" value="sandbox"><span><b>Sandbox</b><small>Set the budget, rival pressure, and trend volatility.</small><em>Custom rules</em></span></label>${challengeScenarios.map((challenge) => `<label class="strategy-choice"><input type="radio" name="challengeId" value="${challenge.id}" ${selectedChallenge === challenge.id ? "checked" : ""}><span><b>${challenge.name}</b><small>${challenge.description}</small><em>${challenge.target}</em></span></label>`).join("")}</div></fieldset>
        <fieldset class="sandbox-settings"><legend>Sandbox settings</legend><div><label>Starting budget<select name="startingBudget"><option value="100000">€100K</option><option value="250000" selected>€250K</option><option value="500000">€500K</option><option value="1000000">€1M</option><option value="2000000">€2M</option></select></label><label>AI aggression<select name="aiAggression"><option value="20">Relaxed</option><option value="50" selected>Competitive</option><option value="85">Relentless</option></select></label><label>Trend volatility<select name="trendVolatility"><option value="20">Stable</option><option value="50" selected>Dynamic</option><option value="90">Chaotic</option></select></label></div><p>These values apply only when Sandbox is selected.</p></fieldset>
        <button class="button button-primary button-large" type="submit">Open the office →</button>
        ${registered ? '<button class="button button-ghost" type="button" data-game-action="account-hub">Back to cloud careers</button>' : '<button class="button button-ghost" type="button" data-game-action="account">Use a free cloud account</button>'}
      </div>
    </form>`;
}

function renderAuthScreen(mode: "register" | "login"): void {
  if (!accountsEnabled) {
    renderAccountsUnavailable();
    return;
  }
  const registering = mode === "register";
  gameRoot().innerHTML = `<div class="start-screen"><form id="auth-form" class="start-card auth-card" data-auth-mode="${mode}">
    <span class="eyebrow">Registered career</span><h1>${registering ? "Create your cloud account." : "Welcome back."}</h1>
    <p>${registering ? "Sync careers across devices and publish verified leaderboard scores." : "Sign in to access your cloud careers."}</p>
    ${registering ? '<label class="field-label">Display name<input name="displayName" minlength="2" maxlength="40" required autocomplete="nickname"></label>' : ""}
    <label class="field-label">Email<input name="email" type="email" maxlength="160" required autocomplete="email"></label>
    <label class="field-label">Password<input name="password" type="password" minlength="12" maxlength="128" required autocomplete="${registering ? "new-password" : "current-password"}"></label>
    ${registering ? '<p class="password-hint">Use at least 12 characters with uppercase, lowercase, and a number.</p>' : ""}
    <input type="hidden" name="turnstileToken"><div id="auth-turnstile" class="turnstile-slot"></div>
    <p class="form-status" role="status"></p>
    <button class="button button-primary button-large" type="submit">${registering ? "Create account" : "Sign in"}</button>
    <button class="button button-ghost" type="button" data-game-action="${registering ? "show-login" : "show-register"}">${registering ? "Already registered? Sign in" : "Need an account? Register"}</button>
    <button class="button button-ghost" type="button" data-game-action="guest-start">Continue as guest</button>
  </form></div>`;
  const container = document.querySelector<HTMLElement>("#auth-turnstile");
  const token = document.querySelector<HTMLInputElement>('#auth-form input[name="turnstileToken"]');
  if (container && token) void mountTurnstile(container, mode, token).catch(() => { container.innerHTML = '<p class="form-warning">Account protection could not load.</p>'; });
}

function renderAccountsUnavailable(): void {
  gameRoot().innerHTML = `<div class="start-screen"><div class="start-card compact"><span class="eyebrow">Cloud careers</span><h1>Account activation is pending.</h1><p>Guest play is fully available. The production Turnstile widget must be connected before registration can open safely.</p><div class="start-actions"><button class="button button-primary" data-game-action="guest-start">Play as guest</button><a class="button button-ghost" href="/privacy" data-link>Privacy details</a></div></div></div>`;
}

function renderAccountHub(localSave: GameState | null): void {
  gameRoot().innerHTML = `<div class="start-screen account-screen"><div class="start-card">
    <div class="account-heading"><div><span class="eyebrow">Cloud careers</span><h1>${escapeHtml(accountUser?.displayName || "Manager")}'s label office.</h1><p>Cloud saves are private. Leaderboard scores are calculated on the server from a selected save.</p></div><div class="account-actions"><button class="button button-ghost" data-game-action="export-account">Export account</button><button class="button button-ghost" data-game-action="logout">Sign out</button></div></div>
    <div class="cloud-career-grid">
      <button class="cloud-new" data-game-action="new-registered"><span>＋</span><b>Start a registered career</b><small>Create a new label with automatic cloud sync.</small></button>
      ${localSave && !cloudSummaries.some((save) => save.labelName === localSave.labelName) ? `<article class="cloud-card local"><span>LOCAL DEVICE</span>${logoMarkup(localSave.logo, localSave.labelName)}<h2>${escapeHtml(localSave.labelName)}</h2><p>Week ${localSave.week} · ${formatNumber(localSave.fanbase)} fans</p><button class="button button-primary" data-game-action="upload-local">Move to cloud</button></article>` : ""}
      ${cloudSummaries.map((save) => `<article class="cloud-card"><span>CLOUD · UPDATED ${formatDate(save.updatedAt)}</span>${logoMarkup(save.logo, save.labelName)}<h2>${escapeHtml(save.labelName)}</h2><p>Week ${save.week} · ${formatNumber(save.fanbase)} fans · ${formatMoney(save.cash)}</p><div><button class="button button-primary" data-game-action="load-cloud" data-id="${save.id}">Continue</button><button class="button button-ghost" data-game-action="delete-cloud" data-id="${save.id}">Delete</button></div></article>`).join("")}
    </div>
    <details class="danger-zone"><summary>Account controls</summary><p>Deleting your account permanently removes cloud careers, leaderboard entries, achievements, and uploaded logos.</p><button class="button button-ghost" data-game-action="show-delete-account">Delete account…</button></details>
  </div></div>`;
}

function renderGame(): void {
  if (!engine) return;
  const state = engine.state;
  if (state.insolvent) {
    gameRoot().innerHTML = `
      <div class="start-screen">
        <div class="start-card compact danger-zone-card">
          <span class="eyebrow danger" style="color:var(--color-danger)">Bankruptcy</span>
          <h1>Insolvency Declared.</h1>
          <p>Your label, <strong>${escapeHtml(state.labelName)}</strong>, spent 5 consecutive weeks in debt. The creditors have stepped in, frozen your assets, and closed the office doors.</p>
          <div class="metric-grid" style="grid-template-columns: 1fr 1fr; margin: 1.5rem 0;">
            <article style="min-height:90px;"><small>FINAL WEEK</small><b>${state.week}</b></article>
            <article style="min-height:90px;"><small>PEAK FANS</small><b>${formatNumber(state.fanbase)}</b></article>
          </div>
          <div class="start-actions">
            <button class="button button-primary button-large" data-game-action="restart-career">Restart career</button>
            <button class="button button-ghost" data-game-action="account-hub">Return to cloud hub</button>
          </div>
        </div>
      </div>`;
    return;
  }
  const signed = state.artists.filter((artist) => artist.signed);
  gameRoot().innerHTML = `
    <div class="game-shell">
      <aside class="game-sidebar">
        <div class="game-label">${logoMarkup(state.logo, state.labelName)}<div><strong>${escapeHtml(state.labelName)}</strong><small>${strategies[state.strategy].name}</small></div></div>
        <nav aria-label="Game sections">${navButton("dashboard", "⌂", "Dashboard")}${navButton("scout", "⌕", "Scout")}${navButton("roster", "★", "Artists")}${navButton("studio", "◉", "Studio")}${navButton("marketing", "↗", "Campaigns")}${navButton("touring", "◆", "Touring")}${navButton("staff", "♟", "Staff")}${navButton("charts", "▥", "Charts")}${navButton("finance", "€", "Finance")}</nav>
        <div class="sidebar-bottom">${accountUser ? `<button data-game-action="sync-cloud">↻ Sync cloud</button><button data-game-action="publish-score">↗ Publish score</button><label class="import-label">▣ Upload logo<input type="file" accept="image/png,image/jpeg,image/webp" data-logo-upload></label><button data-game-action="account-hub">☁ Cloud careers</button><span>${escapeHtml(accountUser.displayName)} · ${cloudSyncState}</span>` : `<button data-game-action="account">☁ Enable cloud saves</button><button data-game-action="export">⇩ Export save</button><label class="import-label">⇧ Import save<input type="file" accept=".json,application/json" data-game-import></label><span>Guest save · this device</span>`}</div>
      </aside>
      <section class="game-main" style="display: flex; flex-direction: column;">
        <header class="game-topbar"><button class="mobile-game-menu" data-game-action="toggle-menu" aria-label="Toggle game menu">☰</button><div class="week-chip"><span>WEEK</span><b>${state.week}</b></div><div class="resource"><small>Cash</small><b class="${state.cash < 0 ? "danger" : ""}">${formatMoney(state.cash)}</b></div><div class="resource"><small>Fans</small><b>${formatNumber(state.fanbase)}</b></div><div class="resource"><small>Reputation</small><b>${state.reputation}</b></div><label class="quality-control"><span>Quality</span><select data-quality><option value="high" ${quality() === "high" ? "selected" : ""}>High</option><option value="balanced" ${quality() === "balanced" ? "selected" : ""}>Balanced</option><option value="battery" ${quality() === "battery" ? "selected" : ""}>Battery</option></select></label><button class="audio-toggle" data-game-action="mute" aria-label="${audioService.muted ? "Unmute game audio" : "Mute game audio"}">${audioService.muted ? "♪̸" : "♪"}</button>${state.pendingEvent ? `<button class="button advance-button needs-decision" data-game-action="goto-event">⚠ Decide event</button>` : `<button class="button button-primary advance-button" data-game-action="end-week">Advance week →</button>`}</header>
        <div class="mobile-resource-strip"><span class="${state.cash < 0 ? "danger" : ""}">€${formatNumber(state.cash)}</span><span>${formatNumber(state.fanbase)} fans</span><span>Rep ${state.reputation}</span></div>
        <div class="game-layout-container" style="display: flex; flex: 1; min-height: 0;">
          <div class="game-content" style="flex: 1; min-width: 0; overflow-y: auto; padding: 20px;">${renderView(currentView, signed)}</div>
          <aside class="desktop-only-ad-sidebar ad-sidebar-game">
            ${sidebarSkyscraperAd()}
          </aside>
        </div>
      </section>
    </div>
    <div id="game-toast" class="game-toast" role="status"></div>`;
  triggerAdsterraLoads();
}

function renderView(view: GameView, signed: GameState["artists"]): string {
  if (!engine) return "";
  const state = engine.state;
  if (view === "dashboard") {
    const best = state.chart.find((entry) => entry.playerOwned);
    return `<div class="view-heading"><div><span class="eyebrow">Command center</span><h1>${greeting()}, boss.</h1><p>${state.news[0]?.text || "Your first week begins now."}</p></div><span class="market-chip">${state.market} HQ</span></div>
      ${challengeCard(state)}
      ${state.cash < 0 ? `
      <section class="event-decision crisis">
        <div>
          <span>FINANCIAL ALERT · GRACE WEEK ${state.debtWeeks}/5</span>
          <h2>Insolvency Imminent!</h2>
          <p>Your company cash is currently <strong>${formatMoney(state.cash)}</strong>. If you remain in debt for ${5 - state.debtWeeks} more consecutive weeks, the bank will force liquidation and declare bankruptcy.</p>
        </div>
        <div>
          <button class="button button-primary" data-game-action="take-loan" style="width: 100%;">
            <b>Emergency Financing</b>
            <small style="color:rgba(255,255,255,0.7); display:block; margin-top:2px;">Secure €75K principal · Repay €2.5K/week for 40 weeks</small>
          </button>
        </div>
      </section>
      ` : ""}
      ${state.pendingEvent ? `<section class="event-decision ${state.pendingEvent.category}"><div><span>${state.pendingEvent.category}</span><h2>${escapeHtml(state.pendingEvent.title)}</h2><p>${escapeHtml(state.pendingEvent.description)}</p></div><div>${state.pendingEvent.choices.map((choice) => `<button data-game-action="event-choice" data-id="${choice.id}"><b>${escapeHtml(choice.label)}</b><small>${choice.cash ? formatMoney(choice.cash) : "No cash cost"} · Rep ${signedNumber(choice.reputation)} · Morale ${signedNumber(choice.morale)}</small></button>`).join("")}</div></section>` : ""}
      <div class="metric-grid"><article><small>AVAILABLE CASH</small><b>${formatMoney(state.cash)}</b><span>${signed.length ? `${formatMoney(signed.reduce((sum, artist) => sum + artist.weeklyCost, 0))}/week roster cost` : "No roster costs yet"}</span></article><article><small>GLOBAL FANBASE</small><b>${formatNumber(state.fanbase)}</b><span>Build through releases</span></article><article><small>BEST CHART</small><b>${best ? `#${best.position}` : "—"}</b><span>${best ? escapeHtml(best.title) : "No release charted yet"}</span></article><article><small>LABEL HEAT</small><b>${state.reputation}%</b><span>${state.credibility}% credibility</span></article></div>
      <div class="dashboard-grid"><section class="game-panel"><div class="panel-title"><div><span>LIVE FEED</span><h2>Industry signal</h2></div></div><div class="game-news">${state.news.slice(0, 6).map((item) => `<article class="${item.tone}"><span>W${item.week}</span><p>${escapeHtml(item.text)}</p></article>`).join("")}</div></section>
      <section class="game-panel next-move"><div class="panel-title"><div><span>NEXT MOVE</span><h2>${nextMoveTitle(state)}</h2></div></div>${nextMoveContent(state)}</section></div>
      <div class="dashboard-grid"><section class="game-panel"><div class="panel-title"><div><span>SOCIAL SIGNAL</span><h2>Fictional fan feed</h2></div></div><div class="social-feed">${state.socialFeed.length ? state.socialFeed.slice(0, 5).map((post) => `<article class="${post.sentiment}"><div><b>${escapeHtml(post.author)}</b><span>${escapeHtml(post.platform)} · W${post.week}</span></div><p>${escapeHtml(post.text)}</p></article>`).join("") : "<p class='muted'>Release music to start the conversation.</p>"}</div></section>
      <section class="game-panel"><div class="panel-title"><div><span>MARKET WEATHER</span><h2>Active trends</h2></div></div><div class="trend-list">${state.trends.length ? state.trends.map((trend) => `<article><span>${escapeHtml(trend.genre)}</span><b>${escapeHtml(trend.name)}</b><small>+${trend.strength} signal · ${trend.weeksRemaining} weeks</small></article>`).join("") : "<p class='muted'>The market is between major waves.</p>"}</div></section></div>
      <section class="game-panel"><div class="panel-title"><div><span>ROSTER PULSE</span><h2>Signed artists</h2></div><button data-view="roster">View roster →</button></div>${signed.length ? `<div class="artist-row">${signed.slice(0, 4).map(artistCard).join("")}</div>` : `<div class="mini-empty"><p>No artists signed. Your scouts have 75 fictional prospects ready.</p><button class="button button-secondary" data-view="scout">Open scouting</button></div>`}</section>
      <section class="game-panel achievement-panel"><div class="panel-title"><div><span>LEGACY</span><h2>Achievements</h2></div><span>${state.achievements.length}/20 · ${state.awardsWon} awards</span></div>${state.achievements.length ? `<div class="achievement-list">${state.achievements.map((achievement) => `<span>✦ ${escapeHtml(achievement)}</span>`).join("")}</div>` : "<p class='muted'>Your first milestone is still ahead.</p>"}</section>`;
  }
  if (view === "scout") {
    const upgrades = state.upgrades || [];
    const hasReg = upgrades.includes("regional-scouting");
    const hasInt = upgrades.includes("international-partnership");
    return `<div class="view-heading"><div><span class="eyebrow">A&R network</span><h1>Scout the next signal.</h1><p>Balance talent and appeal against weekly cost. Signing advances equal four weeks of cost.</p></div></div>
    
    ${state.activeBuyout ? `
    <section class="event-decision crisis" style="margin-bottom: 1rem; border-color: var(--color-purple); padding: 1.2rem; border-radius: 12px; background: rgba(124, 58, 237, 0.05); border: 1px solid rgba(124, 58, 237, 0.2);">
      <div>
        <span class="eyebrow" style="color:var(--color-purple); font-weight: bold; font-size: 0.75rem; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">RIVAL LABEL TRANSFER REQUEST</span>
        <h2 style="font-size: 1.25rem; margin-top: 2px;">${state.activeBuyout.type === "buy" ? `Sell ${escapeHtml(state.artists.find(a => a.id === state.activeBuyout!.artistId)?.name || "")}` : `Acquire ${escapeHtml(state.artists.find(a => a.id === state.activeBuyout!.artistId)?.name || "")}`}</h2>
        <p style="font-size: 0.85rem; color: var(--color-muted); margin-top: 6px; line-height: 1.4;">${state.activeBuyout.type === "buy" ? `Rival label <strong>${state.activeBuyout.label}</strong> is offering <strong>${formatMoney(state.activeBuyout.price)}</strong> cash to buyout the contract of your artist.` : `Rival label <strong>${state.activeBuyout.label}</strong> is offering to transfer this talent to your label for a <strong>${formatMoney(state.activeBuyout.price)}</strong> buyout fee.`}</p>
      </div>
      <div style="display: flex; gap: 0.5rem; width: 100%; margin-top: 1.2rem;">
        <button class="button button-primary" data-game-action="accept-buyout" style="flex: 1;">Accept offer</button>
        <button class="button button-ghost" data-game-action="decline-buyout" style="flex: 1;">Decline</button>
      </div>
    </section>
    ` : ""}
    
    <section class="game-panel" style="margin-bottom: 1rem;">
      <div class="panel-title"><div><span>A&R ACADEMY</span><h2>Scouting Network Upgrades</h2></div></div>
      <div class="card-grid" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 0.8rem; margin-top: 0.5rem;">
        <article class="talent-card" style="padding: 1rem; border-radius: 12px; min-height: auto; align-items: flex-start; justify-content: space-between; border: 1px solid var(--color-border); background: var(--color-panel-bg); width: 100%; box-sizing: border-box;">
          <div>
            <b style="display:block; font-size: 1rem; color: var(--color-text);">Regional Scouting Network</b>
            <p style="font-size:0.75rem; color:var(--color-muted); margin-top: 4px; margin-bottom: 8px; line-height: 1.3;">Permanently boosts all candidate Talent stats by +5.</p>
          </div>
          ${hasReg ? `<span class="badge" style="color:var(--color-emerald); border:1px solid var(--color-emerald); padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">Unlocked</span>` : `<button class="button button-secondary button-small" data-game-action="buy-upgrade" data-id="regional-scouting" style="width: 100%;">Unlock · €30K</button>`}
        </article>
        
        <article class="talent-card" style="padding: 1rem; border-radius: 12px; min-height: auto; align-items: flex-start; justify-content: space-between; border: 1px solid var(--color-border); background: var(--color-panel-bg); width: 100%; box-sizing: border-box;">
          <div>
            <b style="display:block; font-size: 1rem; color: var(--color-text);">International A&R Partnership</b>
            <p style="font-size:0.75rem; color:var(--color-muted); margin-top: 4px; margin-bottom: 8px; line-height: 1.3;">Permanently boosts candidate Appeal and Buzz stats by +8.</p>
          </div>
          ${hasInt ? `<span class="badge" style="color:var(--color-emerald); border:1px solid var(--color-emerald); padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">Unlocked</span>` : `<button class="button button-secondary button-small" data-game-action="buy-upgrade" data-id="international-partnership" style="width: 100%;">Unlock · €75K</button>`}
        </article>
      </div>
    </section>

    <div class="card-grid">${engine.scoutCandidates().map((artist) => `<article class="talent-card"><div class="talent-avatar" style="background-image: url('${getArtistLogo(artist.name, artist.genre)}')"><b>${initials(artist.name)}</b></div><div><span>${artist.genre} · ${artist.market}</span><h2>${escapeHtml(artist.name)}</h2></div><div class="talent-stats"><label>Talent <b>${artist.talent}</b><i><em style="width:${artist.talent}%"></em></i></label><label>Appeal <b>${artist.appeal}</b><i><em style="width:${artist.appeal}%"></em></i></label><label>Buzz <b>${artist.buzz}</b><i><em style="width:${artist.buzz}%"></em></i></label></div><footer><span><small>WEEKLY COST</small><b>${formatMoney(artist.weeklyCost)}</b></span><button class="button button-primary" data-game-action="sign" data-id="${artist.id}">Sign · ${formatMoney(artist.weeklyCost * 4)}</button></footer></article>`).join("")}</div>
    <div style="display: flex; justify-content: center; margin-top: 1rem;"><button class="button button-secondary" data-game-action="refresh-scout">↻ Pass — Show next candidates · ${formatMoney(2000 + (state.scoutOffset || 0) * 500)}</button></div>`;
  }
  if (view === "roster") {
    return `<div class="view-heading"><div><span class="eyebrow">Artist development</span><h1>Your roster.</h1><p>Morale and fatigue influence sessions, campaigns, and long-term performance.</p></div></div>${signed.length ? `<div class="card-grid">${signed.map((artist) => `<article class="talent-card signed"><div class="talent-avatar" style="background-image: url('${getArtistLogo(artist.name, artist.genre)}')"><b>${initials(artist.name)}</b></div><div><span>${artist.genre} · ${artist.market}</span><h2>${escapeHtml(artist.name)}</h2></div><div class="talent-stats"><label>Morale <b>${artist.morale}</b><i><em style="width:${artist.morale}%"></em></i></label><label>Fatigue <b>${artist.fatigue}</b><i class="fatigue"><em style="width:${artist.fatigue}%"></em></i></label><label>Buzz <b>${artist.buzz}</b><i><em style="width:${artist.buzz}%"></em></i></label></div>
    <div style="margin-top: 0.5rem; padding: 0.5rem 0; border-top: 1px dashed var(--color-border); width: 100%;">
      ${artist.spotifyId ? `
        <iframe src="https://open.spotify.com/embed/artist/${artist.spotifyId}" width="100%" height="80" frameborder="0" allowtransparency="true" allow="encrypted-media" style="border-radius: 8px; border: 0;"></iframe>
        <button class="button button-ghost button-small" data-game-action="disconnect-spotify" data-id="${artist.id}" style="font-size: 0.7rem; padding: 2px 6px; margin-top: 4px; display: block; border: 0;">Disconnect Spotify</button>
      ` : `
        <button class="button button-secondary button-small" data-game-action="connect-spotify" data-id="${artist.id}" style="width: 100%; border-color: #1DB954; color: #1DB954;">Link Spotify Artist ID</button>
      `}
    </div>
    <footer><span><small>CATALOG</small><b>${state.songs.filter((song) => song.artistId === artist.id).length} songs</b></span><button class="button button-secondary" data-view="studio">Book studio</button></footer></article>`).join("")}</div>` : emptyAction("No artists on the roster.", "Scout and sign a prospect before booking studio time.", "Scout artists", "scout")}`;
  }
  if (view === "studio") {
    return `<div class="view-heading"><div><span class="eyebrow">Recording complex</span><h1>Turn ideas into masters.</h1><p>Every session costs €18K plus a talent-based production fee and adds fatigue.</p></div></div>${signed.length ? `<div class="studio-grid"><section class="game-panel"><div class="panel-title"><div><span>BOOK A SESSION</span><h2>Choose an artist</h2></div></div><div class="studio-artists">${signed.map((artist) => `<button data-game-action="record" data-id="${artist.id}"><span class="talent-avatar small" style="background-image: url('${getArtistLogo(artist.name, artist.genre)}')"><b>${initials(artist.name)}</b></span><span><b>${escapeHtml(artist.name)}</b><small>${artist.genre} · Morale ${artist.morale}% · Fatigue ${artist.fatigue}%</small></span><em>${formatMoney(18000 + artist.talent * 120)}</em></button>`).join("")}</div></section><section class="game-panel"><div class="panel-title"><div><span>MASTERS</span><h2>Recorded songs</h2></div></div>${state.songs.length ? `<div class="song-list">${state.songs.map((song) => {
      const artist = state.artists.find((item) => item.id === song.artistId);
      const coverImg = artist ? getGenreImage(artist.genre) : "/images/genre_synth_soul.png";
      const videoStatus = song.videoQuality 
        ? `<span style="font-size: 0.72rem; color: var(--color-emerald); display: block; margin-top: 3px;">🎥 ${song.videoQuality.toUpperCase()} Video · ${formatNumber(song.videoViews || 0)} views</span>`
        : song.status === "released" 
          ? `<div style="margin-top: 6px; display: flex; gap: 4px; align-items: center; width: 100%;">
              <select data-video-scale="${song.id}" style="font-size:0.7rem; padding: 2px; border-radius: 4px; background:var(--color-input-bg); color:var(--color-text); border:1px solid var(--color-border); flex: 1;">
                <option value="diy">DIY (€5K)</option>
                <option value="visualizer">Visualizer (€15K)</option>
                <option value="cinematic">Cinematic (€40K)</option>
                <option value="cgi">CGI Video (€80K)</option>
              </select>
              <button class="button button-secondary button-small" data-game-action="shoot-video" data-id="${song.id}" style="padding: 2px 6px; font-size:0.7rem;">Shoot</button>
             </div>`
          : "";
      return `<article><div class="release-art-thumbnail" style="background-image: url('${coverImg}')"></div><div style="flex:1;"><span>${song.status}</span><b>${escapeHtml(song.title)}</b><small>${escapeHtml(artist?.name || "")} · Quality ${song.quality}%</small>${videoStatus}</div>${song.status === "recorded" ? `<button class="button button-primary" data-game-action="release" data-id="${song.id}">Release</button>` : `<em>${formatNumber(song.streams)} streams</em>`}</article>`;
    }).join("")}</div>` : `<div class="mini-empty"><p>No masters recorded yet.</p></div>`}</section></div>` : emptyAction("The studio is silent.", "Sign an artist before booking a recording session.", "Scout artists", "scout")}`;
  }
  if (view === "marketing") {
    const released = state.songs.filter((song) => song.status === "released");
    return `<div class="view-heading"><div><span class="eyebrow">Campaign room</span><h1>Create qualified attention.</h1><p>Campaigns remain active for four weekly resolutions. Spend does not guarantee a hit.</p></div></div>${released.length ? `<div class="campaign-grid">${released.map((song) => `<article class="game-panel campaign-card"><div><span>RELEASED W${song.releaseWeek}</span><h2>${escapeHtml(song.title)}</h2><p>${formatNumber(song.streams)} streams · ${formatNumber(song.radioSpins)} radio spins</p></div><label>Campaign channel<select data-campaign-type="${song.id}"><option value="social">Social burst</option><option value="playlist">Playlist pitching</option><option value="radio">Radio promotion</option><option value="press">Press outreach</option><option value="fanclub">Fan-club activation</option><option value="video">Music video concept</option><option value="international">International launch</option></select></label><label>Budget<select data-campaign-spend="${song.id}"><option value="5000">€5K focused</option><option value="15000">€15K regional</option><option value="40000">€40K major push</option></select></label><button class="button button-primary" data-game-action="campaign" data-id="${song.id}">Launch campaign</button></article>`).join("")}</div>` : emptyAction("Nothing to promote yet.", "Record and release a song before launching a campaign.", "Go to studio", "studio")}`;
  }
  if (view === "touring") {
    return `<div class="view-heading"><div><span class="eyebrow">Live division</span><h1>Turn listeners into believers.</h1><p>Touring can create cash and loyal fans, but it raises fatigue and requires upfront risk.</p></div></div>${signed.length ? `<div class="tour-grid">${signed.map((artist) => `<article class="game-panel tour-card"><div class="talent-avatar" style="background-image: url('${getArtistLogo(artist.name, artist.genre)}')"><b>${initials(artist.name)}</b></div><div><span>${artist.genre} · Fatigue ${artist.fatigue}%</span><h2>${escapeHtml(artist.name)}</h2><p>Appeal ${artist.appeal} · Buzz ${artist.buzz} · ${state.tours.some((tour) => tour.artistId === artist.id) ? "Currently touring" : "Available"}</p></div><div class="tour-actions"><button data-game-action="book-tour" data-id="${artist.id}" data-scale="club">Club circuit <small>from €22K</small></button><button data-game-action="book-tour" data-id="${artist.id}" data-scale="theater">Theater tour <small>from €68K</small></button><button data-game-action="book-tour" data-id="${artist.id}" data-scale="festival">Festival run <small>from €110K</small></button></div></article>`).join("")}</div><section class="game-panel active-tours"><div class="panel-title"><div><span>ON THE ROAD</span><h2>Active tours</h2></div></div>${state.tours.length ? state.tours.map((tour) => `<article><div><b>${escapeHtml(tour.name)}</b><small>${tour.markets.join(" · ")}</small></div><span>${tour.weeksRemaining} weeks</span><em>${formatMoney(tour.revenue)} gross</em></article>`).join("") : "<p class='muted'>No tours are currently active.</p>"}</section>` : emptyAction("No artist can headline yet.", "Sign an artist before routing a tour.", "Scout artists", "scout")}`;
  }
  if (view === "staff") {
    const candidates = engine.staffCandidates();
    return `<div class="view-heading"><div><span class="eyebrow">Company builder</span><h1>Your team changes the odds.</h1><p>Staff add weekly overhead but improve scouting, marketing, radio, touring, and financial execution.</p></div></div><section class="game-panel"><div class="panel-title"><div><span>EMPLOYEES</span><h2>Current team</h2></div><span>${state.staff.length} hired</span></div>${state.staff.length ? `<div class="staff-list">${state.staff.map((member) => `<article><div class="talent-avatar small">${initials(member.name)}</div><div><b>${escapeHtml(member.name)}</b><small>${member.role} · Skill ${member.skill}</small></div><em>${formatMoney(member.weeklyCost)}/week</em></article>`).join("")}</div>` : "<p class='muted'>The founder is still doing every job.</p>"}</section><div class="card-grid staff-candidates">${candidates.map((member) => `<article class="talent-card"><div class="talent-avatar">${initials(member.name)}</div><div><span>${member.role}</span><h2>${escapeHtml(member.name)}</h2></div><div class="talent-stats"><label>Skill <b>${member.skill}</b><i><em style="width:${member.skill}%"></em></i></label></div><footer><span><small>WEEKLY COST</small><b>${formatMoney(member.weeklyCost)}</b></span><button class="button button-primary" data-game-action="hire-staff" data-id="${member.id}">Hire · ${formatMoney(member.weeklyCost * 2)}</button></footer></article>`).join("")}</div>`;
  }
  if (view === "charts") {
    const history = state.chartHistory || [];
    return `<div class="view-heading"><div><span class="eyebrow">Global Pulse Top 20</span><h1>The world chart.</h1><p>A fictional weekly chart combining quality, audience fit, buzz, campaigns, decay, and volatility.</p></div></div>${chartSparkline(history)}${state.chart.length ? `<section class="game-panel chart-table"><div class="chart-head"><span>#</span><span>Release</span><span>Label</span><span>Score</span></div>${state.chart.map((entry) => {
      const specialty = state.rivalSpecialties?.[entry.label];
      const specialtyTag = specialty ? `<small style="font-size: 0.6rem; color: var(--color-purple); display: block; margin-top: 2px;">★ ${specialty} Leader</small>` : "";
      let movementTag = "";
      if (entry.playerOwned) {
        const prev = history.filter((h) => h.title === entry.title && h.week < state.week);
        const lastPos = prev.length > 0 ? prev[prev.length - 1]!.position : null;
        if (lastPos === null) movementTag = `<span class="chart-movement chart-new">NEW</span>`;
        else if (entry.position < lastPos) movementTag = `<span class="chart-movement chart-up">▲${lastPos - entry.position}</span>`;
        else if (entry.position > lastPos) movementTag = `<span class="chart-movement chart-down">▼${entry.position - lastPos}</span>`;
        else movementTag = `<span class="chart-movement chart-steady">—</span>`;
      }
      return `<article class="${entry.playerOwned ? "player-entry" : ""}"><b>${entry.position}</b><div><strong>${escapeHtml(entry.title)}</strong>${movementTag}<small>${escapeHtml(entry.artist)}</small></div><span><img src="${getLabelLogo(entry.label)}" style="width: 16px; height: 16px; border-radius: 4px; display: inline-block; vertical-align: middle; margin-right: 6px; border: 1px solid rgba(255,255,255,0.08);">${escapeHtml(entry.label)}${specialtyTag}</span><em>${entry.score}</em></article>`;
    }).join("")}</section>` : emptyAction("The chart updates after a release week.", "Release music and advance the week to see how it competes.", "Go to studio", "studio")}`;
  }
  const fanClubFundingLevel = state.fanClubFunding || "none";
  const fanClubCost = fanClubFundingLevel === "street" ? 2000 : fanClubFundingLevel === "app" ? 6000 : fanClubFundingLevel === "party" ? 12000 : 0;
  const weeklyCosts = signed.reduce((sum, artist) => sum + artist.weeklyCost, 0);
  const staffCosts = state.staff.reduce((sum, member) => sum + member.weeklyCost, 0);
  return `<div class="view-heading"><div><span class="eyebrow">Finance office</span><h1>Cash is creative oxygen.</h1><p>Runway matters more than vanity metrics. Every signing and hire adds a recurring commitment.</p></div></div><div class="metric-grid finance"><article><small>CASH</small><b>${formatMoney(state.cash)}</b></article><article><small>WEEKLY OVERHEAD</small><b>${formatMoney(weeklyCosts + staffCosts + fanClubCost + (state.loans || []).reduce((sum, l) => sum + l.weeklyRepayment, 0))}</b></article><article><small>TOTAL REVENUE</small><b>${formatMoney(state.totalRevenue)}</b></article><article><small>COMPANY VALUE</small><b>${formatMoney(state.companyValuation)}</b></article></div><section class="game-panel" style="margin-bottom: 0.8rem;"><div class="panel-title"><div><span>PLATFORM DISTRIBUTOR</span><h2>Global streaming shares</h2></div></div><div class="card-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.8rem; margin-top: 0.5rem; margin-bottom: 0.8rem;">
    <article class="talent-card" style="padding: 1rem; flex-direction: row; align-items: center; gap: 0.8rem; background: var(--color-panel-bg); border: 1px solid var(--color-border); border-radius: 12px; min-height: auto; width: 100%; box-sizing: border-box;"><img src="/images/logo_soundwave.png" style="width: 40px; height: 40px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); object-fit: cover;" alt="SoundWave"><div><b style="display:block; font-size: 0.95rem; color: var(--color-text);">SoundWave</b><span style="font-size:0.75rem; color:var(--color-muted); display: block; margin-top: 2px;">40% stream share</span></div></article>
    <article class="talent-card" style="padding: 1rem; flex-direction: row; align-items: center; gap: 0.8rem; background: var(--color-panel-bg); border: 1px solid var(--color-border); border-radius: 12px; min-height: auto; width: 100%; box-sizing: border-box;"><img src="/images/logo_nebulaplay.png" style="width: 40px; height: 40px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); object-fit: cover;" alt="Nebula Play"><div><b style="display:block; font-size: 0.95rem; color: var(--color-text);">Nebula Play</b><span style="font-size:0.75rem; color:var(--color-muted); display: block; margin-top: 2px;">30% stream share</span></div></article>
    <article class="talent-card" style="padding: 1rem; flex-direction: row; align-items: center; gap: 0.8rem; background: var(--color-panel-bg); border: 1px solid var(--color-border); border-radius: 12px; min-height: auto; width: 100%; box-sizing: border-box;"><img src="/images/logo_beatstream.png" style="width: 40px; height: 40px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); object-fit: cover;" alt="BeatStream"><div><b style="display:block; font-size: 0.95rem; color: var(--color-text);">BeatStream</b><span style="font-size:0.75rem; color:var(--color-muted); display: block; margin-top: 2px;">20% stream share</span></div></article>
    <article class="talent-card" style="padding: 1rem; flex-direction: row; align-items: center; gap: 0.8rem; background: var(--color-panel-bg); border: 1px solid var(--color-border); border-radius: 12px; min-height: auto; width: 100%; box-sizing: border-box;"><img src="/images/logo.png" style="width: 40px; height: 40px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); filter: grayscale(1); object-fit: cover;" alt="Others"><div><b style="display:block; font-size: 0.95rem; color: var(--color-text);">Others</b><span style="font-size:0.75rem; color:var(--color-muted); display: block; margin-top: 2px;">10% stream share</span></div></article>
  </div></section><section class="game-panel" style="margin-bottom: 0.8rem;"><div class="panel-title"><div><span>LIABILITIES</span><h2>Active emergency loans</h2></div><span>${(state.loans || []).length}/3 active</span></div>${(state.loans && state.loans.length) ? `<div class="song-list">${state.loans.map((loan) => `<article><div><span>REPAYING W${40 - loan.weeksRemaining}/40</span><b>€75K Emergency Loan</b><small>€2.5K weekly repayment · ${loan.weeksRemaining} weeks remaining</small></div><em>${formatMoney(loan.weeksRemaining * loan.weeklyRepayment)} principal remaining</em></article>`).join("")}</div>` : "<p class='muted'>No active liabilities. Your credit score is excellent.</p>"}</section>
  <section class="game-panel" style="margin-bottom: 0.8rem;">
    <div class="panel-title"><div><span>COMMUNITY</span><h2>Fan Club & Street Team Funding</h2></div></div>
    <div style="padding: 0.8rem; background: var(--color-panel-bg); border-radius: 12px; border: 1px solid var(--color-border); width: 100%; box-sizing: border-box;">
      <p style="font-size:0.8rem; color:var(--color-muted); line-height: 1.4; margin-bottom: 0.8rem;">Invest weekly in community building to accelerate organic growth, morale, and catalog streams.</p>
      <div style="display: flex; flex-direction: column; gap: 0.6rem;">
        <label style="display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; color: var(--color-text); cursor: pointer;">
          <span><input type="radio" name="fan-funding" data-game-action="set-fan-funding" value="none" ${state.fanClubFunding === "none" ? "checked" : ""}> No Funding (Default)</span>
          <b>€0/week</b>
        </label>
        <label style="display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; color: var(--color-text); cursor: pointer;">
          <span><input type="radio" name="fan-funding" data-game-action="set-fan-funding" value="street" ${state.fanClubFunding === "street" ? "checked" : ""}> Street Team Flyering (+5 Weekly Buzz to Random Artist)</span>
          <b>€2,000/week</b>
        </label>
        <label style="display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; color: var(--color-text); cursor: pointer;">
          <span><input type="radio" name="fan-funding" data-game-action="set-fan-funding" value="app" ${state.fanClubFunding === "app" ? "checked" : ""}> Official Fan Club App (+10 Weekly Morale to Roster)</span>
          <b>€6,000/week</b>
        </label>
        <label style="display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; color: var(--color-text); cursor: pointer;">
          <span><input type="radio" name="fan-funding" data-game-action="set-fan-funding" value="party" ${state.fanClubFunding === "party" ? "checked" : ""}> Virtual Listening Parties (+12% Weekly Streams Boost)</span>
          <b>€12,000/week</b>
        </label>
      </div>
    </div>
  </section>
  <section class="game-panel" style="margin-bottom: 0.8rem;">
    <div class="panel-title"><div><span>LOGISTICS</span><h2>Vinyl & Merchandising</h2></div></div>
    <div class="song-list">
      ${state.songs.filter(s => s.status === "released").map((song) => {
        const artist = state.artists.find(a => a.id === song.artistId)!;
        const vinyl = (state.vinyls || []).find(v => v.songId === song.id);
        return `<article>
          <div>
            <b>“${escapeHtml(song.title)}” Physical Vinyl Pressing</b>
            <small>${escapeHtml(artist.name)} · ${vinyl ? `${vinyl.stock.toLocaleString()} in stock · ${vinyl.sold.toLocaleString()} sold (€${formatNumber(vinyl.revenue)} revenue)` : "No physical run ordered yet."}</small>
          </div>
          <button class="button button-secondary button-small" data-game-action="press-vinyl" data-id="${song.id}">Press 5,000 Vinyls (€15K)</button>
        </article>`;
      }).join("") || "<p class='muted' style='padding: 0.5rem 0;'>Release music to enable vinyl pressing runs.</p>"}
      
      ${signed.map((artist) => {
        const campaign = (state.merch || []).find(m => m.artistId === artist.id && m.active);
        return `<article>
          <div>
            <b>${escapeHtml(artist.name)} Merchandise Line</b>
            <small>${campaign ? `Active apparel line · ${campaign.weeksRemaining} weeks remaining` : "Setup a custom merchandise and streetwear line."}</small>
          </div>
          ${campaign ? `<em>Campaign active</em>` : `<button class="button button-secondary button-small" data-game-action="start-merch" data-id="${artist.id}">Launch Merch Line (€8K)</button>`}
        </article>`;
      }).join("") || "<p class='muted' style='padding: 0.5rem 0;'>Sign artists to route custom apparel campaigns.</p>"}
    </div>
  </section>
  <section class="game-panel" style="margin-bottom: 0.8rem;">
    <div class="panel-title"><div><span>MILESTONES</span><h2>Hall of Fame & Certifications</h2></div></div>
    <div class="song-list" style="max-height: 200px; overflow-y: auto; width: 100%;">
      ${(state.hallOfFame || []).length 
        ? state.hallOfFame.map(log => `<article style="padding: 0.4rem 0; align-items: center;"><span style="color:#ffd700; margin-right: 8px;">★</span><b>${escapeHtml(log)}</b></article>`).join("")
        : "<p class='muted'>No certifications or historic milestones unlocked yet.</p>"
      }
    </div>
  </section>
  <section class="game-panel"><div class="panel-title"><div><span>CATALOG</span><h2>Revenue assets</h2></div></div>${state.songs.length ? `<div class="song-list">${state.songs.map((song) => {
    const artist = state.artists.find((item) => item.id === song.artistId);
    const coverImg = artist ? getGenreImage(artist.genre) : "/images/genre_synth_soul.png";
    const certBadge = song.certification === "diamond" ? `<span class="badge-diamond">♦ DIAMOND</span>` :
                      song.certification === "platinum" ? `<span class="badge-platinum">✦ PLATINUM</span>` :
                      song.certification === "gold" ? `<span class="badge-gold">★ GOLD</span>` : "";
    const videoTag = song.videoQuality ? `<span style="font-size: 0.72rem; color: var(--color-muted); display: block; margin-top: 2px;">🎥 ${song.videoQuality.toUpperCase()} Video · ${formatNumber(song.videoViews || 0)} views</span>` : "";
    return `<article><div class="release-art-thumbnail" style="background-image: url('${coverImg}')"></div><div><span>${song.status}</span><b>${escapeHtml(song.title)}</b>${certBadge}<small>${escapeHtml(artist?.name || "")} · Quality ${song.quality} · ${formatNumber(song.streams)} streams · Peak ${song.peakPosition ? `#${song.peakPosition}` : "—"}</small>${videoTag}</div><em>${formatMoney(song.streams * 0.0035 + song.radioSpins * 2.1)}</em></article>`;
  }).join("")}</div>` : `<div class="mini-empty"><p>Your catalog has no recorded assets.</p></div>`}</section>`;
}

function bindGameEvents(): void {
  gameRoot().addEventListener("submit", async (event) => {
    if (!(event.target instanceof HTMLFormElement)) return;
    event.preventDefault();
    if (event.target.id === "auth-form") {
      const form = event.target;
      const data = new FormData(form);
      const status = form.querySelector<HTMLElement>(".form-status")!;
      const mode = form.dataset.authMode as "register" | "login";
      status.textContent = mode === "register" ? "Creating account…" : "Signing in…";
      try {
        const input = {
          email: String(data.get("email") || ""),
          password: String(data.get("password") || ""),
          turnstileToken: String(data.get("turnstileToken") || "")
        };
        const response = mode === "register"
          ? await authService.register({ ...input, displayName: String(data.get("displayName") || "") })
          : await authService.login(input);
        accountUser = response.user;
        cloudSummaries = await cloudSaveService.list();
        renderAccountHub(await saves.load());
      } catch (error) {
        status.textContent = error instanceof Error ? error.message : "Account request failed.";
        const container = form.querySelector<HTMLElement>("#auth-turnstile");
        const token = form.querySelector<HTMLInputElement>('input[name="turnstileToken"]');
        if (container && token) {
          container.innerHTML = "";
          token.value = "";
          void mountTurnstile(container, mode, token);
        }
      }
      return;
    }
    if (event.target.id === "delete-account-form") {
      const form = event.target;
      const data = new FormData(form);
      const status = form.querySelector<HTMLElement>(".form-status")!;
      status.textContent = "Deleting account…";
      try {
        await authService.deleteAccount(String(data.get("password") || ""), String(data.get("turnstileToken") || ""));
        accountUser = null;
        cloudSummaries = [];
        cloudSaveId = null;
        renderStart();
      } catch (error) {
        status.textContent = error instanceof Error ? error.message : "Account deletion failed.";
      }
      return;
    }
    if (event.target.id !== "new-game-form") return;
    const data = new FormData(event.target);
    const selectedMode = String(data.get("challengeId") || "");
    engine = SimulationEngine.create({
      labelName: String(data.get("labelName") || ""),
      logo: String(data.get("logo") || "logo-cyan"),
      strategy: String(data.get("strategy") || "indie") as StrategyId,
      market: String(data.get("market") || markets[0]),
      difficulty: String(data.get("difficulty") || "competitive") as Difficulty,
      challengeId: selectedMode && selectedMode !== "sandbox" ? selectedMode : null,
      sandbox: selectedMode === "sandbox",
      startingBudget: Number(data.get("startingBudget") || 250_000),
      aiAggression: Number(data.get("aiAggression") || 50),
      trendVolatility: Number(data.get("trendVolatility") || 50)
    });
    await saves.save(engine.state);
    if (accountUser) {
      const cloud = await cloudSaveService.create(engine.state);
      cloudSaveId = cloud.id;
      cloudSyncState = "synced";
    }
    renderGame();
    window.scrollTo({ top: 0, behavior: "instant" });
  });

  gameRoot().addEventListener("click", async (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-game-action], [data-view]");
    if (!target) return;
    const view = target.dataset.view as GameView | undefined;
    if (view) {
      currentView = view;
      renderGame();
      return;
    }
    const action = target.dataset.gameAction;
    if (action === "account") {
      if (accountsEnabled) renderAuthScreen("register");
      else renderAccountsUnavailable();
      return;
    }
    if (action === "show-login") {
      renderAuthScreen("login");
      return;
    }
    if (action === "show-register") {
      renderAuthScreen("register");
      return;
    }
    if (action === "guest-start") {
      renderStart();
      return;
    }
    if (action === "account-hub") {
      if (accountUser) {
        cloudSummaries = await cloudSaveService.list();
        renderAccountHub(await saves.load());
      } else renderAuthScreen("login");
      return;
    }
    if (action === "new-registered") {
      renderStart(true);
      return;
    }
    if (action === "logout") {
      await authService.logout();
      accountUser = null;
      cloudSaveId = null;
      cloudSummaries = [];
      const local = await saves.load();
      if (local) renderWelcomeBack(local);
      else renderStart();
      return;
    }
    if (action === "export-account") {
      authService.exportAccount();
      return;
    }
    if (action === "mute") {
      const muted = audioService.toggle();
      target.textContent = muted ? "♪̸" : "♪";
      target.setAttribute("aria-label", muted ? "Unmute game audio" : "Mute game audio");
      if (!muted) audioService.cue("action");
      return;
    }
    if (action === "show-delete-account") {
      renderDeleteAccountScreen();
      return;
    }
    if (action === "load-cloud" && target.dataset.id) {
      const cloud = await cloudSaveService.get(target.dataset.id);
      cloudSaveId = cloud.id;
      engine = new SimulationEngine(cloud.state);
      await saves.save(engine.state);
      cloudSyncState = "synced";
      currentView = "dashboard";
      renderGame();
      return;
    }
    if (action === "delete-cloud" && target.dataset.id) {
      if (!confirm("Delete this cloud career permanently?")) return;
      await cloudSaveService.delete(target.dataset.id);
      cloudSummaries = await cloudSaveService.list();
      renderAccountHub(await saves.load());
      return;
    }
    if (action === "upload-local") {
      const local = await saves.load();
      if (!local) return;
      const cloud = await cloudSaveService.create(local);
      cloudSaveId = cloud.id;
      cloudSummaries = await cloudSaveService.list();
      renderAccountHub(local);
      return;
    }
    if (action === "resume") {
      const state = await saves.load();
      if (state) engine = new SimulationEngine(state);
      renderGame();
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    if (action === "new") {
      if (confirm("Start a new label? Export your current save first if you want to keep it.")) renderStart();
      return;
    }
    if (action === "export-saved") {
      const state = await saves.load();
      if (state) saves.export(state);
      return;
    }
    if (!engine) return;
    try {
      if (action === "take-loan") {
        engine.takeEmergencyLoan();
        await persistState(true);
        renderGame();
        showToast("Emergency financing secured: +€75,000 cash.");
        return;
      }
      if (action === "buy-upgrade" && target.dataset.id) {
        engine.buyUpgrade(target.dataset.id);
        await persistState(true);
        renderGame();
        showToast("A&R Network upgrade unlocked!");
        return;
      }
      if (action === "refresh-scout") {
        engine.refreshScout();
        await persistState(true);
        renderGame();
        showToast("Scout pool refreshed — new candidates available.");
        return;
      }
      if (action === "press-vinyl" && target.dataset.id) {
        engine.orderVinyl(target.dataset.id, 5000);
        await persistState(true);
        renderGame();
        showToast("Physical vinyl production run ordered.");
        return;
      }
      if (action === "start-merch" && target.dataset.id) {
        engine.launchMerch(target.dataset.id);
        await persistState(true);
        renderGame();
        showToast("Merch apparel line launched!");
        return;
      }
      if (action === "accept-buyout") {
        engine.acceptBuyout();
        await persistState(true);
        renderGame();
        showToast("Buyout transfer request accepted.");
        return;
      }
      if (action === "decline-buyout") {
        engine.declineBuyout();
        await persistState(true);
        renderGame();
        showToast("Buyout transfer request declined.");
        return;
      }
      if (action === "connect-spotify" && target.dataset.id) {
        const val = prompt("Enter Spotify Artist ID (e.g., 69qRhgP3oeSzomcOLMJmDm):");
        if (val !== null) {
          engine.setArtistSpotifyId(target.dataset.id, val || null);
          await persistState(true);
          renderGame();
          showToast("Spotify Artist Profile linked!");
        }
        return;
      }
      if (action === "disconnect-spotify" && target.dataset.id) {
        engine.setArtistSpotifyId(target.dataset.id, null);
        await persistState(true);
        renderGame();
        showToast("Spotify profile disconnected.");
        return;
      }
      if (action === "shoot-video" && target.dataset.id) {
        const scale = document.querySelector<HTMLSelectElement>(`[data-video-scale="${target.dataset.id}"]`)?.value as any;
        if (scale) {
          engine.shootMusicVideo(target.dataset.id, scale);
          await persistState(true);
          renderGame();
          showToast("Music video production commissioned!");
        }
        return;
      }
      if (action === "set-fan-funding" && target instanceof HTMLInputElement) {
        engine.setFanClubFunding(target.value as any);
        await persistState(true);
        renderGame();
        showToast("Fan app community funding adjusted.");
        return;
      }
      if (action === "restart-career") {
        if (confirm("Are you sure you want to restart? This will overwrite your current save.")) {
          engine = null;
          renderStart();
        }
        return;
      }
      if (action === "sign" && target.dataset.id) engine.signArtist(target.dataset.id);
      if (action === "record" && target.dataset.id) {
        const artist = engine.state.artists.find(a => a.id === target.dataset.id);
        if (artist) audioService.playMelodyForGenre(artist.genre);
        engine.recordSong(target.dataset.id);
      }
      if (action === "release" && target.dataset.id) engine.releaseSong(target.dataset.id);
      if (action === "campaign" && target.dataset.id) {
        const type = document.querySelector<HTMLSelectElement>(`[data-campaign-type="${target.dataset.id}"]`)?.value as Campaign["type"];
        const spend = Number(document.querySelector<HTMLSelectElement>(`[data-campaign-spend="${target.dataset.id}"]`)?.value || 5000);
        engine.launchCampaign(target.dataset.id, type, spend);
      }
      if (action === "hire-staff" && target.dataset.id) engine.hireStaff(target.dataset.id);
      if (action === "book-tour" && target.dataset.id && target.dataset.scale) {
        engine.bookTour(target.dataset.id, target.dataset.scale as "club" | "theater" | "festival");
      }
      if (action === "event-choice" && target.dataset.id) engine.resolveEvent(target.dataset.id);
      if (action === "end-week") {
        await advanceWeek();
        return;
      }
      if (action === "goto-event") {
        currentView = "dashboard";
        renderGame();
        document.querySelector(".event-decision")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      if (action === "dismiss-report") {
        document.querySelector(".week-overlay")?.remove();
        return;
      }
      if (action === "sync-cloud") {
        await persistState(true);
        renderGame();
        showToast("Cloud career synchronized.");
        return;
      }
      if (action === "publish-score") {
        if (!cloudSaveId) throw new Error("Sync this career to the cloud before publishing a score.");
        await persistState(true);
        const result = await cloudSaveService.publishScore(cloudSaveId, engine.state.challengeId || undefined);
        showToast(result.improved ? `Leaderboard score published: ${formatNumber(result.score)}.` : `Existing score remains higher: ${formatNumber(result.score)}.`);
        return;
      }
      if (action === "export") {
        saves.export(engine.state);
        return;
      }
      if (action === "toggle-menu") {
        document.querySelector(".game-sidebar")?.classList.toggle("is-open");
        return;
      }
      await persistState();
      renderGame();
      showToast(accountUser ? "Career saved locally and queued for cloud sync." : "Career saved on this device.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "That action could not be completed.", true);
    }
  });

  gameRoot().addEventListener("change", async (event) => {
    const logoInput = (event.target as HTMLElement).closest<HTMLInputElement>("[data-logo-upload]");
    if (logoInput?.files?.[0] && engine) {
      try {
        const asset = await assetUploadService.uploadLogo(logoInput.files[0]);
        engine.state.logo = asset.url;
        await persistState(true);
        renderGame();
        showToast("Custom label logo uploaded.");
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Logo upload failed.", true);
      }
      return;
    }
    const qualitySelect = (event.target as HTMLElement).closest<HTMLSelectElement>("[data-quality]");
    if (qualitySelect) {
      localStorage.setItem("chart-empire-quality", qualitySelect.value);
      document.documentElement.dataset.quality = qualitySelect.value;
      showToast("Quality setting saved. Reload the game route to rebuild background effects.");
      return;
    }
    const input = (event.target as HTMLElement).closest<HTMLInputElement>("[data-game-import]");
    if (!input?.files?.[0]) return;
    try {
      engine = new SimulationEngine(await saves.import(input.files[0]));
      if (accountUser) {
        const cloud = await cloudSaveService.create(engine.state);
        cloudSaveId = cloud.id;
      }
      currentView = "dashboard";
      renderGame();
      showToast("Save imported.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Import failed.", true);
    }
  });

  const viewKeys: Record<string, GameView> = { "1": "dashboard", "2": "scout", "3": "roster", "4": "studio", "5": "marketing", "6": "touring", "7": "staff", "8": "charts", "9": "finance" };
  if (keydownHandler) document.removeEventListener("keydown", keydownHandler);
  keydownHandler = async (event: KeyboardEvent) => {
    if (!engine || !document.querySelector("#game-ui")) return;
    if ((event.target as HTMLElement).matches("input, textarea, select")) return;
    if (event.key === "Escape") {
      document.querySelector(".week-overlay")?.remove();
      return;
    }
    if (viewKeys[event.key]) {
      currentView = viewKeys[event.key]!;
      renderGame();
      return;
    }
    if (event.key === " " && !event.repeat) {
      event.preventDefault();
      if (engine.state.pendingEvent || document.querySelector(".week-overlay")) return;
      try {
        await advanceWeek();
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Week advance failed.", true);
      }
    }
  };
  document.addEventListener("keydown", keydownHandler);
}

interface SongWeekResult {
  title: string;
  artist: string;
  cover: string;
  streamsGained: number;
  earned: number;
  posBefore: number | null;
  posAfter: number | null;
}

async function advanceWeek(): Promise<void> {
  if (!engine) return;
  if (engine.state.pendingEvent) throw new Error("Resolve the current event before advancing the week.");
  const resolvedWeek = engine.state.week;
  const knownNews = new Set(engine.state.news.map((item) => item.id));
  const songsBefore = engine.state.songs.filter((song) => song.status === "released").map((song) => ({ id: song.id, streams: song.streams, radioSpins: song.radioSpins }));
  const chartBefore = new Map(engine.state.chart.filter((entry) => entry.playerOwned).map((entry) => [entry.title, entry.position]));
  const report = engine.endWeek();
  const freshNews = engine.state.news.filter((item) => !knownNews.has(item.id));
  const chartAfter = new Map(engine.state.chart.filter((entry) => entry.playerOwned).map((entry) => [entry.title, entry.position]));
  const songResults: SongWeekResult[] = songsBefore.flatMap((prev) => {
    const song = engine!.state.songs.find((item) => item.id === prev.id);
    if (!song) return [];
    const artist = engine!.state.artists.find((item) => item.id === song.artistId);
    const streamsGained = song.streams - prev.streams;
    const radioGained = song.radioSpins - prev.radioSpins;
    return [{
      title: song.title,
      artist: artist?.name || "",
      cover: artist ? getGenreImage(artist.genre) : "/images/genre_synth_soul.png",
      streamsGained,
      earned: Math.round(streamsGained * 0.0035 + radioGained * 2.1),
      posBefore: chartBefore.get(song.title) ?? null,
      posAfter: chartAfter.get(song.title) ?? null
    }];
  }).sort((a, b) => b.streamsGained - a.streamsGained).slice(0, 5);
  analyticsService.track("week_resolved", { week: engine.state.week, peakChart: report.peakChart || 0, challenge: engine.state.challengeId || "career" });
  window.dispatchEvent(new CustomEvent<WeekReport>("chart-empire-week", { detail: report }));
  await persistState();
  renderGame();
  showWeekReport(report, freshNews, resolvedWeek, songResults);
}

function renderDeleteAccountScreen(): void {
  gameRoot().innerHTML = `<div class="start-screen"><form id="delete-account-form" class="start-card auth-card">
    <span class="eyebrow">Danger zone</span><h1>Delete this account?</h1><p>This permanently removes cloud saves, scores, achievements, and uploaded logos. Local browser saves remain until you clear them.</p>
    <label class="field-label">Confirm password<input name="password" type="password" required autocomplete="current-password"></label>
    <input type="hidden" name="turnstileToken"><div id="delete-turnstile" class="turnstile-slot"></div><p class="form-status" role="status"></p>
    <button class="button button-primary button-large" type="submit">Permanently delete account</button><button class="button button-ghost" type="button" data-game-action="account-hub">Cancel</button>
  </form></div>`;
  const container = document.querySelector<HTMLElement>("#delete-turnstile");
  const token = document.querySelector<HTMLInputElement>('#delete-account-form input[name="turnstileToken"]');
  if (container && token) void mountTurnstile(container, "delete_account", token);
}

async function persistState(forceCloud = false): Promise<void> {
  if (!engine) return;
  await saves.save(engine.state);
  if (!accountUser) {
    cloudSyncState = "local";
    return;
  }
  cloudSyncState = "syncing";
  updateSyncIndicator();
  if (cloudSyncTimer !== null) window.clearTimeout(cloudSyncTimer);
  if (forceCloud) {
    if (cloudSyncPromise) await cloudSyncPromise;
    await syncCloudNow();
    return;
  }
  cloudSyncTimer = window.setTimeout(() => {
    cloudSyncTimer = null;
    void syncCloudNow().catch(() => showToast("Cloud sync failed; the local save remains safe.", true));
  }, 700);
}

async function syncCloudNow(): Promise<void> {
  if (!engine || !accountUser) return;
  const snapshot = structuredClone(engine.state);
  cloudSyncPromise = (async () => {
    try {
      if (cloudSaveId) await cloudSaveService.update(cloudSaveId, snapshot);
      else {
        const cloud = await cloudSaveService.create(snapshot);
        cloudSaveId = cloud.id;
      }
      cloudSyncState = "synced";
    } catch (error) {
      cloudSyncState = "error";
      throw error;
    } finally {
      cloudSyncPromise = null;
      updateSyncIndicator();
    }
  })();
  return cloudSyncPromise;
}

function updateSyncIndicator(): void {
  const indicator = document.querySelector<HTMLElement>(".sidebar-bottom > span");
  if (indicator && accountUser) indicator.textContent = `${accountUser.displayName} · ${cloudSyncState}`;
}

type WeekVerdict = { tone: "good" | "neutral" | "bad"; title: string; sub: string };

function weekVerdict(report: WeekReport, freshNews: NewsItem[]): WeekVerdict {
  const net = report.revenue - report.expenses;
  let score = 0;
  if (net > 0) score += 1;
  if (net < -20000) score -= 1;
  if (report.peakChart && report.peakChart <= 10) score += 1;
  if (report.fanGrowth > 2500) score += 1;
  if (freshNews.some((item) => item.tone === "danger")) score -= 1;
  if (freshNews.filter((item) => item.tone === "good").length >= 2) score += 1;
  if (score >= 2) return { tone: "good", title: "Breakout week!", sub: "The industry is talking about your label." };
  if (score <= -1) return { tone: "bad", title: "Rough week.", sub: "Regroup, protect the runway, and plan the comeback." };
  return { tone: "neutral", title: "Steady progress.", sub: "No fireworks — but the machine keeps turning." };
}

function chartSparkline(history: GameState["chartHistory"]): string {
  const points = (history || []).slice(-26);
  if (points.length < 2) return "";
  const width = 520;
  const height = 96;
  const padX = 10;
  const padY = 12;
  const minWeek = points[0]!.week;
  const spanWeeks = Math.max(1, points[points.length - 1]!.week - minWeek);
  const coords = points.map((point) => {
    const x = padX + ((point.week - minWeek) / spanWeeks) * (width - padX * 2);
    const y = padY + ((point.position - 1) / 19) * (height - padY * 2);
    return [x, y] as const;
  });
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [lastX, lastY] = coords[coords.length - 1]!;
  const current = points[points.length - 1]!;
  const best = points.reduce((acc, point) => Math.min(acc, point.position), 20);
  return `<section class="game-panel chart-spark"><div class="panel-title"><div><span>TRAJECTORY</span><h2>Your chart run</h2></div><span>Now #${current.position} · Best #${best}</span></div>
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="Best chart position over the last ${points.length} charting weeks, currently number ${current.position}">
      <line class="spark-grid" x1="${padX}" y1="${padY}" x2="${width - padX}" y2="${padY}"></line>
      <line class="spark-grid" x1="${padX}" y1="${height / 2}" x2="${width - padX}" y2="${height / 2}"></line>
      <line class="spark-grid" x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}"></line>
      <text class="spark-label" x="${padX + 2}" y="${padY - 3}">#1</text>
      <text class="spark-label" x="${padX + 2}" y="${height - padY + 10}">#20</text>
      <polyline class="spark-line" pathLength="1" points="${line}"></polyline>
      <circle class="spark-dot" cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="4"></circle>
    </svg></section>`;
}

function chartMovementBadge(result: SongWeekResult): string {
  if (result.posAfter !== null && result.posBefore === null) return `<span class="week-song-chart new">NEW #${result.posAfter}</span>`;
  if (result.posAfter !== null && result.posBefore !== null) {
    if (result.posAfter < result.posBefore) return `<span class="week-song-chart up">#${result.posAfter} ▲${result.posBefore - result.posAfter}</span>`;
    if (result.posAfter > result.posBefore) return `<span class="week-song-chart down">#${result.posAfter} ▼${result.posAfter - result.posBefore}</span>`;
    return `<span class="week-song-chart steady">#${result.posAfter} —</span>`;
  }
  if (result.posBefore !== null) return `<span class="week-song-chart out">OUT</span>`;
  return `<span class="week-song-chart off">Off chart</span>`;
}

function managerNotes(state: GameState): string[] {
  const notes: string[] = [];
  if (state.cash < 0) notes.push(`Cash is negative (${formatMoney(state.cash)}). ${5 - state.debtWeeks} grace week${5 - state.debtWeeks === 1 ? "" : "s"} left before insolvency.`);
  for (const artist of state.artists.filter((item) => item.signed)) {
    if (artist.fatigue >= 75) notes.push(`${artist.name} is running hot — ${artist.fatigue}% fatigue. More studio or touring risks burnout.`);
    else if (artist.morale <= 30) notes.push(`${artist.name}'s morale is down to ${artist.morale}%. Unhappy artists can walk.`);
    else if (artist.contractWeeks > 0 && artist.contractWeeks <= 8) notes.push(`${artist.name}'s contract expires in ${artist.contractWeeks} week${artist.contractWeeks === 1 ? "" : "s"}.`);
  }
  return notes.slice(0, 4);
}

function showWeekReport(report: WeekReport, freshNews: NewsItem[], resolvedWeek: number, songResults: SongWeekResult[] = []): void {
  document.querySelector(".week-overlay")?.remove();
  if (!engine || engine.state.insolvent) return;
  const net = report.revenue - report.expenses;
  const verdict = weekVerdict(report, freshNews);
  const headlines = freshNews.slice(0, 4);
  const notes = managerNotes(engine.state);
  const overlay = document.createElement("div");
  overlay.className = `week-overlay verdict-${verdict.tone}`;
  overlay.innerHTML = `
    <div class="week-overlay-card" role="dialog" aria-modal="true" aria-label="Week ${resolvedWeek} results">
      <header class="week-overlay-head">
        <span class="week-overlay-kicker">WEEK ${resolvedWeek} · THE RESULTS ARE IN</span>
        <h2>${verdict.title}</h2>
        <p>${verdict.sub}</p>
      </header>
      <div class="week-stats">
        <article style="--d:0ms"><small>REVENUE</small><b class="pos" data-countup="${report.revenue}" data-prefix="+€">+€0</b></article>
        <article style="--d:120ms"><small>EXPENSES</small><b class="neg" data-countup="${report.expenses}" data-prefix="-€">-€0</b></article>
        <article style="--d:240ms"><small>NET RESULT</small><b class="${net >= 0 ? "pos" : "neg"}" data-countup="${Math.abs(net)}" data-prefix="${net >= 0 ? "+€" : "-€"}">€0</b></article>
        <article style="--d:360ms"><small>NEW FANS</small><b data-countup="${report.fanGrowth}" data-prefix="+">+0</b></article>
      </div>
      ${report.peakChart ? `<div class="week-chart-flash" style="--d:480ms"><span>◆</span><b>Chart peak: #${report.peakChart}</b><small>Global Pulse Top 20</small></div>` : ""}
      ${songResults.length ? `<div class="week-songs"><span class="week-section-label" style="--d:520ms">YOUR RELEASES</span>${songResults.map((result, index) => `<article style="--d:${580 + index * 100}ms"><span class="week-song-cover" style="background-image:url('${result.cover}')"></span><div class="week-song-id"><b>${escapeHtml(result.title)}</b><small>${escapeHtml(result.artist)}</small></div><div class="week-song-nums"><b>+${formatNumber(result.streamsGained)} streams</b><small>${formatMoney(result.earned)} earned</small></div>${chartMovementBadge(result)}</article>`).join("")}</div>` : ""}
      ${notes.length ? `<div class="week-notes"><span class="week-section-label" style="--d:${600 + songResults.length * 100}ms">MANAGER'S NOTES</span>${notes.map((note, index) => `<article style="--d:${650 + songResults.length * 100 + index * 90}ms"><span>!</span><p>${escapeHtml(note)}</p></article>`).join("")}</div>` : ""}
      ${headlines.length ? `<div class="week-headlines">${headlines.map((item, index) => `<article class="${item.tone}" style="--d:${680 + songResults.length * 100 + notes.length * 90 + index * 110}ms"><i></i><p>${escapeHtml(item.text)}</p></article>`).join("")}</div>` : ""}
      <footer class="week-overlay-foot" style="--d:${760 + songResults.length * 100 + notes.length * 90 + headlines.length * 110}ms">
        <button class="button button-primary button-large" data-game-action="dismiss-report">Plan week ${resolvedWeek + 1} →</button>
        ${engine.state.pendingEvent ? '<p class="week-overlay-note">⚠ A decision is waiting on your desk.</p>' : ""}
      </footer>
    </div>`;
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });
  gameRoot().appendChild(overlay);
  audioService.cue(verdict.tone === "bad" ? "error" : "success");
  runCountUps(overlay);
  overlay.querySelector<HTMLButtonElement>('[data-game-action="dismiss-report"]')?.focus({ preventScroll: true });
}

function runCountUps(scope: HTMLElement): void {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  scope.querySelectorAll<HTMLElement>("[data-countup]").forEach((element) => {
    const target = Number(element.dataset.countup || 0);
    const prefix = element.dataset.prefix || "";
    const render = (value: number): void => {
      element.textContent = `${prefix}${formatNumber(Math.round(value))}`;
    };
    if (reduced || target <= 0) {
      render(target);
      return;
    }
    const duration = 900;
    const start = performance.now();
    const tick = (now: number): void => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      render(target * eased);
      if (progress < 1 && element.isConnected) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function showToast(message: string, danger = false): void {
  const toast = document.querySelector<HTMLElement>("#game-toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.toggle("danger", danger);
  toast.classList.add("is-visible");
  audioService.cue(danger ? "error" : "success");
  window.setTimeout(() => toast.classList.remove("is-visible"), 4200);
}

function gameRoot(): HTMLElement {
  const root = document.querySelector<HTMLElement>("#game-ui");
  if (!root) throw new Error("Game UI root missing.");
  return root;
}

function navButton(view: GameView, icon: string, label: string): string {
  return `<button class="${currentView === view ? "active" : ""}" data-view="${view}"><span>${icon}</span>${label}</button>`;
}

function artistCard(artist: GameState["artists"][number]): string {
  const coverUrl = getArtistLogo(artist.name, artist.genre);
  return `<article><div class="talent-avatar small" style="background-image: url('${coverUrl}')"><b>${initials(artist.name)}</b></div><div><b>${escapeHtml(artist.name)}</b><small>${artist.genre} · Buzz ${artist.buzz}</small></div><span>${artist.morale}% morale</span></article>`;
}

function nextMoveTitle(state: GameState): string {
  if (!state.artists.some((artist) => artist.signed)) return "Sign your first artist";
  if (!state.songs.length) return "Book a studio session";
  if (!state.songs.some((song) => song.status === "released")) return "Schedule your first release";
  if (!state.campaigns.length) return "Launch a focused campaign";
  return "Advance the week";
}

function nextMoveContent(state: GameState): string {
  if (!state.artists.some((artist) => artist.signed)) return `<p>Scout affordable talent. The advance is four weeks of artist cost.</p><button class="button button-primary" data-view="scout">Open scouting →</button>`;
  if (!state.songs.length) return `<p>A healthy artist is ready to turn an idea into your first master.</p><button class="button button-primary" data-view="studio">Book studio →</button>`;
  if (!state.songs.some((song) => song.status === "released")) return `<p>Your first master is waiting. Release it before the market moves.</p><button class="button button-primary" data-view="studio">Release music →</button>`;
  if (!state.campaigns.length) return `<p>Choose one channel and a budget that protects your runway.</p><button class="button button-primary" data-view="marketing">Build campaign →</button>`;
  return `<p>Your campaigns are active. Resolve the market and study the result.</p><button class="button button-primary" data-game-action="end-week">Advance week →</button>`;
}

function emptyAction(title: string, copy: string, button: string, view: GameView): string {
  return `<div class="empty-state game-empty"><span>◇</span><h2>${title}</h2><p>${copy}</p><button class="button button-primary" data-view="${view}">${button}</button></div>`;
}

function getGenreImage(genre: string): string {
  const normalized = genre.toLowerCase();
  if (normalized.includes("soul") || normalized.includes("r&b") || normalized.includes("disco")) {
    return "/images/genre_synth_soul.png";
  }
  if (normalized.includes("pop") || normalized.includes("dance") || normalized.includes("ballad")) {
    return "/images/genre_neon_pop.png";
  }
  if (normalized.includes("rock") || normalized.includes("folk")) {
    return "/images/genre_alt_rock.png";
  }
  return "/images/genre_cloud_rap.png";
}

function getArtistLogo(artist: string, genre: string): string {
  const nameLower = artist.toLowerCase();
  if (nameLower.includes("glass satellites") || nameLower.includes("satellites")) {
    return "/images/logo_glass_satellites.png";
  }
  if (nameLower.includes("chrome") || nameLower.includes("lotus")) {
    return "/images/logo_chrome_lotus.png";
  }
  if (nameLower.includes("velvet") || nameLower.includes("circuit")) {
    return "/images/logo_velvet_circuit.png";
  }
  if (nameLower.includes("star") || nameLower.includes("wave")) {
    return "/images/logo_starwave.png";
  }
  
  const normGenre = genre.toLowerCase();
  if (normGenre.includes("rock") || normGenre.includes("metal")) {
    return "/images/portrait_rock_guitarist.png";
  }
  if (normGenre.includes("rap") || normGenre.includes("hip")) {
    return "/images/portrait_rap_star.png";
  }
  if (normGenre.includes("pop")) {
    return "/images/portrait_pop_diva.png";
  }
  if (normGenre.includes("electronic") || normGenre.includes("dance") || normGenre.includes("house")) {
    return "/images/portrait_electronic_dj.png";
  }
  if (normGenre.includes("soul") || normGenre.includes("r&b") || normGenre.includes("jazz")) {
    return "/images/portrait_soul_singer.png";
  }
  if (normGenre.includes("indie") || normGenre.includes("alt") || normGenre.includes("folk")) {
    return "/images/portrait_indie_singer.png";
  }

  let hash = 0;
  for (let i = 0; i < artist.length; i++) {
    hash = artist.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 45) % 360;
  
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
    <defs>
      <linearGradient id='grad-${Math.abs(hash)}' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' stop-color='hsl(${h1}, 75%, 45%)' />
        <stop offset='100%' stop-color='hsl(${h2}, 75%, 30%)' />
      </linearGradient>
    </defs>
    <rect width='100' height='100' fill='url(#grad-${Math.abs(hash)})' />
    <circle cx='50' cy='50' r='32' fill='none' stroke='%23ffffff' stroke-width='1.5' stroke-opacity='0.25' />
    <circle cx='50' cy='50' r='18' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.15' />
    <path d='M25,50 L75,50' stroke='%23ffffff' stroke-width='0.75' stroke-opacity='0.2' />
    <path d='M50,25 L50,75' stroke='%23ffffff' stroke-width='0.75' stroke-opacity='0.2' />
  </svg>`;
  return `data:image/svg+xml;utf8,${svg}`;
}



function getLabelLogo(label: string): string {
  const name = label.toLowerCase();
  if (name.includes("chrome") || name.includes("lotus")) return "/images/logo_chrome_lotus.png";
  if (name.includes("velvet") || name.includes("circuit")) return "/images/logo_velvet_circuit.png";
  if (name.includes("star") || name.includes("wave")) return "/images/logo_starwave.png";
  if (name.includes("glass") || name.includes("harbor")) return "/images/logo_glass_satellites.png";
  return "/images/logo.png";
}

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function logoMarkup(logo: string, labelName: string): string {
  if (logo.startsWith("/api/assets/")) return `<span class="logo-preview uploaded-logo"><img src="${escapeHtml(logo)}" alt="${escapeHtml(labelName)} logo"></span>`;
  return `<span class="logo-preview ${escapeHtml(logo)}">${initials(labelName)}</span>`;
}

function signedNumber(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "recently" : new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

function challengeCard(state: GameState): string {
  if (!state.challengeId) return "";
  const challenge = challengeScenarios.find((item) => item.id === state.challengeId);
  if (!challenge) return "";
  const peaks = state.songs.map((song) => song.peakPosition || 100);
  const streams = state.songs.reduce((sum, song) => sum + song.streams, 0);
  const radioUsed = state.campaigns.some((campaign) => campaign.type === "radio");
  let progress = 0;
  let detail: string = challenge.target;
  if (state.challengeId === "rescue") { progress = state.cash > 0 ? 100 : Math.max(0, 100 + state.cash / 450); detail = `${formatMoney(state.cash)} cash · week ${state.week}/16`; }
  if (state.challengeId === "idol-global") { progress = state.fanbase / 1500; detail = `${formatNumber(state.fanbase)} / 150K fans`; }
  if (state.challengeId === "tiny-budget") { progress = peaks.some((peak) => peak <= 20) ? 100 : Math.min(90, state.songs.length * 35); detail = peaks.length ? `Best peak #${Math.min(...peaks)}` : "Record the first single"; }
  if (state.challengeId === "legacy") { progress = peaks.some((peak) => peak <= 10) ? 100 : Math.min(90, state.reputation); detail = peaks.length ? `Best comeback #${Math.min(...peaks)}` : "Build comeback buzz"; }
  if (state.challengeId === "scandal") { progress = state.reputation * 2; detail = `${state.reputation} / 50 reputation`; }
  if (state.challengeId === "sound-prize") { progress = state.awardsWon ? 100 : Math.min(90, state.credibility); detail = `${state.awardsWon} awards · ${state.credibility} credibility`; }
  if (state.challengeId === "fanclubs") { progress = radioUsed ? 0 : state.fanbase / 1000; detail = `${formatNumber(state.fanbase)} / 100K fans${radioUsed ? " · radio used" : ""}`; }
  if (state.challengeId === "streaming") { progress = streams / 50_000; detail = `${formatNumber(streams)} / 5M streams`; }
  if (state.challengeId === "viral-career") { const hits = peaks.filter((peak) => peak <= 20).length; progress = hits * 50; detail = `${hits} / 2 Top 20 songs`; }
  if (state.challengeId === "boutique") { progress = Math.min(100, state.credibility / .85); detail = `${state.credibility} / 85 credibility · ${formatMoney(state.cash)}`; }
  progress = Math.max(0, Math.min(100, progress));
  return `<section class="challenge-status ${progress >= 100 ? "complete" : ""}"><div><span>CHALLENGE ${progress >= 100 ? "COMPLETE" : "ACTIVE"}</span><h2>${escapeHtml(challenge.name)}</h2><p>${escapeHtml(detail)}</p></div><i><em style="width:${progress}%"></em></i><b>${Math.round(progress)}%</b></section>`;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en", { style: "currency", currency: "EUR", maximumFractionDigits: 0, notation: Math.abs(value) >= 1_000_000 ? "compact" : "standard" }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en", { notation: value >= 10_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

function quality(): "high" | "balanced" | "battery" {
  const value = localStorage.getItem("chart-empire-quality");
  return value === "high" || value === "battery" ? value : "balanced";
}

function greeting(): string {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}
