import { describe, expect, it } from "vitest";

describe("consent service", () => {
  it("always allows all categories", async () => {
    const source = await import("../src/services/ConsentService");
    const service = new source.ConsentService();
    expect(service.allows()).toBe(true);
  });
});
