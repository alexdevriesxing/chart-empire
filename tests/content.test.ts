import { describe, expect, it } from "vitest";
import { aiLabels, challengeScenarios, eventCatalog, generateArtists, publications, radioNetworks, streamingPlatforms, trends } from "../src/game/data/content";

describe("fictional content", () => {
  it("generates at least 75 unique artist names", () => {
    const artists = generateArtists(99);
    expect(artists).toHaveLength(75);
    expect(new Set(artists.map((artist) => artist.name)).size).toBe(75);
  });

  it("meets the minimum world catalog sizes", () => {
    expect(aiLabels.length).toBeGreaterThanOrEqual(16);
    expect(publications.length).toBeGreaterThanOrEqual(12);
    expect(radioNetworks.length).toBeGreaterThanOrEqual(12);
    expect(streamingPlatforms.length).toBeGreaterThanOrEqual(10);
    expect(eventCatalog.length).toBeGreaterThanOrEqual(150);
    expect(trends.length).toBeGreaterThanOrEqual(25);
    expect(challengeScenarios.length).toBeGreaterThanOrEqual(10);
  });

  it("does not generate forbidden real platform names", () => {
    const names = generateArtists(777).map((artist) => artist.name).join(" ").toLowerCase();
    for (const forbidden of ["spotify", "apple music", "youtube music", "billboard", "grammy"]) {
      expect(names).not.toContain(forbidden);
    }
  });
});
