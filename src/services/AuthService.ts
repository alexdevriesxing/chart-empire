import { apiRequest } from "./ApiClient";

export interface AccountUser {
  id: string;
  email: string;
  displayName: string;
  createdAt?: string;
}

export class AuthService {
  me(): Promise<{ user: AccountUser | null; enabled: boolean }> {
    return apiRequest("/api/auth/me");
  }

  register(input: { email: string; displayName: string; password: string; turnstileToken: string }): Promise<{ user: AccountUser }> {
    return apiRequest("/api/auth/register", { method: "POST", body: JSON.stringify(input) });
  }

  login(input: { email: string; password: string; turnstileToken: string }): Promise<{ user: AccountUser }> {
    return apiRequest("/api/auth/login", { method: "POST", body: JSON.stringify(input) });
  }

  logout(): Promise<{ ok: true }> {
    return apiRequest("/api/auth/logout", { method: "POST" });
  }

  deleteAccount(password: string, turnstileToken: string): Promise<{ ok: true }> {
    return apiRequest("/api/auth/delete-account", { method: "POST", body: JSON.stringify({ password, turnstileToken }) });
  }

  exportAccount(): void {
    window.location.href = "/api/auth/export";
  }
}

export const authService = new AuthService();
