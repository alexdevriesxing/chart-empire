import type { Artist, StrategyId } from "../../types/game";
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
      signed: false
    });
  }
  return artists;
}

export const challengeScenarios = [
  "Save a failing indie label", "Launch an idol group globally", "Break an unknown artist on €25K",
  "Revive a legacy act", "Survive a scandal year", "Win the Global Sound Prize",
  "Dominate through fan clubs", "Build a streaming-first label", "Turn one viral hit into a career",
  "Build a boutique credibility empire"
] as const;

export const achievementNames = [
  "Bedroom Mogul", "Playlist Whisperer", "Radio Breakthrough", "Indie Credibility", "Idol Machine",
  "Tour Warrior", "Crisis Manager", "Viral Spark", "Global Breakout", "Catalog King",
  "Fan Club Legend", "Award Season Shark", "Comeback Architect", "Zero Budget Miracle",
  "Marketing Mastermind", "Press Darling", "Streaming Giant", "Staff Builder",
  "Festival Headliner", "International Empire"
] as const;
