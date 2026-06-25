import { aiLabels, generateArtists, publications, radioNetworks, strategies, streamingPlatforms } from "../data/content";
import type { Artist, Campaign, ChartEntry, GameState, NewGameOptions, Song, WeekReport } from "../../types/game";
import { RNG } from "./RNG";

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export class SimulationEngine {
  private rng: RNG;

  constructor(public state: GameState) {
    this.rng = new RNG(state.seed + state.week * 7919);
  }

  static create(options: NewGameOptions): SimulationEngine {
    const seed = options.seed ?? Date.now() >>> 0;
    const strategy = strategies[options.strategy];
    return new SimulationEngine({
      version: 1,
      seed,
      labelName: options.labelName.trim().slice(0, 40) || "New Horizon Music",
      logo: options.logo,
      strategy: options.strategy,
      market: options.market,
      week: 1,
      cash: strategy.cash,
      reputation: 12,
      credibility: strategy.credibility,
      fanbase: 0,
      marketingPower: strategy.marketing,
      artists: generateArtists(seed),
      songs: [],
      campaigns: [],
      chart: [],
      news: [{ id: "launch", week: 1, tone: "good", text: `${options.labelName} opens its doors in ${options.market}. The industry is watching.` }],
      achievements: [],
      tutorialComplete: false
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

  endWeek(): WeekReport {
    let revenue = 0;
    let expenses = 0;
    let fanGrowth = 0;
    const scores: Array<{ song: Song; score: number }> = [];

    for (const artist of this.state.artists.filter((item) => item.signed)) {
      expenses += artist.weeklyCost;
      artist.fatigue = clamp(artist.fatigue - 4);
      artist.morale = clamp(artist.morale + (artist.fatigue > 75 ? -4 : 1));
    }

    for (const song of this.state.songs.filter((item) => item.status === "released")) {
      const artist = this.requireArtist(song.artistId);
      const campaigns = this.state.campaigns.filter((campaign) => campaign.songId === song.id && this.state.week - campaign.startedWeek <= 3);
      const campaignPower = campaigns.reduce((sum, campaign) => sum + campaign.spend / 1200, 0);
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

    this.state.cash += revenue - expenses;
    this.state.fanbase += fanGrowth;
    this.state.reputation = clamp(this.state.reputation + Math.round(fanGrowth / 3500));
    this.state.week += 1;
    this.state.chart = this.buildChart(scores);
    const peakChart = this.state.chart.find((entry) => entry.playerOwned)?.position ?? null;
    const headline = this.weeklyHeadline(peakChart);
    this.addNews(headline, peakChart && peakChart <= 10 ? "good" : "neutral");
    this.unlockAchievements(peakChart);
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
    return entries.sort((a, b) => b.score - a.score).slice(0, 20).map((entry, index) => ({ ...entry, position: index + 1 }));
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
