import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const SECRET =
  process.env.SESSION_SECRET || "alsalam-lfl-super-secret-change-on-vercel";

export const SESSION_COOKIE = "alsalam_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

// ===== Password hashing (scrypt) =====
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const candidate = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

// ===== Session tokens (HMAC signed) =====
interface SessionPayload {
  uid: string;
  username: string;
  name: string;
  role: "super" | "instructor" | "student";
  exp: number;
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function sign(data: string): string {
  return createHmac("sha256", SECRET).update(data).digest("base64url");
}

export function createSessionToken(
  payload: Omit<SessionPayload, "exp">
): { token: string; maxAge: number } {
  const full: SessionPayload = { ...payload, exp: Date.now() + SESSION_TTL_MS };
  const body = b64url(JSON.stringify(full));
  const sig = sign(body);
  return { token: `${body}.${sig}`, maxAge: SESSION_TTL_MS / 1000 };
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    if (sign(body) !== sig) return null;
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    ) as SessionPayload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ===== Server helpers =====
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function requireSession(): Promise<SessionPayload | null> {
  return getSession();
}

export async function requireSuper(): Promise<SessionPayload | null> {
  const s = await getSession();
  return s && s.role === "super" ? s : null;
}

// ===== Short slug generator =====
export function makeSlug(len = 6): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  const bytes = randomBytes(len);
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}
