import "../styles/global.css";
import "../styles/marketing.css";
import "../styles/game.css";
import { bindGlobalControls, setupScrollReveal, triggerAdsterraLoads, resetAdTracking } from "../web/components";
import { bindContentPage, contentPage, homePage, notFoundPage } from "../web/pages";
import { playPage, setupPlayPage } from "../web/playPage";
import { addStructuredData, applySEO } from "../web/SEO";
import { siteConfig } from "../config/siteConfig";

const app = document.querySelector<HTMLElement>("#app") as HTMLElement | null;
if (!app) throw new Error("Application root not found.");
const appRoot: HTMLElement = app;

const routeMeta: Record<string, [string, string, string]> = {
  "/": ["Chart Empire: The Music Label Manager | Free Browser Game", "Build a fictional music label, sign artists, release songs, and dominate the charts in Chart Empire — the ultimate free browser music management game.", "music label game, music management game, free browser game"],
  "/play": ["Play Chart Empire — Free Music Label Game", "Start a guest career in Chart Empire, the free music label management browser game. No download required.", "play music game online, music management game, free browser game"],
  "/guide": ["Chart Empire Game Guide — Strategy, Scouting, Recording & Charts", "Learn how scouting, recording, releases, promotion, charts, cashflow, and AI rival labels work in Chart Empire.", "game guide, music management strategy, scouting tips, chart strategy"],
  "/how-the-music-industry-works": ["How the Music Industry Works — Labels, Streaming, Radio & Promotion", "A practical guide to record labels, artist management, streaming discovery, radio promotion, press outreach, touring, and fan communities.", "music industry explained, record labels, streaming, radio promotion, artist management"],
  "/music-promotion": ["Independent Music Promotion — Radio, Press, Release Strategy", "Learn release planning, radio promotion, press outreach, artist positioning, and campaign reporting for independent musicians.", "music promotion, radio promotion, press outreach, release strategy, indie music marketing"],
  "/xing-records": ["Xing Records — Independent Music Showcase", "Explore the Xing Records Song of the Week and discover independent music releases.", "xing records, independent music, song of the week, indie releases"],
  "/song-of-the-week": ["Song of the Week — Xing Records Feature", "Watch the featured Xing Records Song of the Week spotlight.", "song of the week, xing records, independent music feature"],
  "/leaderboards": ["Chart Empire Leaderboards — Music Label Game Rankings", "View public Chart Empire label rankings, verified career scores, and competitive season results.", "chart empire leaderboards, music label rankings, management game scores"],
  "/challenges": ["Music Management Game Challenges — 10 Strategy Scenarios", "Take on ten focused music label management challenge scenarios in Chart Empire.", "management game challenges, strategy scenarios, music label game"],
  "/privacy": ["Privacy Policy — Chart Empire", "How local saves, cloud accounts, uploads, advertising, and data work in Chart Empire.", "privacy policy, chart empire privacy"],
  "/terms": ["Terms of Use — Chart Empire", "Terms for using the fictional Chart Empire browser game.", "terms of use, chart empire terms"],
  "/contact": ["Contact Chart Empire — Game Feedback & Music Promotion", "Contact the Chart Empire team about the game, Xing Records, or indie music promotion campaigns.", "contact chart empire, game feedback, indie music promotion contact"],
  "/admin": ["Admin — Chart Empire", "Restricted Chart Empire administration placeholder.", "admin"]
};

async function render(): Promise<void> {
  resetAdTracking();
  const path = normalizePath(window.location.pathname);
  if (path === "/") appRoot.innerHTML = homePage();
  else if (path === "/play") appRoot.innerHTML = playPage();
  else if (routeMeta[path]) appRoot.innerHTML = contentPage(path);
  else appRoot.innerHTML = notFoundPage(path);

  const [title, description, keywords] = routeMeta[path] || ["Page Not Found", "The requested Chart Empire page could not be found.", ""];
  applySEO({ title, description, path, keywords });
  
  const breadcrumbList = {
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": siteConfig.siteUrl }
    ]
  };

  if (path !== "/" && path !== "/play") {
    breadcrumbList.itemListElement.push({
      "@type": "ListItem",
      "position": 2,
      "name": ((title || "Page Not Found").split(" |")[0] || "").split(" —")[0] || "Home",
      "item": new URL(path, siteConfig.siteUrl).toString()
    });
  }

  addStructuredData(path === "/" ? {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", name: "Chart Empire", url: siteConfig.siteUrl, description, potentialAction: { "@type": "SearchAction", target: `${siteConfig.siteUrl}/?q={search_term_string}`, "query-input": "required name=search_term_string" } },
      { "@type": "VideoGame", name: "Chart Empire: The Music Label Manager", applicationCategory: "Game", gamePlatform: "Web browser", genre: ["Management simulation", "Strategy", "Music"], playMode: "SinglePlayer", isAccessibleForFree: true, description, url: `${siteConfig.siteUrl}/play`, operatingSystem: "Any" },
      { "@type": "Organization", name: "Chart Empire", url: siteConfig.siteUrl, logo: `${siteConfig.siteUrl}/images/logo.png`, sameAs: ["https://www.xingrecords.com"] },
      { "@type": "FAQPage", mainEntity: [
        { "@type": "Question", name: "What is Chart Empire?", acceptedAnswer: { "@type": "Answer", text: "Chart Empire is a free browser-based music label management game where you build a fictional record label, sign artists, release songs, and compete on the charts." } },
        { "@type": "Question", name: "Is Chart Empire free to play?", acceptedAnswer: { "@type": "Answer", text: "Yes, Chart Empire is completely free to play with no downloads required. Guest saves are stored locally on your device." } },
        { "@type": "Question", name: "How do I play Chart Empire?", acceptedAnswer: { "@type": "Answer", text: "Visit the play page, name your label, choose a starting market and difficulty, then begin scouting artists, recording songs, and building your music empire." } }
      ] },
      breadcrumbList
    ]
  } : { "@context": "https://schema.org", "@graph": [{ "@type": "WebPage", name: title, description, url: new URL(path, siteConfig.siteUrl).toString() }, breadcrumbList] });

  bindGlobalControls(() => void render());
  bindContentPage(path);
  bindNavigation();
  if (path === "/play") await setupPlayPage();
  window.scrollTo({ top: 0, behavior: "instant" });
  setupScrollReveal();
  triggerAdsterraLoads();
}

function bindNavigation(): void {
  document.querySelectorAll<HTMLAnchorElement>("a[data-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const url = new URL(link.href);
      if (url.origin !== window.location.origin) return;
      event.preventDefault();
      history.pushState({}, "", url.pathname + url.search);
      void render();
    });
  });
}

function normalizePath(path: string): string {
  if (path === "/") return path;
  return path.replace(/\/+$/, "");
}

window.addEventListener("popstate", () => void render());

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => undefined));
}

void render();
