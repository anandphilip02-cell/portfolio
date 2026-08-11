const textEncoder = new TextEncoder();

export const ownerCookieName = "portfolio_owner_session";
const sessionLifetimeSeconds = 60 * 60 * 24 * 7;

type OwnerConfig = {
  username: string;
  password: string;
  sessionSecret: string;
};

export function getOwnerConfig(): OwnerConfig | null {
  const username = process.env.PORTFOLIO_OWNER_USERNAME;
  const password = process.env.PORTFOLIO_OWNER_PASSWORD;
  const sessionSecret = process.env.PORTFOLIO_OWNER_SESSION_SECRET;

  if (!username || !password || !sessionSecret) return null;
  return { username, password, sessionSecret };
}

export async function credentialsMatch(
  username: string,
  password: string,
  config: OwnerConfig,
) {
  const [usernameMatches, passwordMatches] = await Promise.all([
    constantTimeMatch(username, config.username),
    constantTimeMatch(password, config.password),
  ]);

  return usernameMatches && passwordMatches;
}

export async function createOwnerSession(config: OwnerConfig) {
  const expiresAt = Date.now() + sessionLifetimeSeconds * 1000;
  const payload = `owner.${expiresAt}`;
  const signature = await sign(payload, config.sessionSecret);
  return `${payload}.${signature}`;
}

export async function hasOwnerSession(request: Request) {
  const config = getOwnerConfig();
  const token = readCookie(request.headers.get("cookie"), ownerCookieName);
  if (!config || !token) return false;

  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "owner") return false;

  const expiresAt = Number(parts[1]);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;

  return verify(`owner.${parts[1]}`, parts[2], config.sessionSecret);
}

export function ownerSessionCookie(token: string) {
  return `${ownerCookieName}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${sessionLifetimeSeconds}`;
}

export function expiredOwnerSessionCookie() {
  return `${ownerCookieName}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

async function constantTimeMatch(left: string, right: string) {
  const [leftDigest, rightDigest] = await Promise.all([
    crypto.subtle.digest("SHA-256", textEncoder.encode(left)),
    crypto.subtle.digest("SHA-256", textEncoder.encode(right)),
  ]);
  const leftBytes = new Uint8Array(leftDigest);
  const rightBytes = new Uint8Array(rightDigest);
  let difference = 0;

  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index] ^ rightBytes[index];
  }

  return difference === 0;
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(value));
  return toBase64Url(new Uint8Array(signature));
}

async function verify(value: string, signature: string, secret: string) {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      textEncoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    return crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(signature),
      textEncoder.encode(value),
    );
  } catch {
    return false;
  }
}

function readCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match?.[1] ?? null;
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
