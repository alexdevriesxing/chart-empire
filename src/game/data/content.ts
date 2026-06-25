import type { Artist, PendingEvent, StaffMember, StrategyId } from "../../types/game";
import { RNG } from "../systems/RNG";

export const genres = [
  "Synth Soul", "Neon Pop", "Alt-Rock", "Cloud Rap", "Afro-Fusion", "Dream R&B",
  "Electro Folk", "Club Jazz", "Indie Dance", "Future Gospel", "Hyper Ballad", "Desert Disco"
] as const;

export const markets = [
  "Amsterdam", "London", "Los Angeles", "New York", "Toronto", "Seoul",
  "Tokyo", "Berlin", "Lagos", "São Paulo", "Sydney"
] as const;

export const strategies: Record<StrategyId, { name: string; description: string; cash: number; credibility: number; marketing: number }> = {
  indie: { name: "Indie Credibility", description: "Lean budgets, strong press trust, loyal artists.", cash: 220000, credibility: 64, marketing: 38 },
  idol: { name: "Idol Performance Lab", description: "Training-heavy fan power with burnout risk.", cash: 420000, credibility: 34, marketing: 68 },
  viral: { name: "Viral Creator Label", description: "Explosive social reach and volatile careers.", cash: 280000, credibility: 38, marketing: 76 },
  radio: { name: "Radio Pop Machine", description: "Expensive campaigns and broad commercial appeal.", cash: 500000, credibility: 28, marketing: 82 },
  electronic: { name: "Underground Electronic", description: "Club credibility and festival momentum.", cash: 260000, credibility: 72, marketing: 44 },
  hiphop: { name: "Street Culture Label", description: "High buzz, strong identity, rivalry risk.", cash: 300000, credibility: 62, marketing: 58 },
  rock: { name: "Rock Revival", description: "Touring strength with trend sensitivity.", cash: 320000, credibility: 60, marketing: 46 },
  fusion: { name: "Global Fusion", description: "International upside with complex market fit.", cash: 350000, credibility: 54, marketing: 58 },
  boutique: { name: "Boutique Development", description: "Slow growth, deep loyalty, catalog value.", cash: 240000, credibility: 76, marketing: 34 },
  hitfactory: { name: "Commercial Hit Factory", description: "High spend and enormous chart upside.", cash: 650000, credibility: 20, marketing: 90 },
  soul: { name: "Gospel & Soul Specialist", description: "Live power and durable fan loyalty.", cash: 260000, credibility: 68, marketing: 40 },
  novelty: { name: "Comedy & Novelty", description: "Viral spikes and unpredictable longevity.", cash: 210000, credibility: 30, marketing: 72 }
};

export const aiLabels = [
  "Chrome Lotus Records", "Moonshot Melody Group", "Velvet Circuit", "Northstar Audio",
  "Daybreak Soundworks", "Electric Orchard", "Paper Crown Music", "Golden Static",
  "Comet House", "Glass Harbor Records", "Fever Dream Audio", "Wildline Music",
  "Afterglow Union", "Copper Sky Entertainment", "Prism District", "Midnight Assembly"
] as const;

export const publications = [
  "Neon Review", "Indie Pulse Weekly", "Signal & Sound", "The Chorus Ledger",
  "Backstage Current", "Stereo Atlas", "New Noise Journal", "Tempo Culture",
  "The Hook Report", "Velvet Press", "Global Groove", "Loud & Clear"
] as const;

export const radioNetworks = [
  "Starwave Network", "Wave 99", "Metro Echo", "PulseNation", "NightDrive FM", "Aurora Radio",
  "Citybeat One", "Highline Audio", "Open Frequency", "Nova Air", "Golden Dial", "Voltage Radio"
] as const;

export const streamingPlatforms = [
  "LoopCloud", "Amply", "Orbit Play", "Prism Stream", "EchoDeck",
  "MuseFlow", "Current", "VibeRail", "Playloom", "SonicShelf"
] as const;

const first = ["Velora", "Mika", "Juno", "Riven", "Amara", "Cassian", "Nova", "Imani", "Elio", "Zuri", "Soren", "Nia", "Roux", "Tala", "Kairo"];
const last = ["Vane", "Arcade", "Sol", "Monroe", "Vale", "Kestrel", "Lux", "Marrow", "Bloom", "Raine", "Mosaic", "North"];
const bands = ["The Glass Satellites", "Midnight Arcade", "Paper Comets", "Electric Daisies", "Velvet Antennas", "Chrome Gardens", "Static Parade", "The Wild Frequencies"];

export function generateArtists(seed = 2048, count = 75): Artist[] {
  const rng = new RNG(seed);
  const used = new Set<string>();
  const artists: Artist[] = [];
  for (let index = 0; index < count; index += 1) {
    let name = rng.next() < 0.24 ? rng.pick(bands) : `${rng.pick(first)} ${rng.pick(last)}`;
    while (used.has(name)) name = `${name} ${rng.int(2, 99)}`;
    used.add(name);
    artists.push({
      id: `artist-${index + 1}`,
      name,
      genre: rng.pick(genres),
      market: rng.pick(markets),
      talent: rng.int(45, 92),
      appeal: rng.int(35, 95),
      loyalty: rng.int(40, 90),
      morale: rng.int(62, 92),
      fatigue: rng.int(0, 18),
      buzz: rng.int(2, 28),
      weeklyCost: rng.int(1800, 9200),
      signed: false,
      contractWeeks: 0,
      royaltyRate: rng.int(14, 28)
    });
  }
  return artists;
}

