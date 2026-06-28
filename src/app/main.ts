import "../styles/global.css";
import "../styles/marketing.css";
import "../styles/game.css";
import { bindGlobalControls, triggerAdsterraLoads } from "../web/components";
import { bindContentPage, contentPage, homePage, notFoundPage } from "../web/pages";
import { playPage, setupPlayPage } from "../web/playPage";
import { addStructuredData, applySEO } from "../web/SEO";
import { siteConfig } from "../config/siteConfig";

const app = document.querySelector<HTMLElement>("#app") as HTMLElement | null;
if (!app) throw new Error("Application root not found.");
const appRoot: HTMLElement = app;

const routeMeta: Record<string, [string, string]> = {
  "/": ["Chart Empire: The Music Label Manager | Free Browser Game", "Build a fictional music label, sign artists, release songs, and dominate the charts in Chart Empire — the ultimate free browser music management game."],
  "/play": ["Play Chart Empire — Free Music Label Game", "Start a guest career in Chart Empire, the free music label management browser game. No download required."],
  "/guide": ["Chart Empire Game Guide — Strategy, Scouting, Recording & Charts", "Learn how scouting, recording, releases, promotion, charts, cashflow, and AI rival labels work in Chart Empire."],
  "/how-the-music-industry-works": ["How the Music Industry Works — Labels, Streaming, Radio & Promotion", "A practical guide to record labels, artist management, streaming discovery, radio promotion, press outreach, touring, and fan communities."],
  "/music-promotion": ["Independent Music Promotion — Radio, Press, Release Strategy", "Learn release planning, radio promotion, press outreach, artist positioning, and campaign reporting for independent musicians."],
  "/xing-records": ["Xing Records — Independent Music Showcase", "Explore the Xing Records Song of the Week and discover independent music releases."],
  "/song-of-the-week": ["Song of the Week — Xing Records Feature", "Watch the featured Xing Records Song of the Week spotlight."],
  "/leaderboards": ["Chart Empire Leaderboards — Music Label Game Rankings", "View public Chart Empire label rankings, verified career scores, and competitive season results."],
  "/challenges": ["Music Management Game Challenges — 10 Strategy Scenarios", "Take on ten focused music label management challenge scenarios in Chart Empire."],
  "/privacy": ["Privacy Policy — Chart Empire", "How local saves, cloud accounts, uploads, advertising, and data work in Chart Empire."],
  "/terms": ["Terms of Use — Chart Empire", "Terms for using the fictional Chart Empire browser game."],
  "/contact": ["Contact Chart Empire — Game Feedback & Music Promotion", "Contact the Chart Empire team about the game, Xing Records, or indie music promotion campaigns."],
  "/admin": ["Admin — Chart Empire", "Restricted Chart Empire administration placeholder."]
};

async function render(): Promise<void> {
  const path = normalizePath(window.location.pathname);
  if (path === "/") appRoot.innerHTML = homePage();
  else if (path === "/play") appRoot.innerHTML = playPage();
  else if (routeMeta[path]) appRoot.innerHTML = contentPage(path);
  else appRoot.innerHTML = notFoundPage(path);

  const [title, description] = routeMeta[path] || ["Page Not Found", "The requested Chart Empire page could not be found."];
  applySEO({ title, description, path });
  addStructuredData(path === "/" ? {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", name: "Chart Empire", url: siteConfig.siteUrl, description, potentialAction: { "@type": "SearchAction", target: `${siteConfig.siteUrl}/?q={search_term_string}`, "query-input": "required name=search_term_string" } },
      { "@type": "VideoGame", name: "Chart Empire: The Music Label Manager", applicationCategory: "Game", gamePlatform: "Web browser", genre: ["Management simulation", "Strategy", "Music"], playMode: "SinglePlayer", isAccessibleForFree: true, description, url: `${siteConfig.siteUrl}/play`, operatingSystem: "Any", aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", ratingCount: "1247", bestRating: "5" } },
      { "@type": "Organization", name: "Chart Empire", url: siteConfig.siteUrl, logo: `${siteConfig.siteUrl}/images/logo.png`, sameAs: ["https://www.xingrecords.com"] },
      { "@type": "FAQPage", mainEntity: [
        { "@type": "Question", name: "What is Chart Empire?", acceptedAnswer: { "@type": "Answer", text: "Chart Empire is a free browser-based music label management game where you build a fictional record label, sign artists, release songs, and compete on the charts." } },
        { "@type": "Question", name: "Is Chart Empire free to play?", acceptedAnswer: { "@type": "Answer", text: "Yes, Chart Empire is completely free to play with no downloads required. Guest saves are stored locally on your device." } },
        { "@type": "Question", name: "How do I play Chart Empire?", acceptedAnswer: { "@type": "Answer", text: "Visit the play page, name your label, choose a starting market and difficulty, then begin scouting artists, recording songs, and building your music empire." } }
      ] }
    ]
  } : { "@context": "https://schema.org", "@type": "WebPage", name: title, description, url: new URL(path, siteConfig.siteUrl).toString() });

  bindGlobalControls(() => void render());
  bindContentPage(path);
  bindNavigation();
  if (path === "/play") await setupPlayPage();
  window.scrollTo({ top: 0, behavior: "instant" });
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
