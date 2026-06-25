import { adSlot, escapeHtml, header } from "./components";
import { markets, strategies } from "../game/data/content";
import { SimulationEngine } from "../game/systems/SimulationEngine";
import { SaveSystem } from "../game/systems/SaveSystem";
import type { Campaign, GameState, GameView, StrategyId, WeekReport } from "../types/game";

const saves = new SaveSystem();
let engine: SimulationEngine | null = null;
let currentView: GameView = "dashboard";

export function playPage(): string {
  return `${header()}<main id="main-content" class="play-page"><div id="phaser-stage" aria-hidden="true"></div><section id="game-ui" class="game-ui" aria-live="polite"><div class="game-loader"><span></span><p>Opening the label office…</p></div></section></main>`;
}

export async function setupPlayPage(): Promise<void> {
  const stage = document.querySelector<HTMLElement>("#phaser-stage");
  if (!stage) return;
  const { bootGame } = await import("../game/bootstrap");
  bootGame(stage);
  const saved = await saves.load();
  if (saved) {
    renderWelcomeBack(saved);
  } else {
    renderStart();
  }
  bindGameEvents();
}

function renderWelcomeBack(saved: GameState): void {
  gameRoot().innerHTML = `<div class="start-screen"><div class="start-card compact"><span class="eyebrow">Local career found</span><div class="logo-preview ${escapeHtml(saved.logo)}">${initials(saved.labelName)}</div><h1>Welcome back to ${escapeHtml(saved.labelName)}.</h1><p>Week ${saved.week} · ${saved.artists.filter((artist) => artist.signed).length} signed artists · ${formatMoney(saved.cash)} cash</p><div class="start-actions"><button class="button button-primary button-large" data-game-action="resume">Continue career</button><button class="button button-ghost" data-game-action="new">Start new label</button><button class="button button-ghost" data-game-action="export-saved">Export save</button></div></div></div>`;
}

function renderStart(): void {
  gameRoot().innerHTML = `
    <form id="new-game-form" class="start-screen">
      <div class="start-card">
        <span class="eyebrow">Guest quick start</span><h1>Name your next empire.</h1>
        <p>Your guest career is stored on this device. You can export it at any time.</p>
        <label class="field-label">Label name<input name="labelName" maxlength="40" required value="Electric North Records" autocomplete="organization"></label>
        <fieldset><legend>Choose a mark</legend><div class="logo-options">${["logo-cyan", "logo-magenta", "logo-gold", "logo-emerald"].map((logo, index) => `<label class="logo-choice"><input type="radio" name="logo" value="${logo}" ${index === 0 ? "checked" : ""}><span class="logo-preview ${logo}">EN</span></label>`).join("")}</div></fieldset>
        <fieldset><legend>Starting market</legend><div class="choice-pills">${markets.map((market, index) => `<label><input type="radio" name="market" value="${market}" ${index === 0 ? "checked" : ""}><span>${market}</span></label>`).join("")}</div></fieldset>
        <fieldset><legend>Label strategy</legend><div class="strategy-grid">${Object.entries(strategies).map(([id, strategy], index) => `<label class="strategy-choice"><input type="radio" name="strategy" value="${id}" ${index === 0 ? "checked" : ""}><span><b>${strategy.name}</b><small>${strategy.description}</small><em>${formatMoney(strategy.cash)} start</em></span></label>`).join("")}</div></fieldset>
        <button class="button button-primary button-large" type="submit">Open the office →</button>
      </div>
    </form>`;
}

function renderGame(): void {
  if (!engine) return;
  const state = engine.state;
  const signed = state.artists.filter((artist) => artist.signed);
  gameRoot().innerHTML = `
    <div class="game-shell">
      <aside class="game-sidebar">
        <div class="game-label"><div class="logo-preview ${escapeHtml(state.logo)}">${initials(state.labelName)}</div><div><strong>${escapeHtml(state.labelName)}</strong><small>${strategies[state.strategy].name}</small></div></div>
        <nav aria-label="Game sections">${navButton("dashboard", "⌂", "Dashboard")}${navButton("scout", "⌕", "Scout")}${navButton("roster", "★", "Artists")}${navButton("studio", "◉", "Studio")}${navButton("marketing", "↗", "Campaigns")}${navButton("charts", "▥", "Charts")}${navButton("finance", "€", "Finance")}</nav>
        <div class="sidebar-bottom"><button data-game-action="export">⇩ Export save</button><label class="import-label">⇧ Import save<input type="file" accept=".json,application/json" data-game-import></label><span>Guest save · this device</span></div>
      </aside>
      <section class="game-main">
        <header class="game-topbar"><button class="mobile-game-menu" data-game-action="toggle-menu" aria-label="Toggle game menu">☰</button><div class="week-chip"><span>WEEK</span><b>${state.week}</b></div><div class="resource"><small>Cash</small><b class="${state.cash < 0 ? "danger" : ""}">${formatMoney(state.cash)}</b></div><div class="resource"><small>Fans</small><b>${formatNumber(state.fanbase)}</b></div><div class="resource"><small>Reputation</small><b>${state.reputation}</b></div><button class="button button-primary advance-button" data-game-action="end-week">Advance week →</button></header>
        <div class="game-content">${renderView(currentView, signed)}</div>
      </section>
    </div>
    <div id="game-toast" class="game-toast" role="status"></div>`;
}

