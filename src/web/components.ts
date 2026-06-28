import { siteConfig } from "../config/siteConfig";

export function header(): string {
  return `
    <header class="site-header">
      <a class="brand" href="/" data-link aria-label="Chart Empire home">
        <img src="/images/logo.png" alt="Chart Empire Logo" class="brand-logo-img" style="width: 34px; height: 34px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); object-fit: cover; margin-right: 8px; display: inline-block; vertical-align: middle;"><span>Chart Empire</span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav">Menu</button>
      <nav id="primary-nav" class="primary-nav" aria-label="Primary">
        <a href="/play" data-link>Play</a><a href="/guide" data-link>Guide</a>
        <a href="/challenges" data-link>Challenges</a><a href="/leaderboards" data-link>Charts</a>
        <a href="/music-promotion" data-link>Real Music Promotion</a>
      </nav>
      <a class="button button-small button-primary header-cta" href="/play" data-link>Play free</a>
    </header>`;
}

export function footer(): string {
  const xingLogoSvg = `<svg class="partner-logo-img" viewBox="0 0 100 100" width="28" height="28" style="border-radius: 6px; border: 1px solid rgba(255,255,255,0.12); background: linear-gradient(135deg, #ff4e50, #f9d423); padding: 3px; display: inline-block; vertical-align: middle; margin-right: 6px;"><circle cx="50" cy="50" r="40" fill="none" stroke="#ffffff" stroke-width="6" /><circle cx="50" cy="50" r="25" fill="none" stroke="#ffffff" stroke-width="4" /><circle cx="50" cy="50" r="10" fill="#ffffff" /></svg>`;
  const impLogoSvg = `<svg class="partner-logo-img" viewBox="0 0 100 100" width="28" height="28" style="border-radius: 6px; border: 1px solid rgba(255,255,255,0.12); background: linear-gradient(135deg, #00c6ff, #0072ff); padding: 3px; display: inline-block; vertical-align: middle; margin-right: 6px;"><path d="M30,30 L50,30 L70,15 L70,85 L50,70 L30,70 Z" fill="#ffffff" /><path d="M78,35 Q85,50 78,65" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" /></svg>`;

  return `
    <footer class="site-footer">
      <div class="footer-top" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
        <div>
          <a class="brand" href="/" data-link>
            <img src="/images/logo.png" alt="Chart Empire Logo" class="brand-logo-img" style="width: 34px; height: 34px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); object-fit: cover; margin-right: 8px; display: inline-block; vertical-align: middle;">
            <span>Chart Empire</span>
          </a>
          <p>A fictional music-industry simulation. Built for strategy, drama, and replayability.</p>
        </div>
        <div class="partner-links-container" style="display: flex; gap: 20px; align-items: center;">
          <a href="https://www.xingrecords.com" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; text-decoration: none; color: var(--color-text); font-weight: 600;">
            ${xingLogoSvg} Xing Records
          </a>
          <a href="https://www.indiemusicpromotion.com" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; text-decoration: none; color: var(--color-text); font-weight: 600;">
            ${impLogoSvg} Indie Music Promotion
          </a>
        </div>
      </div>
      <div class="footer-bottom" style="display: flex; flex-direction: column; gap: 1rem; margin-top: 2rem; border-top: 1px solid var(--color-border); padding-top: 1rem; width: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; width: 100%;">
          <div class="footer-links" style="display: flex; gap: 15px;"><a href="/privacy" data-link>Privacy Policy</a><a href="/terms" data-link>Terms</a><a href="/contact" data-link>Contact</a></div>
          <div class="copyright" style="font-size: 0.85rem; color: var(--color-muted);">
            &copy; 2026 by <a href="https://www.firedragoninteractive.com" target="_blank" rel="noopener" style="color: var(--color-text); text-decoration: none; font-weight: 600;">Fire Dragon Interactive</a>. All rights reserved.
          </div>
        </div>
        <p style="font-size: 0.8rem; color: var(--color-muted); line-height: 1.4; margin: 0; max-width: 900px;">
          <strong>Privacy Notice:</strong> We keep Chart Empire free thanks to advertising. We do not collect any personal information, nor will we sell any.
        </p>
      </div>
    </footer>`;
}

