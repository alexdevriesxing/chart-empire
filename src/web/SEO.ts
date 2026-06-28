import { siteConfig } from "../config/siteConfig";

interface SEOData {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
}

export function applySEO(data: SEOData): void {
  const title = data.title.includes("Chart Empire") ? data.title : `${data.title} | Chart Empire`;
  document.title = title;
  const url = new URL(data.path, siteConfig.siteUrl).toString();
  const imageUrl = new URL("/images/chart_empire_hero.png", siteConfig.siteUrl).toString();

  setMeta("description", data.description);
  setMeta("keywords", "music label game, music management game, browser game, free music game, record label simulator, music industry game, artist management game, chart game, music empire, indie label game, music strategy game, play music game online");
  setMeta("author", "Fire Dragon Interactive");
  setMeta("robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");

  setMeta("og:title", title, true);
  setMeta("og:description", data.description, true);
  setMeta("og:type", data.type || "website", true);
  setMeta("og:url", url, true);
  setMeta("og:image", imageUrl, true);
  setMeta("og:image:width", "1200", true);
  setMeta("og:image:height", "630", true);
  setMeta("og:image:alt", "Chart Empire - Music Label Management Game", true);
  setMeta("og:site_name", "Chart Empire", true);
  setMeta("og:locale", "en_US", true);

  setMeta("twitter:card", "summary_large_image");
  setMeta("twitter:title", title);
  setMeta("twitter:description", data.description);
  setMeta("twitter:image", imageUrl);

  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.append(canonical);
  }
  canonical.href = url;
}

export function addStructuredData(data: object): void {
  document.querySelectorAll("script[data-chart-empire-jsonld]").forEach((node) => node.remove());
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.dataset.chartEmpireJsonld = "true";
  script.textContent = JSON.stringify(data);
  document.head.append(script);
}

function setMeta(name: string, content: string, property = false): void {
  const attribute = property ? "property" : "name";
  let element = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.append(element);
  }
  element.content = content;
}
