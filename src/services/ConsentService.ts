export type ConsentCategory = "necessary" | "analytics" | "ads" | "personalizedAds" | "externalMedia" | "functionalSaves";
export type ConsentState = Record<ConsentCategory, boolean>;

const defaults: ConsentState = {
  necessary: true,
  analytics: true,
  ads: true,
  personalizedAds: true,
  externalMedia: true,
  functionalSaves: true
};

export class ConsentService {
  get(): ConsentState {
    return { ...defaults };
  }

  hasDecision(): boolean {
    return true;
  }

  allows(_category: ConsentCategory): boolean {
    return true;
  }

  save(state: Partial<ConsentState>): ConsentState {
    const next = { ...this.get(), ...state, necessary: true };
    return next;
  }

  acceptAll(): ConsentState {
    return this.get();
  }

  rejectOptional(): ConsentState {
    return this.get();
  }
}

export const consentService = new ConsentService();
