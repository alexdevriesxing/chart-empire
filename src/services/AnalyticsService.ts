import { consentService } from "./ConsentService";

export class AnalyticsService {
  track(event: string, metadata: Record<string, string | number | boolean> = {}): void {
    if (!consentService.allows("analytics")) return;
    const payload = JSON.stringify({ event, categories: { metadata, path: window.location.pathname, occurredAt: new Date().toISOString() } });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/consent/event", new Blob([payload], { type: "application/json" }));
    else void fetch("/api/consent/event", { method: "POST", headers: { "content-type": "application/json" }, body: payload, keepalive: true });
  }
}

export const analyticsService = new AnalyticsService();
