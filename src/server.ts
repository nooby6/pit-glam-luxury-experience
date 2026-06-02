import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { logRuntimeError } from "./lib/runtime-error";
import { normalizeRuntimeError } from "./lib/runtime-error";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

// ----- Simple signed session token helpers -----
async function hmacSha256(data: string, secret: string): Promise<string> {
  // Try Node's crypto first, then fall back to Web Crypto.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeCrypto = await import("crypto");
    return nodeCrypto.createHmac("sha256", secret).update(data).digest("base64url");
  } catch {
    try {
      const enc = new TextEncoder();
      const key = await (globalThis.crypto as Crypto).subtle.importKey(
        "raw",
        enc.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"],
      );
      const sig = await (globalThis.crypto as Crypto).subtle.sign("HMAC", key, enc.encode(data));
      const arr = new Uint8Array(sig as ArrayBuffer);
      // base64url
      const b64 = Buffer.from(arr).toString("base64");
      return b64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    } catch (err) {
      logRuntimeError("server:hmac", err);
      return "";
    }
  }
}

function base64UrlEncode(obj: unknown) {
  const str = JSON.stringify(obj);
  return Buffer.from(str).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function createSessionToken(payload: Record<string, unknown>, secret: string, expiresInSeconds = 60 * 60 * 24) {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const data = { ...payload, exp };
  const header = { alg: "HS256", typ: "JWT" };
  const encoded = `${base64UrlEncode(header)}.${base64UrlEncode(data)}`;
  const sig = await hmacSha256(encoded, secret);
  return `${encoded}.${sig}`;
}

async function verifySessionToken(token: string, secret: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sig] = parts;
    const encoded = `${headerB64}.${payloadB64}`;
    const expected = await hmacSha256(encoded, secret);
    if (!expected || sig !== expected) return null;
    const payloadJson = Buffer.from(payloadB64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString();
    const payload = JSON.parse(payloadJson) as Record<string, unknown>;
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === "number" && payload.exp < now) return null;
    return payload;
  } catch (err) {
    logRuntimeError("server:verify-session", err);
    return null;
  }
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  logRuntimeError(
    `server:ssr ${response.status}`,
    consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`),
  );
  return brandedErrorResponse();
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      // Provide simple API endpoints for staff auth and session management.
      try {
        const url = new URL(request.url);
        const pathname = url.pathname;
        const method = request.method.toUpperCase();

        const envObj = (env ?? {}) as Record<string, string | undefined>;
        const STAFF_USER = envObj.STAFF_USER ?? process.env.STAFF_USER;
        const STAFF_PASS = envObj.STAFF_PASS ?? process.env.STAFF_PASS;
        const STAFF_SECRET = envObj.STAFF_SECRET ?? process.env.STAFF_SECRET ?? "dev-secret";

        if (pathname === "/api/staff/login" && method === "POST") {
          const body = await request.json().catch(() => ({}));
          const { email, password } = body as { email?: string; password?: string };
          if (!email || !password) {
            return new Response(JSON.stringify({ error: "Missing credentials" }), { status: 400, headers: { "content-type": "application/json" } });
          }

          // Very small auth check — replace with secure lookup (DB/Identity) in production.
          if (String(email) !== String(STAFF_USER) || String(password) !== String(STAFF_PASS)) {
            return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401, headers: { "content-type": "application/json" } });
          }

          const token = await createSessionToken({ email }, String(STAFF_SECRET), 60 * 60 * 24 * 7);
          const headers = new Headers({ "content-type": "application/json" });
          // HttpOnly cookie
          headers.append("Set-Cookie", `pitglam_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24 * 7}`);
          return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
        }

        if (pathname === "/api/staff/logout" && method === "POST") {
          const headers = new Headers({ "content-type": "application/json" });
          headers.append("Set-Cookie", `pitglam_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
          return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
        }

        if (pathname === "/api/staff/me" && method === "GET") {
          const cookie = request.headers.get("cookie") ?? "";
          const match = cookie.match(/pitglam_session=([^;]+)/);
          if (!match) return new Response(JSON.stringify({ authenticated: false }), { status: 200, headers: { "content-type": "application/json" } });
          const token = match[1];
          const payload = await verifySessionToken(token, String(STAFF_SECRET));
          if (!payload) return new Response(JSON.stringify({ authenticated: false }), { status: 200, headers: { "content-type": "application/json" } });
          return new Response(JSON.stringify({ authenticated: true, payload }), { status: 200, headers: { "content-type": "application/json" } });
        }
      } catch (err) {
        logRuntimeError("server:auth-endpoint", normalizeRuntimeError(err));
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      const path = (() => {
        try {
          return new URL(request.url).pathname;
        } catch {
          return String(request.url ?? "");
        }
      })();
      logRuntimeError(`server:fetch ${request.method} ${path}`, error);
      return brandedErrorResponse();
    }
  },
};
