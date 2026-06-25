export class SeasonRoom {
  constructor(private state: DurableObjectState) {}

  async fetch(): Promise<Response> {
    const snapshot = await this.state.storage.get("snapshot");
    return Response.json({ enabled: false, futureReady: true, snapshot: snapshot || null });
  }
}
