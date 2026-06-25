const MUTE_KEY = "chart-empire-muted";

export class AudioService {
  private context: AudioContext | null = null;

  get muted(): boolean {
    return localStorage.getItem(MUTE_KEY) === "true";
  }

  toggle(): boolean {
    const next = !this.muted;
    localStorage.setItem(MUTE_KEY, String(next));
    return next;
  }

  cue(type: "success" | "error" | "action"): void {
    if (this.muted) return;
    this.context ||= new AudioContext();
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const now = this.context.currentTime;
    oscillator.type = type === "error" ? "sawtooth" : "sine";
    oscillator.frequency.setValueAtTime(type === "success" ? 620 : type === "error" ? 180 : 360, now);
    oscillator.frequency.exponentialRampToValueAtTime(type === "success" ? 920 : type === "error" ? 120 : 440, now + .12);
    gain.gain.setValueAtTime(.035, now);
    gain.gain.exponentialRampToValueAtTime(.0001, now + .16);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + .17);
  }
}

export const audioService = new AudioService();
