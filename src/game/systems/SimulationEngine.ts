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
    const artists = generateArtists(seed);
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
      cash: challenge?.cash ?? strategy.cash,
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
      companyValuation: challenge?.cash ?? strategy.cash
    });
  }

  scoutCandidates(): Artist[] {
    return this.state.artists.filter((artist) => !artist.signed).slice(0, 12);
  }

  signArtist(artistId: string): void {
    const artist = this.requireArtist(artistId);
    if (artist.signed) return;
    const advance = artist.weeklyCost * 4;
    if (this.state.cash < advance) throw new Error("Not enough cash for the signing advance.");
    artist.signed = true;
    artist.contractWeeks = 104;
    artist.morale = clamp(artist.morale + 8);
    this.state.cash -= advance;
    this.addNews(`${artist.name} signs with ${this.state.labelName}.`, "good");
  }

  recordSong(artistId: string): Song {
    const artist = this.requireArtist(artistId);
    if (!artist.signed) throw new Error("Sign this artist before booking the studio.");
    const cost = 18000 + artist.talent * 120;
    if (this.state.cash < cost) throw new Error("Not enough cash for this studio session.");
    const title = this.songTitle();
    const quality = clamp(Math.round(artist.talent * 0.65 + artist.morale * 0.2 + this.rng.int(-8, 14)));
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
    this.state.cash += choice.cash;
    this.state.reputation = clamp(this.state.reputation + choice.reputation);
    for (const artist of this.state.artists.filter((item) => item.signed)) {
      artist.morale = clamp(artist.morale + choice.morale);
      artist.buzz = clamp(artist.buzz + choice.buzz);
    }
    this.addNews(`${event.title}: ${choice.label}.`, choice.reputation >= 3 ? "good" : choice.reputation < 0 ? "danger" : "neutral");
    this.state.pendingEvent = null;
  }

  endWeek(): WeekReport {
    let revenue = 0;
    let expenses = 0;
    let fanGrowth = 0;
    const scores: Array<{ song: Song; score: number }> = [];

    for (const artist of this.state.artists.filter((item) => item.signed)) {
      expenses += artist.weeklyCost;
      artist.contractWeeks = Math.max(0, artist.contractWeeks - 1);
      artist.fatigue = clamp(artist.fatigue - 4);
      artist.morale = clamp(artist.morale + (artist.fatigue > 75 ? -4 : 1));
    }

    for (const staff of this.state.staff) expenses += staff.weeklyCost;

    for (const song of this.state.songs.filter((item) => item.status === "released")) {
      const artist = this.requireArtist(song.artistId);
      const campaigns = this.state.campaigns.filter((campaign) => campaign.songId === song.id && this.state.week - campaign.startedWeek <= 3);
      const marketingBonus = this.staffBonus("Marketing") + this.staffBonus("Radio") * (campaigns.some((campaign) => campaign.type === "radio") ? 0.7 : 0);
      const trendBonus = this.state.trends.filter((trend) => trend.genre === artist.genre).reduce((sum, trend) => sum + trend.strength, 0);
      const campaignPower = campaigns.reduce((sum, campaign) => sum + campaign.spend / 1200, 0) + marketingBonus + trendBonus;
      const decay = Math.max(0.3, 1 - (this.state.week - (song.releaseWeek ?? this.state.week)) * 0.07);
      const score = Math.round((song.quality * 1.4 + artist.appeal + artist.buzz + campaignPower + this.rng.int(-24, 30)) * decay);
      const streams = Math.max(800, score * score * 34);
      const radio = Math.max(0, Math.round(score * 1.6 + campaigns.filter((campaign) => campaign.type === "radio").length * 180));
      song.streams += streams;
      song.radioSpins += radio;
      revenue += Math.round(streams * 0.0035 + radio * 2.1);
      const newFans = Math.round(streams / 135);
      fanGrowth += newFans;
      artist.buzz = clamp(artist.buzz + Math.round(score / 45) - 2);
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
    if (!this.state.pendingEvent && this.rng.next() < this.eventChance()) this.state.pendingEvent = this.createEvent();
    if (peakChart === 1 && this.rng.next() < 0.18) {
      this.state.awardsWon += 1;
      this.addNews(`${this.state.labelName} wins the fictional Global Sound Prize jury spotlight.`, "good");
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
        score: this.rng.int(115, 285),
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
      artists: state.artists.map((artist) => ({ ...artist, contractWeeks: artist.contractWeeks || (artist.signed ? 104 : 0), royaltyRate: artist.royaltyRate || 20 })),
      songs: state.songs.map((song) => ({ ...song, peakPosition: song.peakPosition || song.chartPosition }))
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
    if (this.state.trends.length < 3 && this.rng.next() < 0.65) {
      const name = this.rng.pick(trends);
      const genre = this.rng.pick(genres);
      const trend: Trend = { id: crypto.randomUUID(), name, genre, strength: this.rng.int(8, 24), weeksRemaining: this.rng.int(4, 10) };
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
