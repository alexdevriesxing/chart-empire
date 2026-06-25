import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const routes = [
  "play",
  "guide",
  "how-the-music-industry-works",
  "music-promotion",
  "xing-records",
  "song-of-the-week",
  "leaderboards",
  "challenges",
  "privacy",
  "cookies",
  "terms",
  "contact",
  "admin"
];

for (const route of routes) {
  const directory = join("dist", route);
  mkdirSync(directory, { recursive: true });
  copyFileSync(join("dist", "index.html"), join(directory, "index.html"));
}

console.log(`Generated ${routes.length} static route entrypoints.`);
