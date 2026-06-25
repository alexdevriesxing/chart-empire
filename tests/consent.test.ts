import { describe, expect, it } from "vitest";

describe("consent defaults", () => {
  it("keeps optional services disabled in source defaults", async () => {
    const source = await import("../src/services/ConsentService");
    const storage = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value)
      }
    });
    const service = new source.ConsentService();
    expect(service.get()).toMatchObject({ necessary: true, analytics: false, ads: false, personalizedAds: false, externalMedia: false });
  });
});
