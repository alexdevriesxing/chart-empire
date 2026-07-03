// Shared per-route SEO metadata used by the static route generator.
// Keep titles under ~60 chars and descriptions ~150-160 chars for search snippets.
export const SITE_URL = "https://www.chartempiregame.com";
export const OG_IMAGE = `${SITE_URL}/images/chart_empire_hero.png`;

export const routeMeta = {
  "/": {
    title: "Chart Empire: The Music Label Manager | Free Browser Game",
    description: "Build a fictional music label, sign artists, release songs, and dominate the charts in Chart Empire — the ultimate free browser music management game.",
    priority: "1.0",
    changefreq: "weekly"
  },
  "/play": {
    title: "Play Chart Empire — Free Music Label Game",
    description: "Start a guest career in Chart Empire, the free music label management browser game. Sign artists, record songs, and rule the charts. No download required.",
    priority: "0.9",
    changefreq: "weekly"
  },
  "/guide": {
    title: "Chart Empire Game Guide — Scouting, Recording & Charts",
    description: "Learn how scouting, recording, releases, promotion, charts, cashflow, and AI rival labels work in Chart Empire, the free music management game.",
    priority: "0.8",
    changefreq: "monthly"
  },
  "/how-the-music-industry-works": {
    title: "How the Music Industry Works — Labels, Streaming & Radio",
    description: "A practical guide to record labels, artist management, streaming discovery, radio promotion, press outreach, touring, and fan communities.",
    priority: "0.7",
    changefreq: "monthly"
  },
  "/music-promotion": {
    title: "Independent Music Promotion — Radio, Press & Strategy",
    description: "Learn release planning, radio promotion, press outreach, artist positioning, and campaign reporting for independent musicians.",
    priority: "0.7",
    changefreq: "monthly"
  },
  "/xing-records": {
    title: "Xing Records — Independent Music Showcase",
    description: "Explore the Xing Records Song of the Week and discover independent music releases inside the Chart Empire universe.",
    priority: "0.6",
    changefreq: "weekly"
  },
  "/song-of-the-week": {
    title: "Song of the Week — Xing Records Feature",
    description: "Watch the featured Xing Records Song of the Week spotlight, a weekly showcase for a real independent release.",
    priority: "0.6",
    changefreq: "weekly"
  },
  "/leaderboards": {
    title: "Chart Empire Leaderboards — Music Label Rankings",
    description: "View public Chart Empire label rankings, verified career scores, and competitive season results in the free music management game.",
    priority: "0.6",
    changefreq: "daily"
  },
  "/challenges": {
    title: "Music Management Game Challenges — 10 Scenarios",
    description: "Take on ten focused music label management challenge scenarios in Chart Empire, from saving a failing indie label to winning a global award.",
    priority: "0.7",
    changefreq: "monthly"
  },
  "/privacy": {
    title: "Privacy Policy — Chart Empire",
    description: "How local saves, cloud accounts, uploads, advertising, and data work in Chart Empire, the free browser music label game.",
    priority: "0.3",
    changefreq: "yearly"
  },
  "/terms": {
    title: "Terms of Use — Chart Empire",
    description: "Terms for using the fictional Chart Empire browser game, including user content, fair use, and availability.",
    priority: "0.3",
    changefreq: "yearly"
  },
  "/contact": {
    title: "Contact Chart Empire — Feedback & Music Promotion",
    description: "Contact the Chart Empire team about the game, Xing Records, or indie music promotion campaigns.",
    priority: "0.4",
    changefreq: "yearly"
  },
  "/admin": {
    title: "Admin — Chart Empire",
    description: "Restricted Chart Empire administration placeholder.",
    priority: "0.1",
    changefreq: "yearly",
    noindex: true
  }
};