export function desktopLeaderboardAd(): string {
  return `<div class="adsterra-container adsterra-728x90" style="display:flex;justify-content:center;align-items:center;padding:15px 0;background:var(--color-background-offset);border-bottom:1px solid var(--color-border);"><div id="ad-728x90-slot"></div></div>`;
}

export function mobileHeaderAd(): string {
  return `<div class="adsterra-container adsterra-320x50" style="display:flex;justify-content:center;align-items:center;padding:10px 0;background:var(--color-background-offset);border-bottom:1px solid var(--color-border);"><div id="ad-320x50-slot"></div></div>`;
}

export function sidebarSkyscraperAd(): string {
  return `<div class="adsterra-container adsterra-160x600" style="display:flex;flex-direction:column;align-items:center;padding:20px 10px;background:var(--color-background-offset);height:100%;"><span style="font-size:0.65rem;color:var(--color-muted);text-transform:uppercase;margin-bottom:8px;font-weight:700;letter-spacing:0.05em;">Sponsor</span><div id="ad-160x600-slot" style="position:sticky;top:20px;"></div></div>`;
}

export function sidebarHalfSkyscraperAd(): string {
  return `<div class="adsterra-container adsterra-160x300" style="display:flex;flex-direction:column;align-items:center;padding:20px 10px;background:var(--color-background-offset);height:100%;"><span style="font-size:0.65rem;color:var(--color-muted);text-transform:uppercase;margin-bottom:8px;font-weight:700;letter-spacing:0.05em;">Sponsor</span><div id="ad-160x300-slot" style="position:sticky;top:20px;"></div></div>`;
}

export function contentBannerAd(): string {
  return `<div class="adsterra-container adsterra-468x60" style="display:flex;justify-content:center;align-items:center;padding:20px 0;width:100%;"><div id="ad-468x60-slot"></div></div>`;
}

export function mediumRectangleAd(): string {
  return `<div class="adsterra-container adsterra-300x250" style="display:flex;justify-content:center;align-items:center;padding:20px 0;width:100%;"><div id="ad-300x250-slot"></div></div>`;
}

export function nativeAdContainer(): string {
  return `<div class="adsterra-container adsterra-native" style="display:flex;justify-content:center;align-items:center;padding:20px 0;width:100%;"><div id="container-776951a86861b9863f167c7cf03bcc3e" style="width:100%;"></div></div>`;
}

let adLoadCounter = 0;

