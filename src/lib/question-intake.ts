import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export type IntakeConfig = { secret: string; scriptUrl: string; origin: string; vercel?: boolean };
export type QuestionChallenge = { id: string; issuedAt: number; signature: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BODY = 32_768;

export function signQuestionValue(secret: string, value: string) {
  return createHmac("sha256", secret).update(value, "utf8").digest("hex");
}

export function issueQuestionChallenge(secret: string, now = Date.now()): QuestionChallenge {
  const id = randomUUID();
  return { id, issuedAt: now, signature: signQuestionValue(secret, `form:${id}:${now}`) };
}

function validChallenge(value: unknown, secret: string, now: number): value is QuestionChallenge {
  if (!value || typeof value !== "object") return false;
  const c = value as QuestionChallenge;
  if (!UUID.test(c.id ?? "") || !Number.isSafeInteger(c.issuedAt) || !/^[0-9a-f]{64}$/.test(c.signature ?? "")) return false;
  const age = now - c.issuedAt;
  if (age < 1500 || age > 3_600_000) return false;
  const expected = signQuestionValue(secret, `form:${c.id}:${c.issuedAt}`);
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(c.signature, "hex"));
}

function configured(config: IntakeConfig) {
  return config.secret.length >= 32 && /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(config.scriptUrl);
}

function reply(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export function createQuestionIntake(config: IntakeConfig, send: typeof fetch = fetch, now: () => number = Date.now) {
  return {
    async GET() {
      if (!configured(config)) return reply({ ok: false, code: "unavailable" }, 503);
      return reply({ ok: true, challenge: issueQuestionChallenge(config.secret, now()) });
    },
    async POST(request: Request) {
      if (!configured(config)) return reply({ ok: false, code: "unavailable" }, 503);
      if (request.headers.get("origin") !== config.origin) return reply({ ok: false, code: "origin" }, 403);
      if (!request.headers.get("content-type")?.startsWith("application/json")) return reply({ ok: false, code: "invalid" }, 400);
      if (Number(request.headers.get("content-length") || 0) > MAX_BODY) return reply({ ok: false, code: "too_large" }, 413);
      let data: Record<string, unknown>;
      try {
        const raw = await request.text();
        if (Buffer.byteLength(raw, "utf8") > MAX_BODY) return reply({ ok: false, code: "too_large" }, 413);
        data = JSON.parse(raw);
        if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Invalid body");
      } catch { return reply({ ok: false, code: "invalid" }, 400); }
      // Filled hidden fields are acknowledged without storing or emailing anything.
      if (data.website) return reply({ ok: true });
      if (!validChallenge(data.challenge, config.secret, now())) return reply({ ok: false, code: "challenge" }, 400);
      const fields: Record<string, string> = {};
      for (const [key, min, max] of [["name", 1, 120], ["email", 3, 254], ["topic", 1, 160], ["question", 10, 5000]] as const) {
        const value = typeof data[key] === "string" ? (data[key] as string).trim() : "";
        if (value.length < min || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) return reply({ ok: false, code: "invalid" }, 400);
        fields[key] = key === "name" || key === "topic" ? value.replace(/[\r\n]+/g, " ") : value;
      }
      if (!EMAIL.test(fields.email)) return reply({ ok: false, code: "invalid" }, 400);
      const address = config.vercel ? (request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim() : "local";
      const payload = JSON.stringify({
        id: data.challenge.id, sentAt: now(), ...fields,
        clientKey: signQuestionValue(config.secret, `ip:${address}`),
        emailKey: signQuestionValue(config.secret, `email:${fields.email.toLowerCase()}`)
      });
      try {
        const response = await send(config.scriptUrl, {
          method: "POST", redirect: "follow", cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload, signature: signQuestionValue(config.secret, payload) }),
          signal: AbortSignal.timeout(25_000)
        });
        const result = response.ok ? await response.json() : null;
        if (result?.ok === true && result.id === data.challenge.id) return reply({ ok: true, id: result.id });
        if (result?.code === "rate_limit") return reply({ ok: false, code: "rate_limit" }, 429);
        console.error("Question intake rejected", { id: data.challenge.id, status: response.status, code: result?.code || "upstream" });
      } catch {
        // Do not log names, addresses, question text, endpoint URLs or secrets.
        console.error("Question intake request failed", { id: data.challenge.id });
      }
      return reply({ ok: false, code: "unavailable" }, 503);
    }
  };
}
