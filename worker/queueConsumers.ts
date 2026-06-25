import type { Env } from "../functions/_shared";

interface Job {
  type: "contact-created" | "save-backup" | "leaderboard-recalculate";
  id: string;
}

export default {
  async queue(batch: MessageBatch<Job>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        if (message.body.type === "contact-created") {
          await env.KV_CONFIG?.put(`job:${message.id}`, JSON.stringify({ processedAt: new Date().toISOString() }), { expirationTtl: 86400 });
        }
        message.ack();
      } catch {
        message.retry();
      }
    }
  }
};
