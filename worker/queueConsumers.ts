import type { Env } from "../functions/_shared";

interface Job {
  type: "contact-created" | "save-backup" | "leaderboard-recalculate";
  id: string;
  userId?: string;
  saveId?: string;
  stateJson?: string;
}

export default {
  async queue(batch: MessageBatch<Job>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        if (message.body.type === "contact-created") {
          await env.KV_CONFIG?.put(`job:${message.id}`, JSON.stringify({ processedAt: new Date().toISOString() }), { expirationTtl: 86400 });
        }
        if (message.body.type === "save-backup" && message.body.saveId && message.body.stateJson) {
          const key = `backups/${message.body.userId}/${message.body.saveId}/${Date.now()}.json`;
          await env.R2_ASSETS?.put(key, message.body.stateJson, {
            httpMetadata: { contentType: "application/json" }
          });
        }
        message.ack();
      } catch {
        message.retry();
      }
    }
  }
};
