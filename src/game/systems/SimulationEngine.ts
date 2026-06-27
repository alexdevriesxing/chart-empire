import { aiLabels, challengeScenarios, eventCatalog, generateArtists, generateStaff, genres, publications, radioNetworks, strategies, streamingPlatforms, trends } from "../data/content";
import type { Artist, Campaign, ChartEntry, GameState, NewGameOptions, PendingEvent, Song, StaffMember, Tour, Trend, WeekReport } from "../../types/game";
import { RNG } from "./RNG";

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export class SimulationEngine {
  private rng: RNG;
  public state: GameState;

  constructor(state: GameState) {
    this.state = this.hydrate(state);
    this.rng = new RNG(this.state.seed + this.state.week * 7919);
  }

  static create(options: NewGameOptions): SimulationEngine {
    const seed = options.seed ?? Date.now() >>> 0;
    const strategy = strategies[options.strategy];
    const challenge = challengeScenarios.find((item) => item.id === options.challengeId);
    const artists = generateArtists(seed).map((artist) => ({ ...artist, spotifyId: null }));
    if (challenge?.id === "tiny-budget") {
      const starter = [...artists].sort((a, b) => a.weeklyCost - b.weeklyCost)[0]!;
      starter.signed = true;
      starter.contractWeeks = 52;
    }
    if (challenge?.id === "legacy") {
      const starter = [...artists].sort((a, b) => b.talent - a.talent)[0]!;
      starter.signed = true;
      starter.contractWeeks = 78;
      starter.buzz = 4;
      starter.fatigue = 32;
    }
    return new SimulationEngine({
      version: 1,
      seed,
      labelName: options.labelName.trim().slice(0, 40) || "New Horizon Music",
      logo: options.logo,
      strategy: options.strategy,
      market: options.market,
      week: 1,
      cash: options.sandbox ? clamp(options.startingBudget || strategy.cash, 25_000, 2_000_000) : challenge?.cash ?? strategy.cash,
      reputation: 12,
      credibility: strategy.credibility,
      fanbase: 0,
      marketingPower: strategy.marketing,
      artists,
      songs: [],
      campaigns: [],
      chart: [],
      news: [{ id: "launch", week: 1, tone: "good", text: `${options.labelName} opens its doors in ${options.market}. The industry is watching.` }],
      achievements: [],
      tutorialComplete: false,
      difficulty: options.difficulty || "competitive",
      challengeId: options.challengeId || null,
      staff: [],
      tours: [],
      trends: [],
      socialFeed: [],
      pendingEvent: null,
      totalRevenue: 0,
      totalExpenses: 0,
      awardsWon: 0,
      toursCompleted: 0,
      companyValuation: options.sandbox ? clamp(options.startingBudget || strategy.cash, 25_000, 2_000_000) : challenge?.cash ?? strategy.cash,
      sandbox: Boolean(options.sandbox),
      aiAggression: clamp(options.aiAggression ?? 50),
      trendVolatility: clamp(options.trendVolatility ?? 50),
      insolvent: false,
      debtWeeks: 0,
      loans: [],
      upgrades: [],
      vinyls: [],
      merch: [],
      activeBuyout: null,
      awards: [],
      fanClubFunding: "none",
      hallOfFame: [],
      rivalSpecialties: {
        "Velvet Circuit": "Synth Soul",
        "Chrome Lotus Records": "Neon Pop",
        "Moonshot Melody Group": "Alt-Rock",
        "Northstar Audio": "Cloud Rap"
      }
    });
  }

  scoutCandidates(): Artist[] {
    const candidates = this.state.artists.filter((artist) => !artist.signed).slice(0, 12);
    const upgrades = this.state.upgrades || [];
    return candidates.map(artist => {
      let talent = artist.talent;
      let appeal = artist.appeal;
      let buzz = artist.buzz;
      if (upgrades.includes("regional-scouting")) {
        talent = Math.min(100, talent + 5);
      }
      if (upgrades.includes("international-partnership")) {
        appeal = Math.min(100, appeal + 8);
        buzz = Math.min(100, buzz + 8);
      }
      return { ...artist, talent, appeal, buzz };
    });
  }

  signArtist(artistId: string): void {
    const candidates = this.scoutCandidates();
    const candidate = candidates.find((c) => c.id === artistId);
    if (!candidate) throw new Error("Artist candidate not found.");
    
    const artist = this.requireArtist(artistId);
    if (artist.signed) return;
    const advance = artist.weeklyCost * 4;
    if (this.state.cash < advance) throw new Error("Not enough cash for the signing advance.");
    artist.signed = true;
    artist.contractWeeks = 104;
    artist.morale = clamp(artist.morale + 8);
    artist.talent = candidate.talent;
    artist.appeal = candidate.appeal;
    artist.buzz = candidate.buzz;
    this.state.cash -= advance;
    this.addNews(`${artist.name} signs with ${this.state.labelName}.`, "good");
  }

  recordSong(artistId: string): Song {
    const artist = this.requireArtist(artistId);
    if (!artist.signed) throw new Error("Sign this artist before booking the studio.");
    const cost = 18000 + artist.talent * 120;
    if (this.state.cash < cost) throw new Error("Not enough cash for this studio session.");
    const title = this.songTitle();
    const quality = clamp(Math.round(artist.talent * 0.65 + artist.morale * 0.2 + this.staffBonus("A&R") * .25 + this.rng.int(-8, 14)));
    const song: Song = {
      id: `song-${crypto.randomUUID()}`,
      artistId,
      title,
      quality,
      status: "recorded",
      streams: 0,
      radioSpins: 0
    };
    this.state.songs.push(song);
    this.state.cash -= cost;
    artist.fatigue = clamp(artist.fatigue + 12);
    this.addNews(`${artist.name} completes “${title}” at ${quality}% master quality.`, quality > 75 ? "good" : "neutral");
    return song;
  }

  releaseSong(songId: string): void {
    const song = this.requireSong(songId);
    if (song.status === "released") return;
    song.status = "released";
    song.releaseWeek = this.state.week;
    const artist = this.requireArtist(song.artistId);
    artist.buzz = clamp(artist.buzz + 12);
    this.addNews(`“${song.title}” by ${artist.name} is out now across ${this.rng.pick(streamingPlatforms)}.`, "good");
  }

  launchCampaign(songId: string, type: Campaign["type"], spend: number): void {
    const song = this.requireSong(songId);
    if (song.status !== "released") throw new Error("Release the song before promoting it.");
    if (this.state.cash < spend) throw new Error("Not enough cash for this campaign.");
    this.state.cash -= spend;
    this.state.campaigns.push({ id: crypto.randomUUID(), songId, type, spend, startedWeek: this.state.week });
    const source = type === "radio" ? this.rng.pick(radioNetworks) : type === "press" ? this.rng.pick(publications) : this.rng.pick(streamingPlatforms);
    this.addNews(`${source} picks up the ${type} campaign for “${song.title}”.`, "good");
  }

  staffCandidates(): StaffMember[] {
    const hired = new Set(this.state.staff.map((member) => member.id));
    return generateStaff(this.state.seed, 20).filter((member) => !hired.has(member.id)).slice(0, 10);
  }

  hireStaff(staffId: string): void {
    const candidate = generateStaff(this.state.seed, 20).find((member) => member.id === staffId);
    if (!candidate) throw new Error("Staff candidate not found.");
    if (this.state.staff.some((member) => member.id === staffId)) return;
    const signingCost = candidate.weeklyCost * 2;
    if (this.state.cash < signingCost) throw new Error("Not enough cash to hire this team member.");
    this.state.cash -= signingCost;
    this.state.staff.push(candidate);
    this.addNews(`${candidate.name} joins ${this.state.labelName} as ${candidate.role}.`, "good");
  }

  bookTour(artistId: string, scale: "club" | "theater" | "festival"): Tour {
    const artist = this.requireArtist(artistId);
    if (!artist.signed) throw new Error("Only signed artists can tour.");
    if (artist.fatigue > 75) throw new Error("This artist is too fatigued to tour safely.");
    const config = {
      club: { cost: 22_000, capacity: 450, price: 24, weeks: 2, markets: 3 },
      theater: { cost: 68_000, capacity: 1600, price: 38, weeks: 4, markets: 5 },
      festival: { cost: 110_000, capacity: 5200, price: 52, weeks: 3, markets: 4 }
    }[scale];
    const touringSkill = this.staffBonus("Touring");
    const cost = Math.round(config.cost * (1 - touringSkill * 0.002));
    if (this.state.cash < cost) throw new Error("Not enough cash to book this tour.");
    this.state.cash -= cost;
    const tour: Tour = {
      id: crypto.randomUUID(),
      artistId,
      name: `${artist.name} ${scale === "festival" ? "Festival Run" : scale === "theater" ? "Signal Theater Tour" : "Night Circuit"}`,
      markets: this.shuffleMarkets(config.markets),
      weeksRemaining: config.weeks,
      capacity: config.capacity,
      ticketPrice: config.price,
      bookedCost: cost,
      revenue: 0
    };
    this.state.tours.push(tour);
    artist.fatigue = clamp(artist.fatigue + 10);
    this.addNews(`${tour.name} is booked across ${tour.markets.join(", ")}.`, "good");
    return tour;
  }

  resolveEvent(choiceId: string): void {
    const event = this.state.pendingEvent;
    if (!event) throw new Error("No event is waiting for a decision.");
    const choice = event.choices.find((item) => item.id === choiceId);
    if (!choice) throw new Error("Event choice not found.");
    if (choice.cash < 0 && this.state.cash + choice.cash < -100_000) throw new Error("The label cannot finance this response.");
    
    if (event.id.startsWith("event-renegotiate-")) {
      const artistId = event.id.replace("event-renegotiate-", "");
      const artist = this.state.artists.find((a) => a.id === artistId);
      if (artist && choiceId.startsWith("choice-royalty-")) {
        artist.royaltyRate = (artist.royaltyRate || 20) + 10;
        artist.weeklyCost = Math.round(artist.weeklyCost * 1.25);
      }
    }

    this.state.cash += choice.cash;
    this.state.reputation = clamp(this.state.reputation + choice.reputation);
    for (const artist of this.state.artists.filter((item) => item.signed)) {
      artist.morale = clamp(artist.morale + choice.morale);
      artist.buzz = clamp(artist.buzz + choice.buzz);
    }
    this.addNews(`${event.title}: ${choice.label}.`, choice.reputation >= 3 ? "good" : choice.reputation < 0 ? "danger" : "neutral");
    this.state.pendingEvent = null;
  }

  takeEmergencyLoan(): void {
    if (this.state.cash >= 0) throw new Error("Loans are only available as emergency financing when in debt.");
    this.state.loans ||= [];
    if (this.state.loans.length >= 3) throw new Error("Maximum of 3 active loans allowed simultaneously.");
    const principal = 75000;
    const weeklyRepayment = 2500;
    const weeksRemaining = 40;
    this.state.cash += principal;
    this.state.loans.push({
      id: `loan-${crypto.randomUUID()}`,
      principal,
      weeklyRepayment,
      weeksRemaining
    });
    this.state.debtWeeks = 0;
    this.addNews(`Emergency financing secured: €75K principal with weekly repayment structured over 40 weeks.`, "good");
  }

  buyUpgrade(upgradeId: string): void {
    this.state.upgrades ||= [];
    if (this.state.upgrades.includes(upgradeId)) throw new Error("This upgrade is already unlocked.");
    let cost = 0;
    if (upgradeId === "regional-scouting") cost = 30000;
    else if (upgradeId === "international-partnership") cost = 75000;
    else throw new Error("Invalid upgrade selection.");

    if (this.state.cash < cost) throw new Error("Not enough cash to purchase this network upgrade.");
    this.state.cash -= cost;
    this.state.upgrades.push(upgradeId);
    this.addNews(`Network upgrade unlocked: ${upgradeId === "regional-scouting" ? "Regional Scouting Network" : "International A&R Partnership"}.`, "good");
  }

  orderVinyl(songId: string, quantity: number): void {
    const song = this.requireSong(songId);
    const cost = quantity * 3;
    if (this.state.cash < cost) throw new Error("Not enough cash to finance this vinyl production run.");

    this.state.vinyls ||= [];
    let vinyl = this.state.vinyls.find(v => v.songId === songId);
    if (!vinyl) {
      vinyl = {
        songId,
        stock: 0,
        ordered: 0,
        unitCost: 3,
        sold: 0,
        revenue: 0
      };
      this.state.vinyls.push(vinyl);
    }

    this.state.cash -= cost;
    vinyl.stock += quantity;
    vinyl.ordered += quantity;

    this.addNews(`Ordered production run of ${quantity.toLocaleString()} physical vinyl units for “${song.title}”.`, "good");
  }

  launchMerch(artistId: string): void {
    const artist = this.requireArtist(artistId);
    if (!artist.signed) throw new Error("Artist must be signed to route merchandise lines.");
    const cost = 8000;
    if (this.state.cash < cost) throw new Error("Not enough cash to launch this merchandise campaign.");

    this.state.merch ||= [];
    let campaign = this.state.merch.find(m => m.artistId === artistId);
    if (campaign && campaign.active) throw new Error("An active merchandise campaign is already running for this artist.");

    if (!campaign) {
      campaign = {
        artistId,
        active: true,
        weeksRemaining: 12,
        price: 35
      };
      this.state.merch.push(campaign);
    } else {
      campaign.active = true;
      campaign.weeksRemaining = 12;
    }

    this.state.cash -= cost;
    artist.morale = clamp(artist.morale + 10);
    this.addNews(`Launched exclusive merchandise and apparel line for ${artist.name} (€8K setup).`, "good");
  }

  acceptBuyout(): void {
    const offer = this.state.activeBuyout;
    if (!offer) throw new Error("No active buyout offer exists.");

    const artist = this.state.artists.find(a => a.id === offer.artistId);
    if (!artist) throw new Error("Artist in offer not found.");

    if (offer.type === "buy") {
      artist.signed = false;
      artist.contractWeeks = 0;
      artist.fatigue = 0;
      this.state.cash += offer.price;
      this.addNews(`Transfer complete: sold ${artist.name}'s contract to ${offer.label} for €${offer.price.toLocaleString()}.`, "good");
    } else {
      if (this.state.cash < offer.price) throw new Error("Not enough cash to complete this contract buyout.");
      this.state.cash -= offer.price;
      artist.signed = true;
      artist.contractWeeks = 104;
      artist.morale = clamp(artist.morale + 15);
      this.addNews(`Transfer complete: purchased ${artist.name}'s contract from ${offer.label} for €${offer.price.toLocaleString()}.`, "good");
    }

    this.state.activeBuyout = null;
  }

  declineBuyout(): void {
    const offer = this.state.activeBuyout;
    if (!offer) throw new Error("No active buyout offer exists.");

    if (offer.type === "buy") {
      const artist = this.state.artists.find(a => a.id === offer.artistId);
      if (artist) {
        artist.morale = clamp(artist.morale - 15);
        this.addNews(`Declined buyout: blocked ${artist.name}'s transfer request. Artist morale decreased.`, "danger");
      }
    } else {
      this.addNews(`Declined transfer offer from ${offer.label}.`, "neutral");
    }

    this.state.activeBuyout = null;
  }

  setArtistSpotifyId(artistId: string, spotifyId: string | null): void {
    const artist = this.requireArtist(artistId);
    if (!artist.signed) throw new Error("Artist must be signed to map their Spotify profile.");
    artist.spotifyId = spotifyId ? spotifyId.trim() : null;
  }

  shootMusicVideo(songId: string, scale: "diy" | "visualizer" | "cinematic" | "cgi"): void {
    const song = this.requireSong(songId);
    if (song.videoQuality) throw new Error("A music video is already produced for this release.");
    
    let cost = 0;
    let buzzBonus = 0;
    if (scale === "diy") { cost = 5000; buzzBonus = 5; }
    else if (scale === "visualizer") { cost = 15000; buzzBonus = 15; }
    else if (scale === "cinematic") { cost = 40000; buzzBonus = 35; }
    else if (scale === "cgi") { cost = 80000; buzzBonus = 65; }
    else throw new Error("Invalid video scale.");

    if (this.state.cash < cost) throw new Error("Not enough cash to finance this video production scale.");
    this.state.cash -= cost;
    song.videoQuality = scale;
    song.videoViews = 0;

    const artist = this.requireArtist(song.artistId);
    artist.buzz = clamp(artist.buzz + buzzBonus);
    
    this.addNews(`Visual launch: Produced ${scale.toUpperCase()} music video for “${song.title}” (€${cost.toLocaleString()} budget). Artist buzz increased.`, "good");
  }

  setFanClubFunding(funding: "none" | "street" | "app" | "party"): void {
    this.state.fanClubFunding = funding;
    this.addNews(`Community strategy: Set weekly fan club app & community funding to ${funding.toUpperCase()}.`, "neutral");
  }

  private runAwardsCeremony(): void {
    const year = Math.floor(this.state.week / 52);
    const pastYearSongs = this.state.songs.filter(
      (song) => song.releaseWeek && this.state.week - song.releaseWeek <= 52
    );

    this.state.awards ||= [];

    if (pastYearSongs.length > 0) {
      pastYearSongs.sort((a, b) => b.quality - a.quality);
      const bestSong = pastYearSongs[0]!;
      const artist = this.state.artists.find((a) => a.id === bestSong.artistId)!;

      const qualityScore = bestSong.quality;
      const winChance = (qualityScore / 100) * 0.45;

      const won = this.rng.next() < winChance;
      if (won) {
        this.state.awardsWon += 1;
        artist.morale = clamp(artist.morale + 50);
        this.state.reputation = clamp(this.state.reputation + 25);
        const awardTitle = `Sound Awards Y${year} - Record of the Year: “${bestSong.title}” by ${artist.name}`;
        this.state.awards.push(awardTitle);
        this.addNews(`★ WINNER: “${bestSong.title}” wins Record of the Year at the annual Sound Awards! Label reputation +25, artist morale maximized.`, "good");
        return;
      }
    }

    const aiNominees = [
      { title: "Neon Horizon", artist: "Midnight Arcade", label: "Velvet Circuit" },
      { title: "Digital Eclipse", artist: "Juno Monroe", label: "Chrome Lotus Records" },
      { title: "Ghost Signals", artist: "Soren Bloom", label: "Moonshot Melody Group" }
    ];
    const winner = this.rng.pick(aiNominees);
    this.addNews(`★ SOUND AWARDS Y${year}: “${winner.title}” by ${winner.artist} (${winner.label}) wins Record of the Year.`, "neutral");
  }

  endWeek(): WeekReport {
    let revenue = 0;
    let expenses = 0;
    let fanGrowth = 0;
    const scores: Array<{ song: Song; score: number }> = [];

    for (const artist of this.state.artists.filter((item) => item.signed)) {
      expenses += Math.round(artist.weeklyCost * (1 - Math.min(0.12, this.staffBonus("Finance") * .002)));
      artist.contractWeeks = Math.max(0, artist.contractWeeks - 1);
      artist.fatigue = clamp(artist.fatigue - 4);
      artist.morale = clamp(artist.morale + (artist.fatigue > 75 ? -4 : 1));
    }

    for (const staff of this.state.staff) expenses += Math.round(staff.weeklyCost * (1 - Math.min(0.08, this.staffBonus("Finance") * .001)));

    const activeLoans = this.state.loans || [];
    for (const loan of activeLoans) {
      expenses += loan.weeklyRepayment;
      loan.weeksRemaining -= 1;
    }
    this.state.loans = activeLoans.filter((loan) => loan.weeksRemaining > 0);

    const funding = this.state.fanClubFunding || "none";
    let fanClubCost = 0;
    let fanClubGrowth = 0;
    if (funding === "street") {
      fanClubCost = 2000;
      fanClubGrowth = 350;
      const signed = this.state.artists.filter(a => a.signed);
      if (signed.length > 0) {
        const artist = this.rng.pick(signed);
        artist.buzz = clamp(artist.buzz + 5);
      }
    } else if (funding === "app") {
      fanClubCost = 6000;
      fanClubGrowth = 1200;
      for (const artist of this.state.artists.filter(a => a.signed)) {
        artist.morale = clamp(artist.morale + 10);
      }
    } else if (funding === "party") {
      fanClubCost = 12000;
      fanClubGrowth = 3000;
    }
    expenses += fanClubCost;
    fanGrowth += fanClubGrowth;

    const vinyls = this.state.vinyls || [];
    for (const vinyl of vinyls) {
      if (vinyl.stock > 0) {
        const song = this.state.songs.find(s => s.id === vinyl.songId);
        const artist = song ? this.state.artists.find(a => a.id === song.artistId) : null;
        const buzz = artist ? artist.buzz : 30;
        const streams = song ? song.streams : 0;
        const baseSales = Math.round((streams / 25000) + (buzz * 2.5) + this.rng.int(-15, 25));
        const actualSales = Math.min(vinyl.stock, Math.max(0, baseSales));
        vinyl.stock -= actualSales;
        vinyl.sold += actualSales;
        const weeklyRevenue = actualSales * 25;
        vinyl.revenue += weeklyRevenue;
        revenue += weeklyRevenue;

        if (vinyl.stock === 0 && actualSales > 0 && song) {
          this.addNews(`Physical Release Sold Out: Vinyl stock for “${song.title}” is fully depleted! Grossed €${vinyl.revenue.toLocaleString()} in physical sales.`, "good");
        }
      }
    }

    const merchCampaigns = this.state.merch || [];
    for (const campaign of merchCampaigns) {
      if (campaign.active && campaign.weeksRemaining > 0) {
        const artist = this.state.artists.find(a => a.id === campaign.artistId);
        if (artist) {
          const sales = Math.round((this.state.fanbase * 0.005) + (artist.appeal * 0.8) + this.rng.int(-4, 8));
          const weeklyRevenue = Math.max(0, sales * campaign.price);
          revenue += weeklyRevenue;
          campaign.weeksRemaining -= 1;
          if (campaign.weeksRemaining <= 0) {
            campaign.active = false;
            this.addNews(`Merchandise Campaign for ${artist.name} has concluded.`, "neutral");
          }
        }
      }
    }


    for (const song of this.state.songs.filter((item) => item.status === "released")) {
      const artist = this.requireArtist(song.artistId);
      const campaigns = this.state.campaigns.filter((campaign) => campaign.songId === song.id && this.state.week - campaign.startedWeek <= 3);
      const marketingBonus = this.staffBonus("Marketing") + this.staffBonus("Radio") * (campaigns.some((campaign) => campaign.type === "radio") ? 0.7 : 0);
      const trendBonus = this.state.trends.filter((trend) => trend.genre === artist.genre).reduce((sum, trend) => sum + trend.strength, 0);
      const campaignPower = campaigns.reduce((sum, campaign) => sum + campaign.spend / 1200, 0) + marketingBonus + trendBonus;
      
      let scoreMultiplier = 1;
      if (song.videoQuality === "cinematic") scoreMultiplier = 1.25;
      else if (song.videoQuality === "cgi") scoreMultiplier = 1.5;

      const decay = Math.max(0.3, 1 - (this.state.week - (song.releaseWeek ?? this.state.week)) * 0.07);
      
      let aiAggressionBonus = 0;
      for (const [rivalLabel, specialtyGenre] of Object.entries(this.state.rivalSpecialties || {})) {
        if (artist.genre === specialtyGenre && this.rng.next() < 0.28) {
          aiAggressionBonus -= 15;
          this.addNews(`Genre War: ${rivalLabel} mounts a competitive single release in ${specialtyGenre} to counter “${song.title}”. Chart difficulty increased.`, "danger");
        }
      }

      const score = Math.max(10, Math.round(((song.quality * 1.4 + artist.appeal + artist.buzz + campaignPower + this.rng.int(-24, 30)) * decay + aiAggressionBonus) * scoreMultiplier));
      
      const streamsMultiplier = this.state.fanClubFunding === "party" ? 1.12 : 1.0;
      const streams = Math.round(Math.max(800, score * score * 34) * streamsMultiplier);
      const radio = Math.max(0, Math.round(score * 1.6 + campaigns.filter((campaign) => campaign.type === "radio").length * 180));
      
      song.streams += streams;
      song.radioSpins += radio;
      revenue += Math.round(streams * 0.0035 + radio * 2.1);
      const newFans = Math.round(streams / 135);
      fanGrowth += newFans;
      artist.buzz = clamp(artist.buzz + Math.round(score / 45) - 2);
      
      if (song.videoQuality) {
        const viewPower = song.videoQuality === "cgi" ? 1.5 : song.videoQuality === "cinematic" ? 1.25 : song.videoQuality === "visualizer" ? 0.9 : 0.5;
        song.videoViews = (song.videoViews || 0) + Math.round(streams * viewPower + this.rng.int(100, 2000));
      }

      this.state.hallOfFame ||= [];
      if (song.streams >= 5000000 && song.certification !== "diamond") {
        song.certification = "diamond";
        this.addNews(`★ DIAMOND AWARD: “${song.title}” by ${artist.name} is certified Diamond (5M+ streams)!`, "good");
        this.state.hallOfFame.push(`W${this.state.week} - Diamond Single: “${song.title}” by ${artist.name}`);
        this.state.reputation = clamp(this.state.reputation + 15);
      } else if (song.streams >= 1000000 && song.certification !== "platinum" && song.certification !== "diamond") {
        song.certification = "platinum";
        this.addNews(`★ PLATINUM AWARD: “${song.title}” by ${artist.name} is certified Platinum (1M+ streams)!`, "good");
        this.state.hallOfFame.push(`W${this.state.week} - Platinum Single: “${song.title}” by ${artist.name}`);
        this.state.reputation = clamp(this.state.reputation + 8);
      } else if (song.streams >= 500000 && !song.certification) {
        song.certification = "gold";
        this.addNews(`★ GOLD AWARD: “${song.title}” by ${artist.name} is certified Gold (500K+ streams)!`, "good");
        this.state.hallOfFame.push(`W${this.state.week} - Gold Single: “${song.title}” by ${artist.name}`);
        this.state.reputation = clamp(this.state.reputation + 4);
      }

      scores.push({ song, score });
    }

    for (const tour of this.state.tours) {
      const artist = this.requireArtist(tour.artistId);
      const attendance = clamp((artist.appeal + artist.buzz + this.staffBonus("Touring") + this.rng.int(-20, 25)) / 120, 0.18, 1);
      const tourRevenue = Math.round(tour.capacity * tour.ticketPrice * attendance);
      tour.revenue += tourRevenue;
      revenue += tourRevenue;
      fanGrowth += Math.round(tour.capacity * attendance * 0.35);
      tour.weeksRemaining -= 1;
      artist.fatigue = clamp(artist.fatigue + 8);
      artist.morale = clamp(artist.morale + (attendance > 0.72 ? 3 : -2));
      if (tour.weeksRemaining === 0) {
        this.state.toursCompleted += 1;
        this.addNews(`${tour.name} closes with ${formatCompact(tour.revenue)} in gross ticket revenue.`, tour.revenue > tour.bookedCost * 1.5 ? "good" : "neutral");
      }
    }
    this.state.tours = this.state.tours.filter((tour) => tour.weeksRemaining > 0);

    this.state.cash += revenue - expenses;
    if (this.state.cash < 0) {
      this.state.debtWeeks = (this.state.debtWeeks || 0) + 1;
      if (this.state.debtWeeks >= 5) {
        this.state.insolvent = true;
      }
    } else {
      this.state.debtWeeks = 0;
    }
    this.state.totalRevenue += revenue;
    this.state.totalExpenses += expenses;
    this.state.fanbase += fanGrowth;
    this.state.reputation = clamp(this.state.reputation + Math.round(fanGrowth / 3500));
    this.state.week += 1;
    this.state.chart = this.buildChart(scores);
    const peakChart = this.state.chart.find((entry) => entry.playerOwned)?.position ?? null;
    const headline = this.weeklyHeadline(peakChart);
    this.addNews(headline, peakChart && peakChart <= 10 ? "good" : "neutral");
    this.unlockAchievements(peakChart);
    this.updateTrends();
    this.generateSocialPost(peakChart);
    if (!this.state.pendingEvent) {
      const signedArtists = this.state.artists.filter((a) => a.signed);
      for (const artist of signedArtists) {
        if (artist.buzz > 80 && artist.weeklyCost < 2500 && this.rng.next() < 0.15) {
          this.state.pendingEvent = {
            id: `event-renegotiate-${artist.id}`,
            title: `${artist.name} Demands Raise`,
            description: `Following recent chart buzz and rising stream count, ${artist.name} is demanding a contract renegotiation. They want an immediate cash bonus or a higher royalty share. Ignoring them will tank their morale.`,
            category: "crisis",
            choices: [
              {
                id: `choice-bonus-${artist.id}`,
                label: `Pay €25K signing bonus to maintain contract`,
                cash: -25000,
                reputation: 2,
                morale: 30,
                buzz: 5
              },
              {
                id: `choice-royalty-${artist.id}`,
                label: `Increase royalty share (+10% royalty rate)`,
                cash: 0,
                reputation: 0,
                morale: 20,
                buzz: 0
              },
              {
                id: `choice-refuse-${artist.id}`,
                label: `Refuse raise request`,
                cash: 0,
                reputation: -1,
                morale: -35,
                buzz: -5
              }
            ]
          };
          break;
        }
        if (artist.morale < 15 && this.rng.next() < 0.20) {
          this.state.pendingEvent = {
            id: `event-morale-${artist.id}`,
            title: `${artist.name} Burnout Crisis`,
            description: `Exhausted and demotivated, ${artist.name} is threatening to cancel all upcoming recording sessions unless you fund a restorative retreat.`,
            category: "crisis",
            choices: [
              {
                id: `choice-retreat-${artist.id}`,
                label: `Fund retreat package (€12,000)`,
                cash: -12000,
                reputation: 1,
                morale: 40,
                buzz: 0
              },
              {
                id: `choice-ignore-${artist.id}`,
                label: `Command them to work anyway`,
                cash: 0,
                reputation: -2,
                morale: -15,
                buzz: -5
              }
            ]
          };
          break;
        }
      }
      if (!this.state.pendingEvent && this.rng.next() < this.eventChance()) {
        this.state.pendingEvent = this.createEvent();
      }
    }
    if (peakChart === 1 && this.rng.next() < 0.18) {
      this.state.awardsWon += 1;
      this.addNews(`${this.state.labelName} wins the fictional Global Sound Prize jury spotlight.`, "good");
    }

    if (this.state.week % 52 === 0) {
      this.runAwardsCeremony();
    }

    this.state.activeBuyout = null;
    if (this.rng.next() < 0.12) {
      const signedArtists = this.state.artists.filter((a) => a.signed);
      if (signedArtists.length > 0 && this.rng.next() < 0.5) {
        const artist = this.rng.pick(signedArtists);
        if (artist.buzz > 65) {
          const labels = ["Velvet Circuit", "Chrome Lotus Records", "Moonshot Melody Group", "Northstar Audio"];
          const label = this.rng.pick(labels);
          const price = Math.round(artist.weeklyCost * 80 + artist.buzz * 650);
          this.state.activeBuyout = {
            id: `buyout-${crypto.randomUUID()}`,
            type: "buy",
            artistId: artist.id,
            label,
            price
          };
          this.addNews(`Transfer request: ${label} has submitted a €${formatCompact(price)} buyout offer for ${artist.name}.`, "neutral");
        }
      } else if (this.state.cash > 90000) {
        const unsigned = this.state.artists.filter((a) => !a.signed);
        if (unsigned.length > 0) {
          const artist = this.rng.pick(unsigned);
          const labels = ["Velvet Circuit", "Chrome Lotus Records", "Moonshot Melody Group", "Northstar Audio"];
          const label = this.rng.pick(labels);
          const price = Math.round(artist.weeklyCost * 30);
          this.state.activeBuyout = {
            id: `buyout-${crypto.randomUUID()}`,
            type: "sell",
            artistId: artist.id,
            label,
            price
          };
          this.addNews(`Contract buyout offer: ${label} offers to transfer ${artist.name}'s rights to you for €${formatCompact(price)}.`, "neutral");
        }
      }
    }

    this.state.companyValuation = Math.max(0, Math.round(this.state.cash + this.state.fanbase * 4 + this.state.songs.reduce((sum, song) => sum + song.streams * 0.06, 0) + this.state.reputation * 20_000));
    this.state.tutorialComplete = this.state.tutorialComplete || this.state.week > 4;
    this.state.seed = this.rng.seed;
    return { revenue, expenses, fanGrowth, peakChart, headline };
  }

  private buildChart(playerScores: Array<{ song: Song; score: number }>): ChartEntry[] {
    const entries: ChartEntry[] = playerScores.map(({ song, score }) => {
      const artist = this.requireArtist(song.artistId);
      return { position: 0, title: song.title, artist: artist.name, label: this.state.labelName, score, playerOwned: true };
    });
    for (let index = 0; index < 20; index += 1) {
      entries.push({
        position: 0,
        title: this.songTitle(),
        artist: `${this.rng.pick(["Luma", "Kori", "Zen", "Aya", "Melo", "Oren"])} ${this.rng.pick(["Blue", "Ray", "Fox", "June", "Vale", "Sky"])}`,
        label: this.rng.pick(aiLabels),
        score: this.rng.int(105 + Math.round(this.state.aiAggression * .2), 245 + Math.round(this.state.aiAggression * .8)),
        playerOwned: false
      });
    }
    const chart = entries.sort((a, b) => b.score - a.score).slice(0, 20).map((entry, index) => ({ ...entry, position: index + 1 }));
    for (const entry of chart.filter((item) => item.playerOwned)) {
      const song = this.state.songs.find((item) => item.title === entry.title && this.requireArtist(item.artistId).name === entry.artist);
      if (song) {
        song.chartPosition = entry.position;
        song.peakPosition = Math.min(song.peakPosition || 100, entry.position);
      }
    }
    return chart;
  }

  private weeklyHeadline(peak: number | null): string {
    if (peak === 1) return `${this.state.labelName} captures the Global Pulse #1 and showers the office in neon confetti.`;
    if (peak && peak <= 10) return `${this.rng.pick(publications)} calls ${this.state.labelName} the week's breakout story after a Top 10 surge.`;
    if (this.state.cash < 0) return `Finance alarms flash at ${this.state.labelName}; the next release must land.`;
    return `${this.rng.pick(aiLabels)} makes an aggressive move while ${this.state.labelName} develops its next campaign.`;
  }

  private unlockAchievements(peak: number | null): void {
    const unlock = (name: string, condition: boolean) => {
      if (condition && !this.state.achievements.includes(name)) this.state.achievements.push(name);
    };
    unlock("Bedroom Mogul", this.state.songs.length >= 1);
    unlock("Radio Breakthrough", this.state.songs.some((song) => song.radioSpins >= 1000));
    unlock("Viral Spark", this.state.fanbase >= 10000);
    unlock("Global Breakout", peak !== null && peak <= 10);
    unlock("Streaming Giant", this.state.songs.some((song) => song.streams >= 1_000_000));
    unlock("Staff Builder", this.state.staff.length >= 5);
    unlock("Tour Warrior", this.state.toursCompleted >= 5);
    unlock("Festival Headliner", this.state.fanbase >= 250_000);
    unlock("International Empire", this.state.fanbase >= 1_000_000);
  }

  private hydrate(state: GameState): GameState {
    return {
      ...state,
      difficulty: state.difficulty || "competitive",
      challengeId: state.challengeId || null,
      staff: state.staff || [],
      tours: state.tours || [],
      trends: state.trends || [],
      socialFeed: state.socialFeed || [],
      pendingEvent: state.pendingEvent || null,
      totalRevenue: state.totalRevenue || 0,
      totalExpenses: state.totalExpenses || 0,
      awardsWon: state.awardsWon || 0,
      toursCompleted: state.toursCompleted || 0,
      companyValuation: state.companyValuation || Math.max(0, state.cash),
      sandbox: state.sandbox || false,
      aiAggression: state.aiAggression ?? 50,
      trendVolatility: state.trendVolatility ?? 50,
      insolvent: state.insolvent || false,
      debtWeeks: state.debtWeeks || 0,
      loans: state.loans || [],
      upgrades: state.upgrades || [],
      vinyls: state.vinyls || [],
      merch: state.merch || [],
      activeBuyout: state.activeBuyout || null,
      awards: state.awards || [],
      fanClubFunding: state.fanClubFunding || "none",
      hallOfFame: state.hallOfFame || [],
      rivalSpecialties: state.rivalSpecialties || {
        "Velvet Circuit": "Synth Soul",
        "Chrome Lotus Records": "Neon Pop",
        "Moonshot Melody Group": "Alt-Rock",
        "Northstar Audio": "Cloud Rap"
      },
      artists: state.artists.map((artist) => ({ ...artist, contractWeeks: artist.contractWeeks || (artist.signed ? 104 : 0), royaltyRate: artist.royaltyRate || 20, spotifyId: artist.spotifyId || null })),
      songs: state.songs.map((song) => ({
        ...song,
        peakPosition: song.peakPosition || song.chartPosition,
        videoQuality: song.videoQuality || null,
        videoViews: song.videoViews || 0,
        certification: song.certification || null
      }))
    };
  }

  private staffBonus(role: StaffMember["role"]): number {
    return this.state.staff.filter((member) => member.role === role).reduce((sum, member) => sum + member.skill * 0.18, 0);
  }

  private shuffleMarkets(count: number): string[] {
    const available = [...new Set(this.state.artists.map((artist) => artist.market))];
    return Array.from({ length: Math.min(count, available.length) }, () => available.splice(this.rng.int(0, available.length - 1), 1)[0]!).filter(Boolean);
  }

  private updateTrends(): void {
    this.state.trends = this.state.trends.map((trend) => ({ ...trend, weeksRemaining: trend.weeksRemaining - 1 })).filter((trend) => trend.weeksRemaining > 0);
    const trendChance = 0.35 + this.state.trendVolatility * .006;
    if (this.state.trends.length < 3 && this.rng.next() < trendChance) {
      const name = this.rng.pick(trends);
      const genre = this.rng.pick(genres);
      const maxDuration = Math.max(5, 12 - Math.round(this.state.trendVolatility / 20));
      const trend: Trend = { id: crypto.randomUUID(), name, genre, strength: this.rng.int(8, 24), weeksRemaining: this.rng.int(3, maxDuration) };
      this.state.trends.push(trend);
      this.addNews(`${name} pushes ${genre} into the center of the fictional industry conversation.`, "neutral");
    }
  }

  private generateSocialPost(peak: number | null): void {
    const artist = this.state.artists.find((item) => item.signed);
    const post = peak && peak <= 10
      ? `Fans organize a midnight streaming party after ${artist?.name || this.state.labelName} reaches #${peak}.`
      : this.rng.pick([
          `Debate erupts over whether ${this.state.labelName} is spending enough on artist development.`,
          `A dance creator says the next ${this.state.labelName} hook could become a challenge.`,
          `Fans ask ${artist?.name || "the roster"} for tour dates in ${this.state.market}.`,
          `A critic thread praises the label's identity but questions its release pace.`
        ]);
    this.state.socialFeed.unshift({
      id: crypto.randomUUID(),
      week: this.state.week,
      platform: this.rng.pick(["FanWire", "ClipLoop", "Chorus Chat", "Scene"]),
      author: this.rng.pick(["@chartwatcher", "@indiefanclub", "@signalcritic", "@tourplease", "@hooktheory"]),
      text: post,
      sentiment: peak && peak <= 10 ? "hype" : this.rng.next() < 0.2 ? "backlash" : "debate"
    });
    this.state.socialFeed = this.state.socialFeed.slice(0, 40);
  }

  private eventChance(): number {
    const base = this.state.challengeId === "scandal" ? 0.75 : 0.38;
    return this.state.difficulty === "mogul" ? base + 0.12 : this.state.difficulty === "rising" ? base - 0.12 : base;
  }

  private createEvent(): PendingEvent {
    const template = this.rng.pick(eventCatalog);
    return { ...template, id: crypto.randomUUID(), choices: template.choices.map((choice) => ({ ...choice })) };
  }

  private songTitle(): string {
    return `${this.rng.pick(["Neon", "Midnight", "Golden", "After", "Paper", "Wild", "Electric", "Velvet", "Satellite", "Slow"])} ${this.rng.pick(["Hearts", "Signal", "Gravity", "Fever", "Skyline", "Bloom", "Motion", "Echo", "Summer", "Fire"])}`;
  }

  private addNews(text: string, tone: "good" | "neutral" | "danger"): void {
    this.state.news.unshift({ id: crypto.randomUUID(), week: this.state.week, tone, text });
    this.state.news = this.state.news.slice(0, 30);
  }

  private requireArtist(id: string): Artist {
    const artist = this.state.artists.find((item) => item.id === id);
    if (!artist) throw new Error("Artist not found.");
    return artist;
  }

  private requireSong(id: string): Song {
    const song = this.state.songs.find((item) => item.id === id);
    if (!song) throw new Error("Song not found.");
    return song;
  }
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat("en", { style: "currency", currency: "EUR", notation: "compact", maximumFractionDigits: 1 }).format(value);
}
