import { describe, expect, it } from "vitest";
import { SimulationEngine } from "../src/game/systems/SimulationEngine";
import { audioService } from "../src/services/AudioService";

describe("Simulation Engine - Insolvency & Emergency Financing", () => {
  it("increments debt weeks when ending week with negative cash", () => {
    const engine = SimulationEngine.create({
      labelName: "Test Label",
      logo: "logo-cyan",
      strategy: "indie",
      market: "London",
      seed: 12345
    });

    engine.state.cash = -1000;
    engine.endWeek();

    expect(engine.state.debtWeeks).toBe(1);
    expect(engine.state.insolvent).toBe(false);
  });

  it("triggers insolvency game over after 5 consecutive weeks in debt", () => {
    const engine = SimulationEngine.create({
      labelName: "Test Label",
      logo: "logo-cyan",
      strategy: "indie",
      market: "London",
      seed: 12345
    });

    engine.state.cash = -5000;
    engine.state.debtWeeks = 4;
    
    engine.endWeek();

    expect(engine.state.debtWeeks).toBe(5);
    expect(engine.state.insolvent).toBe(true);
  });

  it("resets debt weeks count once cash returns to positive", () => {
    const engine = SimulationEngine.create({
      labelName: "Test Label",
      logo: "logo-cyan",
      strategy: "indie",
      market: "London",
      seed: 12345
    });

    engine.state.cash = -5000;
    engine.state.debtWeeks = 3;
    
    engine.state.cash = 10000;
    engine.endWeek();

    expect(engine.state.debtWeeks).toBe(0);
    expect(engine.state.insolvent).toBe(false);
  });

  it("allows taking an emergency loan when in debt", () => {
    const engine = SimulationEngine.create({
      labelName: "Test Label",
      logo: "logo-cyan",
      strategy: "indie",
      market: "London",
      seed: 12345
    });

    engine.state.cash = -5000;
    engine.state.debtWeeks = 3;

    engine.takeEmergencyLoan();

    expect(engine.state.cash).toBe(70000);
    expect(engine.state.debtWeeks).toBe(0);
    expect(engine.state.loans.length).toBe(1);
    
    const loan = engine.state.loans[0]!;
    expect(loan.principal).toBe(75000);
    expect(loan.weeklyRepayment).toBe(2500);
    expect(loan.weeksRemaining).toBe(40);
  });

  it("enforces a maximum limit of 3 concurrent loans", () => {
    const engine = SimulationEngine.create({
      labelName: "Test Label",
      logo: "logo-cyan",
      strategy: "indie",
      market: "London",
      seed: 12345
    });

    engine.state.cash = -10000;
    
    engine.takeEmergencyLoan();
    engine.state.cash = -10000;
    engine.takeEmergencyLoan();
    engine.state.cash = -10000;
    engine.takeEmergencyLoan();

    expect(engine.state.loans.length).toBe(3);

    engine.state.cash = -10000;
    expect(() => engine.takeEmergencyLoan()).toThrowError("Maximum of 3 active loans allowed simultaneously.");
  });

  it("deducts weekly loan repayments during endWeek", () => {
    const engine = SimulationEngine.create({
      labelName: "Test Label",
      logo: "logo-cyan",
      strategy: "indie",
      market: "London",
      seed: 12345
    });

    engine.state.cash = -1000;
    engine.takeEmergencyLoan();

    expect(engine.state.cash).toBe(74000);

    engine.endWeek();

    const loan = engine.state.loans[0]!;
    expect(loan.weeksRemaining).toBe(39);
  });

  it("allows purchasing and applying scouting network upgrades", () => {
    const engine = SimulationEngine.create({
      labelName: "Test Label",
      logo: "logo-cyan",
      strategy: "indie",
      market: "London",
      seed: 12345
    });

    const initialCandidates = engine.scoutCandidates();
    const firstCandidateId = initialCandidates[0]!.id;

    engine.state.cash = 100000;
    engine.buyUpgrade("regional-scouting");

    expect(engine.state.upgrades).toContain("regional-scouting");
    expect(engine.state.cash).toBe(70000);

    const upgradedCandidates = engine.scoutCandidates();
    const initialArtist = initialCandidates.find(c => c.id === firstCandidateId)!;
    const upgradedArtist = upgradedCandidates.find(c => c.id === firstCandidateId)!;
    expect(upgradedArtist.talent).toBe(initialArtist.talent + 5);

    engine.signArtist(firstCandidateId);
    const signedArtist = engine.state.artists.find(a => a.id === firstCandidateId)!;
    expect(signedArtist.talent).toBe(upgradedArtist.talent);
  });

  it("allows pressing vinyl and resolves physical sales weekly", () => {
    const engine = SimulationEngine.create({
      labelName: "Test Label",
      logo: "logo-cyan",
      strategy: "indie",
      market: "London",
      seed: 12345
    });

    const artist = engine.state.artists[0]!;
    engine.state.cash = 100000;
    engine.signArtist(artist.id);

    const song = engine.recordSong(artist.id);
    engine.releaseSong(song.id);

    engine.orderVinyl(song.id, 5000);
    expect(engine.state.cash).toBe(100000 - (artist.weeklyCost * 4) - (18000 + artist.talent * 120) - 15000);

    const vinyl = engine.state.vinyls.find(v => v.songId === song.id)!;
    expect(vinyl.stock).toBe(5000);

    engine.endWeek();
    expect(vinyl.stock).toBeLessThan(5000);
    expect(vinyl.sold).toBeGreaterThan(0);
  });

  it("allows launching merch campaigns and resolves revenue weekly", () => {
    const engine = SimulationEngine.create({
      labelName: "Test Label",
      logo: "logo-cyan",
      strategy: "indie",
      market: "London",
      seed: 12345
    });

    const artist = engine.state.artists[0]!;
    engine.state.cash = 50000;
    engine.signArtist(artist.id);

    engine.launchMerch(artist.id);
    const campaign = engine.state.merch.find(m => m.artistId === artist.id)!;
    expect(campaign.active).toBe(true);

    engine.endWeek();
    expect(campaign.weeksRemaining).toBe(11);
  });

  it("handles buyout transfer decisions correctly", () => {
    const engine = SimulationEngine.create({
      labelName: "Test Label",
      logo: "logo-cyan",
      strategy: "indie",
      market: "London",
      seed: 12345
    });

    const artist = engine.state.artists[0]!;
    engine.state.cash = 50000;
    
    engine.state.activeBuyout = {
      id: "buyout-test",
      type: "sell",
      artistId: artist.id,
      label: "Velvet Circuit",
      price: 15000
    };

    engine.acceptBuyout();
    expect(artist.signed).toBe(true);
    expect(engine.state.cash).toBe(35000);
  });

  it("allows shooting music videos and applying score/buzz modifiers", () => {
    const engine = SimulationEngine.create({
      labelName: "Test Label",
      logo: "logo-cyan",
      strategy: "indie",
      market: "London",
      seed: 12345
    });

    const artist = engine.state.artists[0]!;
    engine.state.cash = 150000;
    engine.signArtist(artist.id);

    const song = engine.recordSong(artist.id);
    engine.releaseSong(song.id);

    const initialBuzz = artist.buzz;
    engine.shootMusicVideo(song.id, "cgi");
    
    expect(song.videoQuality).toBe("cgi");
    expect(artist.buzz).toBeGreaterThan(initialBuzz);
    expect(engine.state.cash).toBeLessThan(150000);
  });

  it("applies fan club App community weekly overheads and boosts fanbase/morale", () => {
    const engine = SimulationEngine.create({
      labelName: "Test Label",
      logo: "logo-cyan",
      strategy: "indie",
      market: "London",
      seed: 12345
    });

    engine.state.cash = 100000;
    engine.setFanClubFunding("app");
    
    const initialFans = engine.state.fanbase;
    engine.endWeek();

    expect(engine.state.fanbase).toBe(initialFans + 1200);
  });

  it("triggers gold and platinum certifications based on cumulative streaming milestones", () => {
    const engine = SimulationEngine.create({
      labelName: "Test Label",
      logo: "logo-cyan",
      strategy: "indie",
      market: "London",
      seed: 12345
    });

    const artist = engine.state.artists[0]!;
    engine.signArtist(artist.id);

    const song = engine.recordSong(artist.id);
    song.quality = 1;
    artist.appeal = 1;
    artist.buzz = 1;
    engine.releaseSong(song.id);

    song.streams = 499000; // Will cross 500K on resolution
    engine.endWeek();
    expect(song.certification).toBe("gold");

    song.streams = 999000; // Will cross 1M on resolution
    engine.endWeek();
    expect(song.certification).toBe("platinum");
  });

  it("plays dynamic procedural synthesizer melodies for artists based on genre", () => {
    expect(() => {
      audioService.playMelodyForGenre("Synth Soul");
      audioService.playMelodyForGenre("Alt-Rock");
      audioService.playMelodyForGenre("Cloud Rap");
      audioService.playMelodyForGenre("Neon Pop");
    }).not.toThrow();
  });
});
