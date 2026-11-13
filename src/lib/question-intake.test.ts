import { describe, expect, it, vi } from "vitest";
import { createQuestionIntake, issueQuestionChallenge, signQuestionValue } from "./question-intake";

const config = { secret: "test-secret-".repeat(6), scriptUrl: "https://script.google.com/macros/s/TEST/exec", origin: "https://lapublication.vercel.app", vercel: true };
const clock = 1_800_000_000_000;
function body() { return { name: "Listener", email: "listener@example.com", topic: "Dhamma", question: "මෙය පරීක්ෂණ ප්‍රශ්නයකි.", website: "", challenge: issueQuestionChallenge(config.secret, clock - 2000) }; }
function request(value: unknown, origin = config.origin) { return new Request(`${config.origin}/api/questions`, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json", "x-vercel-forwarded-for": "192.0.2.1" }, body: JSON.stringify(value) }); }

describe("question intake boundary", () => {
  it("signs validated submissions and sends only a hashed network identifier", async () => {
    const input = body();
    const send = vi.fn(async () => Response.json({ ok: true, id: input.challenge.id }));
    const result = await createQuestionIntake(config, send as typeof fetch, () => clock).POST(request(input));
    expect(result.status).toBe(200);
    const options = (send.mock.calls[0] as unknown as [string, RequestInit])[1];
    const envelope = JSON.parse(String(options.body));
    expect(envelope.signature).toBe(signQuestionValue(config.secret, envelope.payload));
    const payload = JSON.parse(envelope.payload);
    expect(payload.question).toBe(input.question);
    expect(payload.clientKey).toMatch(/^[a-f0-9]{64}$/);
    expect(envelope.payload).not.toContain("192.0.2.1");
    expect(JSON.stringify(await result.json())).not.toContain(config.secret);
  });

  it("rejects cross-origin posts and tampered, expired or rushed form tokens", async () => {
    const send = vi.fn();
    const intake = createQuestionIntake(config, send as typeof fetch, () => clock);
    expect((await intake.POST(request(body(), "https://other.example"))).status).toBe(403);
    for (const input of [
      { ...body(), challenge: { ...body().challenge, signature: "0".repeat(64) } },
      { ...body(), challenge: issueQuestionChallenge(config.secret, clock - 3_600_001) },
      { ...body(), challenge: issueQuestionChallenge(config.secret, clock - 500) }
    ]) expect((await intake.POST(request(input))).status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("traps bots and rejects oversized or invalid content without contacting Google", async () => {
    const send = vi.fn();
    const intake = createQuestionIntake(config, send as typeof fetch, () => clock);
    expect((await intake.POST(request({ ...body(), website: "spam.example" }))).status).toBe(200);
    expect((await intake.POST(request({ ...body(), email: "invalid" }))).status).toBe(400);
    expect((await intake.POST(request({ ...body(), name: "  " }))).status).toBe(400);
    expect((await intake.POST(request({ ...body(), question: "x".repeat(40_000) }))).status).toBe(413);
    expect(send).not.toHaveBeenCalled();
  });

  it("does not report success if Google rejects or loses the write", async () => {
    const input = body();
    const send = vi.fn(async () => Response.json({ ok: false, code: "rate_limit" }));
    expect((await createQuestionIntake(config, send as typeof fetch, () => clock).POST(request(input))).status).toBe(429);
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const failed = vi.fn(async () => { throw new Error("Network failed"); });
    expect((await createQuestionIntake(config, failed as typeof fetch, () => clock).POST(request(input))).status).toBe(503);
    expect(JSON.stringify(spy.mock.calls)).not.toContain(input.question);
    spy.mockRestore();
  });

  it("keeps an unconfigured intake unavailable", async () => {
    expect((await createQuestionIntake({ ...config, secret: "" }).GET()).status).toBe(503);
    expect((await createQuestionIntake({ ...config, scriptUrl: "https://other.example/" }).GET()).status).toBe(503);
  });
});
