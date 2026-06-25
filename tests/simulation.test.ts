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

  it("supports hiring staff, touring, trends, and event choices", () => {
    const game = career(998);
    const artist = game.scoutCandidates()[0]!;
    game.signArtist(artist.id);
    const staff = game.staffCandidates().find((candidate) => candidate.weeklyCost * 2 < game.state.cash)!;
    game.hireStaff(staff.id);
    game.bookTour(artist.id, "club");
    game.state.pendingEvent = {
      id: "test-event",
      title: "Test event",
      description: "A bounded test decision.",
      category: "opportunity",
      choices: [{ id: "accept", label: "Accept", cash: 0, reputation: 2, morale: 1, buzz: 3 }]
    };
    game.resolveEvent("accept");
    game.endWeek();
    expect(game.state.staff).toHaveLength(1);
    expect(game.state.tours.length).toBeLessThanOrEqual(1);
    expect(game.state.socialFeed).toHaveLength(1);
    expect(game.state.pendingEvent === null || game.state.pendingEvent.choices.length > 0).toBe(true);
  });

  it("configures challenge starts", () => {
    const game = SimulationEngine.create({ labelName: "Tiny Signal", logo: "logo-cyan", market: "London", strategy: "indie", challengeId: "tiny-budget", seed: 88 });
    expect(game.state.cash).toBe(25_000);
    expect(game.state.artists.some((artist) => artist.signed)).toBe(true);
  });
});