function renderView(view: GameView, signed: GameState["artists"]): string {
  if (!engine) return "";
  const state = engine.state;
  if (view === "dashboard") {
    const best = state.chart.find((entry) => entry.playerOwned);
    return `<div class="view-heading"><div><span class="eyebrow">Command center</span><h1>${greeting()}, boss.</h1><p>${state.news[0]?.text || "Your first week begins now."}</p></div><span class="market-chip">${state.market} HQ</span></div>
      <div class="metric-grid"><article><small>AVAILABLE CASH</small><b>${formatMoney(state.cash)}</b><span>${signed.length ? `${formatMoney(signed.reduce((sum, artist) => sum + artist.weeklyCost, 0))}/week roster cost` : "No roster costs yet"}</span></article><article><small>GLOBAL FANBASE</small><b>${formatNumber(state.fanbase)}</b><span>Build through releases</span></article><article><small>BEST CHART</small><b>${best ? `#${best.position}` : "—"}</b><span>${best ? escapeHtml(best.title) : "No release charted yet"}</span></article><article><small>LABEL HEAT</small><b>${state.reputation}%</b><span>${state.credibility}% credibility</span></article></div>
      <div class="dashboard-grid"><section class="game-panel"><div class="panel-title"><div><span>LIVE FEED</span><h2>Industry signal</h2></div></div><div class="game-news">${state.news.slice(0, 6).map((item) => `<article class="${item.tone}"><span>W${item.week}</span><p>${escapeHtml(item.text)}</p></article>`).join("")}</div></section>
      <section class="game-panel next-move"><div class="panel-title"><div><span>NEXT MOVE</span><h2>${nextMoveTitle(state)}</h2></div></div>${nextMoveContent(state)}</section></div>
      ${adSlot("Game dashboard sponsor", "game")}
      <section class="game-panel"><div class="panel-title"><div><span>ROSTER PULSE</span><h2>Signed artists</h2></div><button data-view="roster">View roster →</button></div>${signed.length ? `<div class="artist-row">${signed.slice(0, 4).map(artistCard).join("")}</div>` : `<div class="mini-empty"><p>No artists signed. Your scouts have 75 fictional prospects ready.</p><button class="button button-secondary" data-view="scout">Open scouting</button></div>`}</section>`;
  }
  if (view === "scout") {
    return `<div class="view-heading"><div><span class="eyebrow">A&R network</span><h1>Scout the next signal.</h1><p>Balance talent and appeal against weekly cost. Signing advances equal four weeks of cost.</p></div></div><div class="card-grid">${engine.scoutCandidates().map((artist) => `<article class="talent-card"><div class="talent-avatar">${initials(artist.name)}</div><div><span>${artist.genre} · ${artist.market}</span><h2>${escapeHtml(artist.name)}</h2></div><div class="talent-stats"><label>Talent <b>${artist.talent}</b><i><em style="width:${artist.talent}%"></em></i></label><label>Appeal <b>${artist.appeal}</b><i><em style="width:${artist.appeal}%"></em></i></label><label>Buzz <b>${artist.buzz}</b><i><em style="width:${artist.buzz}%"></em></i></label></div><footer><span><small>WEEKLY COST</small><b>${formatMoney(artist.weeklyCost)}</b></span><button class="button button-primary" data-game-action="sign" data-id="${artist.id}">Sign · ${formatMoney(artist.weeklyCost * 4)}</button></footer></article>`).join("")}</div>`;
  }
  if (view === "roster") {
    return `<div class="view-heading"><div><span class="eyebrow">Artist development</span><h1>Your roster.</h1><p>Morale and fatigue influence sessions, campaigns, and long-term performance.</p></div></div>${signed.length ? `<div class="card-grid">${signed.map((artist) => `<article class="talent-card signed"><div class="talent-avatar">${initials(artist.name)}</div><div><span>${artist.genre} · ${artist.market}</span><h2>${escapeHtml(artist.name)}</h2></div><div class="talent-stats"><label>Morale <b>${artist.morale}</b><i><em style="width:${artist.morale}%"></em></i></label><label>Fatigue <b>${artist.fatigue}</b><i class="fatigue"><em style="width:${artist.fatigue}%"></em></i></label><label>Buzz <b>${artist.buzz}</b><i><em style="width:${artist.buzz}%"></em></i></label></div><footer><span><small>CATALOG</small><b>${state.songs.filter((song) => song.artistId === artist.id).length} songs</b></span><button class="button button-secondary" data-view="studio">Book studio</button></footer></article>`).join("")}</div>` : emptyAction("No artists on the roster.", "Scout and sign a prospect before booking studio time.", "Scout artists", "scout")}`;
  }
  if (view === "studio") {
    return `<div class="view-heading"><div><span class="eyebrow">Recording complex</span><h1>Turn ideas into masters.</h1><p>Every session costs €18K plus a talent-based production fee and adds fatigue.</p></div></div>${signed.length ? `<div class="studio-grid"><section class="game-panel"><div class="panel-title"><div><span>BOOK A SESSION</span><h2>Choose an artist</h2></div></div><div class="studio-artists">${signed.map((artist) => `<button data-game-action="record" data-id="${artist.id}"><span class="talent-avatar small">${initials(artist.name)}</span><span><b>${escapeHtml(artist.name)}</b><small>${artist.genre} · Morale ${artist.morale}% · Fatigue ${artist.fatigue}%</small></span><em>${formatMoney(18000 + artist.talent * 120)}</em></button>`).join("")}</div></section><section class="game-panel"><div class="panel-title"><div><span>MASTERS</span><h2>Recorded songs</h2></div></div>${state.songs.length ? `<div class="song-list">${state.songs.map((song) => `<article><div><span>${song.status}</span><b>${escapeHtml(song.title)}</b><small>${escapeHtml(state.artists.find((artist) => artist.id === song.artistId)?.name || "")} · Quality ${song.quality}%</small></div>${song.status === "recorded" ? `<button class="button button-primary" data-game-action="release" data-id="${song.id}">Release</button>` : `<em>${formatNumber(song.streams)} streams</em>`}</article>`).join("")}</div>` : `<div class="mini-empty"><p>No masters recorded yet.</p></div>`}</section></div>` : emptyAction("The studio is silent.", "Sign an artist before booking a recording session.", "Scout artists", "scout")}`;
  }
  if (view === "marketing") {
    const released = state.songs.filter((song) => song.status === "released");
    return `<div class="view-heading"><div><span class="eyebrow">Campaign room</span><h1>Create qualified attention.</h1><p>Campaigns remain active for four weekly resolutions. Spend does not guarantee a hit.</p></div></div>${released.length ? `<div class="campaign-grid">${released.map((song) => `<article class="game-panel campaign-card"><div><span>RELEASED W${song.releaseWeek}</span><h2>${escapeHtml(song.title)}</h2><p>${formatNumber(song.streams)} streams · ${formatNumber(song.radioSpins)} radio spins</p></div><label>Campaign channel<select data-campaign-type="${song.id}"><option value="social">Social burst</option><option value="playlist">Playlist pitching</option><option value="radio">Radio promotion</option><option value="press">Press outreach</option><option value="fanclub">Fan-club activation</option></select></label><label>Budget<select data-campaign-spend="${song.id}"><option value="5000">€5K focused</option><option value="15000">€15K regional</option><option value="40000">€40K major push</option></select></label><button class="button button-primary" data-game-action="campaign" data-id="${song.id}">Launch campaign</button></article>`).join("")}</div>` : emptyAction("Nothing to promote yet.", "Record and release a song before launching a campaign.", "Go to studio", "studio")}`;
  }
  if (view === "charts") {
    return `<div class="view-heading"><div><span class="eyebrow">Global Pulse Top 20</span><h1>The world chart.</h1><p>A fictional weekly chart combining quality, audience fit, buzz, campaigns, decay, and volatility.</p></div></div>${state.chart.length ? `<section class="game-panel chart-table"><div class="chart-head"><span>#</span><span>Release</span><span>Label</span><span>Score</span></div>${state.chart.map((entry) => `<article class="${entry.playerOwned ? "player-entry" : ""}"><b>${entry.position}</b><div><strong>${escapeHtml(entry.title)}</strong><small>${escapeHtml(entry.artist)}</small></div><span>${escapeHtml(entry.label)}</span><em>${entry.score}</em></article>`).join("")}</section>` : emptyAction("The chart updates after a release week.", "Release music and advance the week to see how it competes.", "Go to studio", "studio")}`;
  }
  const weeklyCosts = signed.reduce((sum, artist) => sum + artist.weeklyCost, 0);
  const totalRevenue = state.songs.reduce((sum, song) => sum + Math.round(song.streams * 0.0035 + song.radioSpins * 2.1), 0);
  return `<div class="view-heading"><div><span class="eyebrow">Finance office</span><h1>Cash is creative oxygen.</h1><p>Runway matters more than vanity metrics. Every signing adds a recurring commitment.</p></div></div><div class="metric-grid finance"><article><small>CASH</small><b>${formatMoney(state.cash)}</b></article><article><small>WEEKLY ROSTER COST</small><b>${formatMoney(weeklyCosts)}</b></article><article><small>CATALOG REVENUE</small><b>${formatMoney(totalRevenue)}</b></article><article><small>RUNWAY</small><b>${weeklyCosts ? `${Math.max(0, Math.floor(state.cash / weeklyCosts))} weeks` : "∞"}</b></article></div><section class="game-panel"><div class="panel-title"><div><span>CATALOG</span><h2>Revenue assets</h2></div></div>${state.songs.length ? `<div class="song-list">${state.songs.map((song) => `<article><div><span>${song.status}</span><b>${escapeHtml(song.title)}</b><small>Quality ${song.quality} · ${formatNumber(song.streams)} streams · ${formatNumber(song.radioSpins)} spins</small></div><em>${formatMoney(song.streams * 0.0035 + song.radioSpins * 2.1)}</em></article>`).join("")}</div>` : `<div class="mini-empty"><p>Your catalog has no recorded assets.</p></div>`}</section>`;
}

function bindGameEvents(): void {
  gameRoot().addEventListener("submit", async (event) => {
    if (!(event.target instanceof HTMLFormElement) || event.target.id !== "new-game-form") return;
    event.preventDefault();
    const data = new FormData(event.target);
    engine = SimulationEngine.create({
      labelName: String(data.get("labelName") || ""),
      logo: String(data.get("logo") || "logo-cyan"),
      strategy: String(data.get("strategy") || "indie") as StrategyId,
      market: String(data.get("market") || markets[0])
    });
    await saves.save(engine.state);
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
      if (action === "sign" && target.dataset.id) engine.signArtist(target.dataset.id);
      if (action === "record" && target.dataset.id) engine.recordSong(target.dataset.id);
      if (action === "release" && target.dataset.id) engine.releaseSong(target.dataset.id);
      if (action === "campaign" && target.dataset.id) {
        const type = document.querySelector<HTMLSelectElement>(`[data-campaign-type="${target.dataset.id}"]`)?.value as Campaign["type"];
        const spend = Number(document.querySelector<HTMLSelectElement>(`[data-campaign-spend="${target.dataset.id}"]`)?.value || 5000);
        engine.launchCampaign(target.dataset.id, type, spend);
      }
      if (action === "end-week") {
        const report = engine.endWeek();
        window.dispatchEvent(new CustomEvent<WeekReport>("chart-empire-week", { detail: report }));
        await saves.save(engine.state);
        renderGame();
        showReport(report);
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
      await saves.save(engine.state);
      renderGame();
      showToast("Career saved on this device.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "That action could not be completed.", true);
    }
  });

  gameRoot().addEventListener("change", async (event) => {
    const input = (event.target as HTMLElement).closest<HTMLInputElement>("[data-game-import]");
    if (!input?.files?.[0]) return;
    try {
      engine = new SimulationEngine(await saves.import(input.files[0]));
      currentView = "dashboard";
      renderGame();
      showToast("Save imported.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Import failed.", true);
    }
  });
}

function showReport(report: WeekReport): void {
  showToast(`Week resolved · ${formatMoney(report.revenue)} revenue · ${formatMoney(report.expenses)} expenses · +${formatNumber(report.fanGrowth)} fans${report.peakChart ? ` · Peak #${report.peakChart}` : ""}`);
}

function showToast(message: string, danger = false): void {
  const toast = document.querySelector<HTMLElement>("#game-toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.toggle("danger", danger);
  toast.classList.add("is-visible");
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
  return `<article><div class="talent-avatar small">${initials(artist.name)}</div><div><b>${escapeHtml(artist.name)}</b><small>${artist.genre} · Buzz ${artist.buzz}</small></div><span>${artist.morale}% morale</span></article>`;
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

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en", { style: "currency", currency: "EUR", maximumFractionDigits: 0, notation: Math.abs(value) >= 1_000_000 ? "compact" : "standard" }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en", { notation: value >= 10_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

function greeting(): string {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}
