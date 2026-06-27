const MUTE_KEY = "chart-empire-muted";

export class AudioService {
  private context: AudioContext | null = null;

  get muted(): boolean {
    if (typeof localStorage === "undefined") return false;
    return localStorage.getItem(MUTE_KEY) === "true";
  }

  toggle(): boolean {
    if (typeof localStorage === "undefined") return false;
    const next = !this.muted;
    localStorage.setItem(MUTE_KEY, String(next));
    return next;
  }

  cue(type: "success" | "error" | "action"): void {
    if (this.muted) return;
    if (typeof AudioContext === "undefined") return;
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

  playMelodyForGenre(genre: string): void {
    if (this.muted) return;
    if (typeof AudioContext === "undefined") return;
    this.context ||= new AudioContext();
    const now = this.context.currentTime;
    const norm = genre.toLowerCase();
    
    let frequencies = [300, 360, 400, 480];
    let waveType: OscillatorType = "sine";
    let tempo = 0.15;

    if (norm.includes("soul") || norm.includes("r&b") || norm.includes("gospel")) {
      frequencies = [261.63, 329.63, 392.00, 493.88]; // Cmaj7 chord
      waveType = "triangle";
      tempo = 0.24;
    } else if (norm.includes("pop") || norm.includes("dance") || norm.includes("disco")) {
      frequencies = [293.66, 349.23, 440.00, 523.25]; // Dm7 pop arpeggio
      waveType = "sine";
      tempo = 0.14;
    } else if (norm.includes("rap") || norm.includes("afro")) {
      frequencies = [220.00, 261.63, 329.63, 392.00]; // Am7 hiphop/cloud rap sub
      waveType = "triangle";
      tempo = 0.18;
    } else if (norm.includes("rock") || norm.includes("folk") || norm.includes("jazz")) {
      frequencies = [196.00, 246.94, 293.66, 392.00]; // G Maj acoustic/folk pulse
      waveType = "sine";
      tempo = 0.22;
    }

    frequencies.forEach((freq, idx) => {
      const osc = this.context!.createOscillator();
      const gain = this.context!.createGain();
      const start = now + idx * tempo;
      
      osc.type = waveType;
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.025, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + tempo * 1.5);
      
      osc.connect(gain).connect(this.context!.destination);
      osc.start(start);
      osc.stop(start + tempo * 1.6);
    });
  }
}

export const audioService = new AudioService();
