export type StrategyId =
  | "indie"
  | "idol"
  | "viral"
  | "radio"
  | "electronic"
  | "hiphop"
  | "rock"
  | "fusion"
  | "boutique"
  | "hitfactory"
  | "soul"
  | "novelty";

export type GameView = "dashboard" | "scout" | "roster" | "studio" | "marketing" | "charts" | "finance";

export interface Artist {
  id: string;
  name: string;
  genre: string;
  market: string;
  talent: number;
  appeal: number;
  loyalty: number;
  morale: number;
  fatigue: number;
  buzz: number;
  weeklyCost: number;
  signed: boolean;
}

export interface Song {
  id: string;
  artistId: string;
  title: string;
  quality: number;
  status: "recorded" | "released";
  releaseWeek?: number;
  streams: number;
  radioSpins: number;
  chartPosition?: number;
}

export interface Campaign {
  id: string;
  songId: string;
  type: "social" | "radio" | "press" | "playlist" | "fanclub";
  spend: number;
  startedWeek: number;
}

export interface NewsItem {
  id: string;
  week: number;
  tone: "good" | "neutral" | "danger";
  text: string;
}

export interface ChartEntry {
  position: number;
  title: string;
  artist: string;
  label: string;
  score: number;
  playerOwned: boolean;
}

export interface GameState {
  version: 1;
  seed: number;
  labelName: string;
  logo: string;
  strategy: StrategyId;
  market: string;
  week: number;
  cash: number;
  reputation: number;
  credibility: number;
  fanbase: number;
  marketingPower: number;
  artists: Artist[];
  songs: Song[];
  campaigns: Campaign[];
  chart: ChartEntry[];
  news: NewsItem[];
  achievements: string[];
  tutorialComplete: boolean;
}

export interface NewGameOptions {
  labelName: string;
  logo: string;
  strategy: StrategyId;
  market: string;
  seed?: number;
}

export interface WeekReport {
  revenue: number;
  expenses: number;
  fanGrowth: number;
  peakChart: number | null;
  headline: string;
}
