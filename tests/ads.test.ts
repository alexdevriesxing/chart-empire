import { beforeEach, describe, expect, it } from "vitest";

describe("ad frequency and safety gates", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value)
      }
    });
  });

  it("never shows interstitials during tutorial or crisis decisions", async () => {
    const { AdsService } = await import("../src/services/AdsService");
    const service = new AdsService();
    Object.defineProperty(service, "canLoadAds", { value: () => true });
    expect(service.canShowInterstitial({ tutorial: true, crisisOpen: false, criticalScreen: false }, 1_000_000)).toBe(false);
    expect(service.canShowInterstitial({ tutorial: false, crisisOpen: true, criticalScreen: false }, 1_000_000)).toBe(false);
  });

  it("enforces three-minute and five-per-hour caps", async () => {
    const { AdsService } = await import("../src/services/AdsService");
    const service = new AdsService();
    Object.defineProperty(service, "canLoadAds", { value: () => true });
    const context = { tutorial: false, crisisOpen: false, criticalScreen: false };
    expect(service.canShowInterstitial(context, 1_000_000)).toBe(true);
    service.recordInterstitial(1_000_000);
    expect(service.canShowInterstitial(context, 1_100_000)).toBe(false);
    expect(service.canShowInterstitial(context, 1_181_000)).toBe(true);
  });
});
