import { adConfig } from "../config/adConfig";

const HISTORY_KEY = "chart-empire-interstitial-history";
const MIN_GAP_MS = 3 * 60_000;
const HOURLY_LIMIT = 5;

export interface AdContext {
  tutorial: boolean;
  crisisOpen: boolean;
  criticalScreen: boolean;
}

export class AdsService {
  canLoadAds(): boolean {
    return adConfig.enabled;
  }

  canShowInterstitial(context: AdContext, now = Date.now()): boolean {
    if (!this.canLoadAds() || context.tutorial || context.crisisOpen || context.criticalScreen) return false;
    const history = this.history().filter((timestamp) => now - timestamp < 60 * 60_000);
    const latest = history.at(-1) || 0;
    return history.length < HOURLY_LIMIT && now - latest >= MIN_GAP_MS;
  }

  recordInterstitial(now = Date.now()): void {
    const history = this.history().filter((timestamp) => now - timestamp < 60 * 60_000);
    history.push(now);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  private history(): number[] {
    try {
      const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") as unknown;
      return Array.isArray(value) ? value.filter((item): item is number => typeof item === "number" && Number.isFinite(item)) : [];
    } catch {
      return [];
    }
  }
}

export const adsService = new AdsService();