export function triggerAdsterraLoads(): void {
  if (!document.querySelector('script[src*="pl30102143.effectivecpmnetwork.com"]')) {
    const sb = document.createElement("script");
    sb.src = "https://pl30102143.effectivecpmnetwork.com/0c/db/4e/0cdb4e1215361436edb94451ba5cae14.js";
    sb.async = true;
    document.head.appendChild(sb);
  }

  const nativeCont = document.getElementById("container-776951a86861b9863f167c7cf03bcc3e");
  if (nativeCont && !nativeCont.querySelector("script")) {
    const nb = document.createElement("script");
    nb.src = "https://pl30102144.effectivecpmnetwork.com/776951a86861b9863f167c7cf03bcc3e/invoke.js";
    nb.async = true;
    nb.setAttribute("data-cfasync", "false");
    nativeCont.appendChild(nb);
  }

  const iframeAds: Array<[string, string, number, number]> = [
    ["ad-728x90-slot", "4ad6c93e31e761abac4127ac5d2c0018", 728, 90],
    ["ad-320x50-slot", "9acad8e008b81557f5f5b74a6e7816a2", 320, 50],
    ["ad-160x600-slot", "425d79358388bfe14eabe49bba27d07d", 160, 600],
    ["ad-468x60-slot", "1e9837c95b8dd8989b1dc9a1c66bccb4", 468, 60],
    ["ad-300x250-slot", "920af981da136d4562c81f22f5698798", 300, 250],
    ["ad-160x300-slot", "7cf28e9df908b07a19a7fc9603035405", 160, 300]
  ];

  for (const [slotId, key, w, h] of iframeAds) {
    const slot = document.getElementById(slotId);
    if (!slot || slot.querySelector("iframe")) continue;
    
    const iframe = document.createElement("iframe");
    iframe.style.border = "none";
    iframe.style.overflow = "hidden";
    iframe.style.width = `${w}px`;
    iframe.style.height = `${h}px`;
    iframe.style.background = "transparent";
    iframe.setAttribute("allowtransparency", "true");
    
    slot.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>body { margin: 0; padding: 0; overflow: hidden; background: transparent; }</style>
          </head>
          <body>
            <script>
              atOptions = {
                'key' : '${key}',
                'format' : 'iframe',
                'height' : ${h},
                'width' : ${w},
                'params' : {}
              };
            </script>
            <script src="https://www.highperformanceformat.com/${key}/invoke.js"></script>
          </body>
        </html>
      `);
      doc.close();
    }
  }
}

export function shell(content: string, className = ""): string {
  return `
    <style>
      @media (max-width: 991px) {
        .desktop-only-ad-sidebar { display: none !important; }
        .adsterra-728x90 { display: none !important; }
      }
      @media (min-width: 992px) {
        .adsterra-320x50 { display: none !important; }
      }
    </style>
    ${header()}
    ${desktopLeaderboardAd()}
    ${mobileHeaderAd()}
    <div class="site-layout-wrapper" style="display: flex; max-width: 1400px; margin: 0 auto; width: 100%;">
      <aside class="desktop-only-ad-sidebar desktop-only-ad-sidebar-left" style="width: 180px; flex-shrink: 0; background: var(--color-background-offset); border-right: 1px solid var(--color-border);">
        ${sidebarHalfSkyscraperAd()}
      </aside>
      <main id="main-content" class="${className}" style="flex: 1; min-width: 0; padding: 20px;">
        ${content}
      </main>
      <aside class="desktop-only-ad-sidebar" style="width: 200px; flex-shrink: 0; background: var(--color-background-offset); border-left: 1px solid var(--color-border);">
        ${sidebarSkyscraperAd()}
      </aside>
    </div>
    ${footer()}
  `;
}

export function adSlot(label: string, placement: "home" | "native" | "game" | "footer" | "content" = "home"): string {
  if (placement === "home") return mediumRectangleAd();
  if (placement === "native") return nativeAdContainer();
  if (placement === "content") return contentBannerAd();
  return contentBannerAd();
}

export function songOfWeek(): string {
  const { song } = siteConfig;
  if (song.youtubeId) {
    return `<div class="video-frame"><iframe loading="lazy" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(song.youtubeId)}" title="${escapeHtml(song.title)} by ${escapeHtml(song.artist)}" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`;
  }
  return `<div class="song-card"><span class="eyebrow">Xing Records presents</span><div class="song-art"><span>♪</span></div><div><h3>${escapeHtml(song.title)}</h3><p>${escapeHtml(song.artist)}</p><p class="muted">${"Configure the current feature in the environment variables."}</p><a class="button button-secondary" href="${song.url}" target="_blank" rel="noopener">Open Song of the Week ↗</a></div></div>`;
}

export function bindGlobalControls(_rerender: () => void): void {
  document.querySelector<HTMLButtonElement>(".nav-toggle")?.addEventListener("click", (event) => {
    const button = event.currentTarget as HTMLButtonElement;
    const open = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!open));
    document.querySelector(".primary-nav")?.classList.toggle("is-open", !open);
  });
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}
