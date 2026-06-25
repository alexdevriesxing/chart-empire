import { describe, expect, it } from "vitest";
import { SimulationEngine } from "../src/game/systems/SimulationEngine";

function career(seed = 42): SimulationEngine {
  return SimulationEngine.create({ labelName: "Test Signal", logo: "logo-cyan", market: "Amsterdam", strategy: "indie", seed });
}

describe("SimulationEngine", () => {
  it("supports the minimum playable loop", () => {
    const game = career();
    const artist = game.scoutCandidates()[0]!;
    game.signArtist(artist.id);
    const song = game.recordSong(artist.id);
    game.releaseSong(song.id);
    game.launchCampaign(song.id, "social", 5000);
    const report = game.endWeek();

    expect(game.state.week).toBe(2);
    expect(song.status).toBe("released");
    expect(song.streams).toBeGreaterThan(0);
    expect(report.fanGrowth).toBeGreaterThan(0);
    expect(game.state.chart).toHaveLength(20);
    expect(game.state.chart.some((entry) => entry.playerOwned)).toBe(true);
  });

  it("preserves deterministic business outcomes for a fixed seed", () => {
    const run = () => {
      const game = career(1138);
      const artist = game.scoutCandidates()[0]!;
      game.signArtist(artist.id);
      const song = game.recordSong(artist.id);
      game.releaseSong(song.id);
      game.launchCampaign(song.id, "radio", 15000);
      const report = game.endWeek();
      return { quality: song.quality, streams: song.streams, spins: song.radioSpins, report, chart: game.state.chart.map(({ title, score }) => ({ title, score })) };
    };
    expect(run()).toEqual(run());
  });

  it("rejects spending beyond available cash", () => {
    const game = career();
    game.state.cash = 1;
    expect(() => game.signArtist(game.scoutCandidates()[0]!.id)).toThrow(/cash/i);
  });

  it("calculates recurring roster expenses", () => {
    const game = career();
    const artist = game.scoutCandidates()[0]!;
    game.signArtist(artist.id);
    const report = game.endWeek();
    expect(report.expenses).toBe(artist.weeklyCost);
  });
});