export const challengeScenarios = [
  { id: "rescue", name: "Save a failing indie label", description: "Start in debt and reach positive cash by week 16.", cash: -45_000, target: "Positive cash by week 16" },
  { id: "idol-global", name: "Launch an idol group globally", description: "Build a fanbase of 150K with high training costs.", cash: 350_000, target: "150K fans" },
  { id: "tiny-budget", name: "Break an unknown artist on €25K", description: "Create a Top 20 release without exceeding the starting budget.", cash: 25_000, target: "Top 20 song" },
  { id: "legacy", name: "Revive a legacy act", description: "Rebuild buzz and secure a Top 10 comeback.", cash: 180_000, target: "Top 10 comeback" },
  { id: "scandal", name: "Survive a scandal year", description: "Navigate frequent crises while protecting reputation.", cash: 240_000, target: "Reputation 50+" },
  { id: "sound-prize", name: "Win the Global Sound Prize", description: "Build quality, credibility, and award momentum.", cash: 260_000, target: "Win an award" },
  { id: "fanclubs", name: "Dominate through fan clubs", description: "Reach 100K fans without radio promotion.", cash: 150_000, target: "100K fans, no radio" },
  { id: "streaming", name: "Build a streaming-first label", description: "Accumulate five million catalog streams.", cash: 220_000, target: "5M streams" },
  { id: "viral-career", name: "Turn one viral hit into a career", description: "Follow a Top 10 with a second Top 20 release.", cash: 190_000, target: "Two Top 20 songs" },
  { id: "boutique", name: "Build a boutique credibility empire", description: "Reach 85 credibility while remaining profitable.", cash: 120_000, target: "85 credibility" }
] as const;

export const trends = [
  "Analog Warmth", "Bedroom Ballads", "Festival Bass", "Guitar Return", "Afro-Fusion Summer",
  "Idol Precision", "Lo-Fi Confessions", "Club Jazz Nights", "Hyper Ballad Drama", "Soul Revival",
  "Dance Challenge Hooks", "Acoustic Reset", "Global Duets", "Dark Pop Cinema", "Live Session Culture",
  "Collector Vinyl Wave", "Micro-Genre Playlists", "Fan Translation Teams", "Short-Form Choreography", "Late-Night R&B",
  "Underground Rap Cyphers", "Electronic Folk", "Comedy Audio Memes", "Stadium Rock Return", "Gospel Choir Features"
] as const;

const eventSubjects = ["A surprise playlist add", "A studio leak", "A festival cancellation", "A fan-club campaign", "A rival signing", "A producer dispute", "A radio breakthrough", "A review controversy", "A viral dance clip", "A tour-bus breakdown"];
const eventComplications = ["creates unexpected momentum", "splits the fanbase", "forces a costly decision", "opens an international door", "puts artist morale at risk"];
const eventStakeholders = ["your lead artist", "the A&R team", "a fictional promoter", "an influential fan account", "a rival label"];

export const eventCatalog: Array<Omit<PendingEvent, "id">> = Array.from({ length: 150 }, (_, index) => {
  const subject = eventSubjects[index % eventSubjects.length]!;
  const complication = eventComplications[Math.floor(index / eventSubjects.length) % eventComplications.length]!;
  const stakeholder = eventStakeholders[Math.floor(index / (eventSubjects.length * eventComplications.length)) % eventStakeholders.length]!;
  const crisis = index % 3 === 1;
  return {
    title: `${subject}: ${stakeholder}`,
    description: `${subject} ${complication}. The response will shape this week's industry narrative.`,
    category: crisis ? "crisis" : index % 3 === 0 ? "opportunity" : "industry",
    choices: [
      { id: "bold", label: "Make the bold move", cash: crisis ? -18_000 : -10_000, reputation: 5, morale: -2, buzz: 9 },
      { id: "careful", label: "Protect the artist", cash: -4_000, reputation: 1, morale: 7, buzz: 1 },
      { id: "decline", label: "Stay focused", cash: 0, reputation: crisis ? -3 : 0, morale: 1, buzz: -2 }
    ]
  };
});

const staffFirst = ["Mara", "Jonas", "Ivy", "Rafi", "Sana", "Dax", "Lina", "Omar", "Tess", "Milo"];
const staffLast = ["Signal", "Hart", "Quill", "Morrow", "Nox", "Vale", "Aster", "Lane"];
const staffRoles: StaffMember["role"][] = ["A&R", "Marketing", "Radio", "Touring", "Finance"];

export function generateStaff(seed: number, count = 20): StaffMember[] {
  const rng = new RNG(seed ^ 0x51aff);
  return Array.from({ length: count }, (_, index) => ({
    id: `staff-${index + 1}`,
    name: `${rng.pick(staffFirst)} ${rng.pick(staffLast)}`,
    role: rng.pick(staffRoles),
    skill: rng.int(45, 92),
    weeklyCost: rng.int(1600, 7800)
  }));
}

export const achievementNames = [
  "Bedroom Mogul", "Playlist Whisperer", "Radio Breakthrough", "Indie Credibility", "Idol Machine",
  "Tour Warrior", "Crisis Manager", "Viral Spark", "Global Breakout", "Catalog King",
  "Fan Club Legend", "Award Season Shark", "Comeback Architect", "Zero Budget Miracle",
  "Marketing Mastermind", "Press Darling", "Streaming Giant", "Staff Builder",
  "Festival Headliner", "International Empire"
] as const;
