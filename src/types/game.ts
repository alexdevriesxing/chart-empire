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

export type GameView = "dashboard" | "scout" | "roster" | "studio" | "marketing" | "touring" | "staff" | "charts" | "finance";
export type Difficulty = "rising" | "competitive" | "mogul";

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
  contractWeeks: number;
  royaltyRate: number;
  spotifyId: string | null;
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
  peakPosition?: number;
  videoQuality?: "diy" | "visualizer" | "cinematic" | "cgi" | null;
  videoViews?: number;
  certification?: "gold" | "platinum" | "diamond" | null;
}

export interface Campaign {
  id: string;
  songId: string;
  type: "social" | "radio" | "press" | "playlist" | "fanclub" | "video" | "international";
  spend: number;
  startedWeek: number;
}

export interface NewsItem {
  id: string;
  week: number;
  tone: "good" | "neutral" | "danger";
  text: string;
}

export interface SocialPost {
  id: string;
  week: number;
  platform: string;
  author: string;
  text: string;
  sentiment: "hype" | "debate" | "backlash";
}

export interface Trend {
  id: string;
  name: string;
  genre: string;
  strength: number;
  weeksRemaining: number;
}

export interface StaffMember {
  id: string;
  name: string;
  role: "A&R" | "Marketing" | "Radio" | "Touring" | "Finance";
  skill: number;
  weeklyCost: number;
}

export interface Tour {
  id: string;
  artistId: string;
  name: string;
  markets: string[];
  weeksRemaining: number;
  capacity: number;
  ticketPrice: number;
  bookedCost: number;
  revenue: number;
}

export interface ActiveLoan {
  id: string;
  principal: number;
  weeklyRepayment: number;
  weeksRemaining: number;
}

export interface PendingEvent {
  id: string;
  title: string;
  description: string;
  category: "opportunity" | "crisis" | "industry";
  choices: Array<{ id: string; label: string; cash: number; reputation: number; morale: number; buzz: number }>;
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
  difficulty: Difficulty;
  challengeId: string | null;
  staff: StaffMember[];
  tours: Tour[];
  trends: Trend[];
  socialFeed: SocialPost[];
  pendingEvent: PendingEvent | null;
  totalRevenue: number;
  totalExpenses: number;
  awardsWon: number;
  toursCompleted: number;
  companyValuation: number;
  sandbox: boolean;
  aiAggression: number;
  trendVolatility: number;
  insolvent: boolean;
  debtWeeks: number;
  loans: ActiveLoan[];
  upgrades: string[];
  vinyls: VinylInventory[];
  merch: MerchCampaign[];
  activeBuyout: BuyoutOffer | null;
  awards: string[];
  fanClubFunding: "none" | "street" | "app" | "party";
  hallOfFame: string[];
  rivalSpecialties: Record<string, string>;
}

export interface VinylInventory {
  songId: string;
  stock: number;
  ordered: number;
  unitCost: number;
  sold: number;
  revenue: number;
}

export interface MerchCampaign {
  artistId: string;
  active: boolean;
  weeksRemaining: number;
  price: number;
}

export interface BuyoutOffer {
  id: string;
  type: "buy" | "sell";
  artistId: string;
  label: string;
  price: number;
}

export interface NewGameOptions {
  labelName: string;
  logo: string;
  strategy: StrategyId;
  market: string;
  seed?: number;
  difficulty?: Difficulty;
  challengeId?: string | null;
  sandbox?: boolean;
  startingBudget?: number;
  aiAggression?: number;
  trendVolatility?: number;
}

export interface WeekReport {
  revenue: number;
  expenses: number;
  fanGrowth: number;
  peakChart: number | null;
  headline: string;
}
