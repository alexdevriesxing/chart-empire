import type { Env } from "../../_shared";
import { json } from "../../_shared";

const authRequired: PagesFunction<Env> = async () => json({ error: "Registered sessions are required for cloud saves." }, 401);
export const onRequestGet = authRequired;
export const onRequestPut = authRequired;
export const onRequestDelete = authRequired;
