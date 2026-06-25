import type { GameState } from "../../types/game";

const DB_NAME = "chart-empire";
const STORE = "saves";
const SLOT = "guest-career";

export class SaveSystem {
  async save(state: GameState): Promise<void> {
    localStorage.setItem(SLOT, JSON.stringify(state));
    if (!("indexedDB" in window)) return;
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).put(state, SLOT);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async load(): Promise<GameState | null> {
    if ("indexedDB" in window) {
      try {
        const db = await this.open();
        const value = await new Promise<GameState | undefined>((resolve, reject) => {
          const request = db.transaction(STORE).objectStore(STORE).get(SLOT);
          request.onsuccess = () => resolve(request.result as GameState | undefined);
          request.onerror = () => reject(request.error);
        });
        if (value) return value;
      } catch {
        // LocalStorage remains the compatibility fallback.
      }
    }
    const saved = localStorage.getItem(SLOT);
    return saved ? (JSON.parse(saved) as GameState) : null;
  }

  export(state: GameState): void {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `chart-empire-${state.labelName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-week-${state.week}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async import(file: File): Promise<GameState> {
    const state = JSON.parse(await file.text()) as GameState;
    if (state.version !== 1 || !Array.isArray(state.artists) || typeof state.labelName !== "string") {
      throw new Error("This is not a valid Chart Empire save.");
    }
    await this.save(state);
    return state;
  }

  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
