import { adConfig } from "../config/adConfig";
import { siteConfig } from "../config/siteConfig";
import { consentService } from "../services/ConsentService";

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
  return `
    <footer class="site-footer">
      <div><a class="brand" href="/" data-link><img src="/images/logo.png" alt="Chart Empire Logo" class="brand-logo-img" style="width: 34px; height: 34px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); object-fit: cover; margin-right: 8px; display: inline-block; vertical-align: middle;"><span>Chart Empire</span></a>
      <p>A fictional music-industry simulation. Built for strategy, drama, and replayability.</p></div>
      <div class="footer-links"><a href="/privacy" data-link>Privacy</a><a href="/cookies" data-link>Cookies</a><a href="/terms" data-link>Terms</a><a href="/contact" data-link>Contact</a></div>
      <div class="partner-links"><a href="${siteConfig.xingRecordsUrl}" target="_blank" rel="noopener">Xing Records ↗</a><a href="${siteConfig.indieMusicPromotionUrl}" target="_blank" rel="noopener">Indie Music Promotion ↗</a></div>
    </footer>`;
}

export function shell(content: string, className = ""): string {
  return `${header()}<main id="main-content" class="${className}">${content}</main>${footer()}${consentBanner()}`;
}

export function consentBanner(): string {
  if (consentService.hasDecision()) return "";
  return `
    <aside class="consent-banner" role="dialog" aria-label="Privacy choices">
      <div><strong>Your stage, your privacy.</strong><p>Necessary storage keeps guest saves working. Optional analytics, ads, and video embeds stay off until you choose.</p></div>
      <div class="consent-actions"><button class="button button-ghost" data-consent="reject">Necessary only</button><a class="button button-ghost" href="/cookies" data-link>Settings</a><button class="button button-primary" data-consent="accept">Accept all</button></div>
    </aside>`;
}

export function adSlot(label: string, placement: "home" | "native" | "game" | "footer" = "home"): string {
  const canLoad = adConfig.enabled && consentService.allows("ads");
  return `<aside class="ad-slot ad-slot-${placement}" aria-label="Advertisement"><span>Partner stage</span><strong>${canLoad ? "Ad placement configured" : label}</strong><small>${canLoad ? "Third-party ad script hook is ready." : "Contextual sponsor placement — optional ads are currently off."}</small></aside>`;
}

export function songOfWeek(): string {
  const { song } = siteConfig;
  if (song.youtubeId && consentService.allows("externalMedia")) {
    return `<div class="video-frame"><iframe loading="lazy" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(song.youtubeId)}" title="${escapeHtml(song.title)} by ${escapeHtml(song.artist)}" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`;
  }
  return `<div class="song-card"><span class="eyebrow">Xing Records presents</span><div class="song-art"><span>♪</span></div><div><h3>${escapeHtml(song.title)}</h3><p>${escapeHtml(song.artist)}</p><p class="muted">${song.youtubeId ? "Enable external media in Cookie Settings to play the video here." : "Configure the current feature in the environment variables."}</p><a class="button button-secondary" href="${song.url}" target="_blank" rel="noopener">Open Song of the Week ↗</a></div></div>`;
}

export function bindGlobalControls(rerender: () => void): void {
  document.querySelector<HTMLButtonElement>(".nav-toggle")?.addEventListener("click", (event) => {
    const button = event.currentTarget as HTMLButtonElement;
    const open = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!open));
    document.querySelector(".primary-nav")?.classList.toggle("is-open", !open);
  });
  document.querySelectorAll<HTMLElement>("[data-consent]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.consent === "accept") consentService.acceptAll();
      else consentService.rejectOptional();
      rerender();
    });
  });
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}
