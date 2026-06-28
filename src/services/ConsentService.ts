export class ConsentService {
  allows(): boolean {
    return true;
  }
}

export const consentService = new ConsentService();
