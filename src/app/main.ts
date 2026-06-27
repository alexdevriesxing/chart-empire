import "../styles/global.css";
import "../styles/marketing.css";
import "../styles/game.css";
import { bindGlobalControls, triggerAdsterraLoads } from "../web/components";
import { bindContentPage, contentPage, cookiePage, homePage, notFoundPage } from "../web/pages";
import { playPage, setupPlayPage } from "../web/playPage";
import { addStructuredData, applySEO } from "../web/SEO";
import { siteConfig } from "../config/siteConfig";

const app = document.querySelector<HTMLElement>("#app") as HTMLElement | null;
if (!app) throw new Error("Application root not found.");
const appRoot: HTMLElement = app;

const routeMeta: Record<string, [string, string]> = {
  "/": ["Chart Empire: The Music Label Manager", "Build a fictional music label, sign artists, release songs, and rule the charts in a free browser management game."],
  "/play": ["Play Chart Empire", "Start a guest career in the free Chart Empire music label management game."],
  "/guide": ["Game Guide", "Learn how scouting, recording, releases, promotion, charts, cashflow, and AI labels work in Chart Empire."],
  "/how-the-music-industry-works": ["How the Music Industry Works", "A practical guide to labels, artist management, streaming, radio, press, touring, and music promotion."],
  "/music-promotion": ["Independent Music Promotion", "Learn about release planning, radio promotion, press outreach, artist positioning, and campaign reporting."],
  "/xing-records": ["Discover Xing Records", "Explore the Xing Records Song of the Week and independent release showcase."],
  "/song-of-the-week": ["Song of the Week", "Watch the consent-aware Xing Records Song of the Week feature."],
  "/leaderboards": ["Music Label Game Leaderboards", "View public Chart Empire label rankings and career results."],
  "/challenges": ["Music Management Challenges", "Take on ten focused music label management scenarios."],
  "/privacy": ["Privacy Policy", "How local saves, cloud accounts, uploads, ads, consent choices, and contact data work."],
  "/cookies": ["Cookie Settings", "Control analytics, ads, personalized ads, external media, and functional storage."],
  "/terms": ["Terms of Use", "Terms for using the fictional Chart Empire browser game."],
  "/contact": ["Contact", "Contact Chart Empire, Xing Records, or Indie Music Promotion."],
  "/admin": ["Admin", "Restricted Chart Empire administration placeholder."]
};

async function render(): Promise<void> {
  const path = normalizePath(window.location.pathname);
  if (path === "/") appRoot.innerHTML = homePage();
  else if (path === "/play") appRoot.innerHTML = playPage();
  else if (path === "/cookies") appRoot.innerHTML = cookiePage();
  else if (routeMeta[path]) appRoot.innerHTML = contentPage(path);
  else appRoot.innerHTML = notFoundPage(path);

  const [title, description] = routeMeta[path] || ["Page Not Found", "The requested Chart Empire page could not be found."];
  applySEO({ title, description, path });
  addStructuredData(path === "/" ? {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", name: "Chart Empire", url: siteConfig.siteUrl, description },
      { "@type": "VideoGame", name: "Chart Empire: The Music Label Manager", applicationCategory: "Game", gamePlatform: "Web browser", genre: ["Management simulation", "Strategy"], playMode: "SinglePlayer", isAccessibleForFree: true },
      { "@type": "Organization", name: "Chart Empire", url: siteConfig.siteUrl }
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
window.addEventListener("consentchange", () => {
  if (window.location.pathname !== "/play") void render();
});

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => undefined));
}

void render();
