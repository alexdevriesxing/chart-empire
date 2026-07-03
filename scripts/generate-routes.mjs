import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { OG_IMAGE, routeMeta, SITE_URL } from "./route-meta.mjs";

const template = readFileSync(join("dist", "index.html"), "utf8");

function escapeAttr(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function breadcrumb(path, title) {
  const items = [{ "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` }];
  if (path !== "/") {
    items.push({ "@type": "ListItem", position: 2, name: title.split(" — ")[0].split(" | ")[0], item: `${SITE_URL}${path}` });
  }
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items };
}

// Structured data for interior pages (the homepage keeps its richer graph from index.html).
function subpageJsonLd(path, title, description) {
  const url = `${SITE_URL}${path}`;
  return JSON.stringify([
    { "@context": "https://schema.org", "@type": "WebPage", name: title, description, url, isPartOf: { "@type": "WebSite", name: "Chart Empire", url: SITE_URL } },
    breadcrumb(path, title)
  ]);
}

function renderRoute(path, meta) {
  const url = path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
  const title = escapeAttr(meta.title);
  const description = escapeAttr(meta.description);
  let html = template;

  // <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  // meta description / og / twitter / canonical (attribute order matches index.html)
  html = html.replace(/(<meta name="description" content=")[\s\S]*?(" \/>)/, `$1${description}$2`);
  html = html.replace(/(<meta property="og:title" content=")[\s\S]*?(" \/>)/, `$1${title}$2`);
  html = html.replace(/(<meta property="og:description" content=")[\s\S]*?(" \/>)/, `$1${description}$2`);
  html = html.replace(/(<meta property="og:url" content=")[\s\S]*?(" \/>)/, `$1${url}$2`);
  html = html.replace(/(<meta name="twitter:title" content=")[\s\S]*?(" \/>)/, `$1${title}$2`);
  html = html.replace(/(<meta name="twitter:description" content=")[\s\S]*?(" \/>)/, `$1${description}$2`);
  html = html.replace(/(<link rel="canonical" href=")[\s\S]*?(" \/>)/, `$1${url}$2`);

  if (meta.noindex) {
    html = html.replace(/(<meta name="robots" content=")[\s\S]*?(" \/>)/, `$1noindex, nofollow$2`);
  }

  // Replace the homepage JSON-LD block with a page-specific one for interior routes.
  if (path !== "/") {
    html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${subpageJsonLd(path, meta.title, meta.description)}</script>`);
  }

  return html;
}

// Homepage: rewrite dist/index.html in place so its OG image is absolute and metadata is canonical.
writeFileSync(join("dist", "index.html"), renderRoute("/", routeMeta["/"]));

let count = 0;
for (const [path, meta] of Object.entries(routeMeta)) {
  if (path === "/") continue;
  const directory = join("dist", path.replace(/^\//, ""));
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, "index.html"), renderRoute(path, meta));
  count += 1;
}

// Generate an up-to-date sitemap from the same metadata so it never drifts.
const today = new Date().toISOString().slice(0, 10);
const sitemapEntries = Object.entries(routeMeta)
  .filter(([, meta]) => !meta.noindex)
  .map(([path, meta]) => {
    const loc = path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${meta.changefreq}</changefreq>\n    <priority>${meta.priority}</priority>\n  </url>`;
  })
  .join("\n");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`;
writeFileSync(join("dist", "sitemap.xml"), sitemap);

console.log(`Generated ${count} static route entrypoints with per-route SEO metadata and a fresh sitemap.`);
void OG_IMAGE;
