import { describe, expect, it } from "vitest";
import { SimulationEngine } from "../src/game/systems/SimulationEngine";

describe("Simulation Engine - High Intensity Stress Testing", () => {
  it("simulates 500 consecutive weeks with high catalog activity without NaN or Infinity", () => {
    const engine = SimulationEngine.create({
      labelName: "Empire Records",
      logo: "logo-cyan",
      strategy: "indie",
      market: "New York",
      seed: 99999
    });

    engine.state.cash = 1000000;

    const candidates = engine.scoutCandidates();
    for (const candidate of candidates.slice(0, 10)) {
      engine.signArtist(candidate.id);
    }

    const signed = engine.state.artists.filter((a) => a.signed);
    expect(signed.length).toBeGreaterThanOrEqual(1);

    for (let w = 0; w < 500; w++) {
      engine.state.cash = 1000000; // Constantly replenish cash reserves to avoid cash exhaust exceptions

      if (w % 5 === 0) {
        const artist = signed[w % signed.length]!;
        const song = engine.recordSong(artist.id);
        engine.releaseSong(song.id);
        if (w % 15 === 0) {
          engine.shootMusicVideo(song.id, "cgi");
        }
      }

      if (w % 8 === 0) {
        const released = engine.state.songs.filter(s => s.status === "released");
        if (released.length > 0) {
          const song = released[w % released.length]!;
          engine.launchCampaign(song.id, "social", 15000);
        }
      }

      if (w === 50) {
        engine.setFanClubFunding("party");
      }

      engine.endWeek();

      if (engine.state.pendingEvent) {
        const choice = engine.state.pendingEvent.choices[0]!;
        engine.resolveEvent(choice.id);
      }

      if (engine.state.cash < 0 && (engine.state.loans?.length || 0) < 3) {
        try {
          engine.takeEmergencyLoan();
        } catch {
          // Ignore if loan max reached
        }
      }

      expect(Number.isNaN(engine.state.cash)).toBe(false);
      expect(Number.isFinite(engine.state.cash)).toBe(true);
      expect(Number.isNaN(engine.state.fanbase)).toBe(false);
      expect(Number.isFinite(engine.state.fanbase)).toBe(true);

      for (const artist of engine.state.artists) {
        expect(Number.isNaN(artist.buzz)).toBe(false);
        expect(Number.isNaN(artist.morale)).toBe(false);
        expect(Number.isNaN(artist.weeklyCost)).toBe(false);
      }

      for (const song of engine.state.songs) {
        expect(Number.isNaN(song.streams)).toBe(false);
        expect(Number.isFinite(song.streams)).toBe(true);
      }
    }
  }, 30000);
});
