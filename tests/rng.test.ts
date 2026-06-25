import { describe, expect, it } from "vitest";
import { RNG } from "../src/game/systems/RNG";

describe("RNG", () => {
  it("produces deterministic output", () => {
    const first = new RNG(12345);
    const second = new RNG(12345);
    expect(Array.from({ length: 20 }, () => first.next())).toEqual(Array.from({ length: 20 }, () => second.next()));
  });

  it("stays inside integer bounds", () => {
    const rng = new RNG(9);
    const values = Array.from({ length: 200 }, () => rng.int(4, 11));
    expect(Math.min(...values)).toBeGreaterThanOrEqual(4);
    expect(Math.max(...values)).toBeLessThanOrEqual(11);
  });
});
