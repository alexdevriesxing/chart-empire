import { siteConfig } from "../config/siteConfig";

declare global {
  interface Window {
    turnstile?: {
      render(container: string | HTMLElement, options: Record<string, unknown>): string;
      reset(widgetId?: string): void;
      remove(widgetId: string): void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile could not load."));
    document.head.append(script);
  });
  return scriptPromise;
}

export async function mountTurnstile(container: HTMLElement, action: string, tokenInput: HTMLInputElement): Promise<string | null> {
  if (!siteConfig.turnstileSiteKey) {
    container.innerHTML = '<p class="form-warning">Account protection is not configured.</p>';
    return null;
  }
  await loadScript();
  return window.turnstile?.render(container, {
    sitekey: siteConfig.turnstileSiteKey,
    theme: "dark",
    action,
    callback: (token: string) => { tokenInput.value = token; },
    "expired-callback": () => { tokenInput.value = ""; },
    "error-callback": () => { tokenInput.value = ""; }
  }) || null;
}
