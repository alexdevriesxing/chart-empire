export type ConsentCategory = "necessary" | "analytics" | "ads" | "personalizedAds" | "externalMedia" | "functionalSaves";
export type ConsentState = Record<ConsentCategory, boolean>;

const KEY = "chart-empire-consent-v1";
const defaults: ConsentState = {
  necessary: true,
  analytics: false,
  ads: false,
  personalizedAds: false,
  externalMedia: false,
  functionalSaves: true
};

export class ConsentService {
  get(): ConsentState {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") as Partial<ConsentState>, necessary: true };
    } catch {
      return { ...defaults };
    }
  }

  hasDecision(): boolean {
    return localStorage.getItem(KEY) !== null;
  }

  allows(category: ConsentCategory): boolean {
    return this.get()[category];
  }

  save(state: Partial<ConsentState>): ConsentState {
    const next = { ...this.get(), ...state, necessary: true };
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("consentchange", { detail: next }));
    return next;
  }

  acceptAll(): ConsentState {
    return this.save({ analytics: true, ads: true, personalizedAds: true, externalMedia: true, functionalSaves: true });
  }

  rejectOptional(): ConsentState {
    return this.save({ analytics: false, ads: false, personalizedAds: false, externalMedia: false, functionalSaves: true });
  }
}

export const consentService = new ConsentService();
