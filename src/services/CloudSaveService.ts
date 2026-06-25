import type { GameState } from "../types/game";
import { apiRequest } from "./ApiClient";

export interface CloudSaveSummary {
  id: string;
  labelName: string;
  gameVersion: number;
  updatedAt: string;
  createdAt: string;
  week: number;
  cash: number;
  fanbase: number;
  logo: string;
}

export class CloudSaveService {
  async list(): Promise<CloudSaveSummary[]> {
    return (await apiRequest<{ saves: CloudSaveSummary[] }>("/api/saves")).saves;
  }

  async get(id: string): Promise<{ id: string; state: GameState }> {
    return apiRequest(`/api/saves/${encodeURIComponent(id)}`);
  }

  create(state: GameState): Promise<{ id: string; state: GameState }> {
    return apiRequest("/api/saves", { method: "POST", body: JSON.stringify({ labelName: state.labelName, state }) });
  }

  update(id: string, state: GameState): Promise<{ ok: true; updatedAt: string }> {
    return apiRequest(`/api/saves/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify({ labelName: state.labelName, state }) });
  }

  delete(id: string): Promise<{ ok: true }> {
    return apiRequest(`/api/saves/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  publishScore(saveId: string, scenario?: string): Promise<{ score: number; improved: boolean }> {
    return apiRequest("/api/leaderboards", { method: "POST", body: JSON.stringify({ saveId, scenario }) });
  }
}

export const cloudSaveService = new CloudSaveService();
