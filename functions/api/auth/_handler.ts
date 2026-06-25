import type { Env } from "../../_shared";
import { json } from "../../_shared";

export const accountPlaceholder: PagesFunction<Env> = async () => json({
  error: "Account authentication is not enabled in this MVP.",
  nextStep: "Configure an audited Workers-compatible password or OAuth provider before enabling cloud accounts."
}, 501);

export const mePlaceholder: PagesFunction<Env> = async () => json({ user: null, enabled: false });
