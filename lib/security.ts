import crypto from "crypto";
export const ORG_ID = "org_acme_demo";
const key = () => crypto.createHash("sha256").update(process.env.FIELD_ENCRYPTION_KEY || "demo-only-key-change-me").digest();
export function encryptField(value: string) { const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv); const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]); return `${iv.toString("base64")}.${cipher.getAuthTag().toString("base64")}.${encrypted.toString("base64")}`; }
export function decryptField(value: string) { const [iv, tag, body] = value.split("."); const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64")); decipher.setAuthTag(Buffer.from(tag, "base64")); return Buffer.concat([decipher.update(Buffer.from(body, "base64")), decipher.final()]).toString("utf8"); }
export function scoped<T extends { orgId?: string }>(rows: T[], orgId = ORG_ID) { return rows.filter((row) => !row.orgId || row.orgId === orgId); }
export function requireScope(req: Request, scope: string) { const keyValue = req.headers.get("x-api-key"); const scopes = keyValue === "demo-api-key" ? ["candidates:read", "candidates:write", "webhooks:write"] : []; if (!scopes.includes(scope)) throw new Error("Missing API scope"); return { orgId: ORG_ID, scopes }; }
export function signWebhook(payload: string, secret = process.env.WEBHOOK_SECRET || "demo-webhook-secret") { return crypto.createHmac("sha256", secret).update(payload).digest("hex"); }
