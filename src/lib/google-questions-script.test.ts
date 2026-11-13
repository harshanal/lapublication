import { createHmac, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it, vi } from "vitest";

const source = readFileSync(new URL("../../integrations/google-questions/Code.gs", import.meta.url), "utf8");
const secret = "script-test-secret-".repeat(4);
const headers = ["Submission ID", "Received at", "Name", "Email", "Topic", "Question", "Status", "Assigned to", "Answered on", "Answer / reference link", "Notes", "Email status", "Last email error"];

function harness() {
  function sheet(name: string, initial: unknown[][]) {
    const rows = initial.map((row) => [...row]);
    const value = (row: number, col: number) => rows[row - 1]?.[col - 1] ?? "";
    const instance = {
      rows, getName: () => name, getMaxRows: () => 1000,
      getLastRow: () => { let i = rows.length; while (i && !rows[i - 1].some((v) => v !== "" && v !== undefined && v !== null)) i--; return i; },
      appendRow: (row: unknown[]) => rows.push(row), deleteRow: (row: number) => rows.splice(row - 1, 1), insertRowsBefore: vi.fn(),
      getRange(row: number, col: number, n = 1, m = 1) {
        const range = {
          getValues: () => Array.from({ length: n }, (_, i) => Array.from({ length: m }, (_, j) => value(row + i, col + j))),
          getValue: () => value(row, col),
          setValues(values: unknown[][]) { values.forEach((line, i) => line.forEach((v, j) => { rows[row + i - 1] ||= []; rows[row + i - 1][col + j - 1] = v; })); return range; },
          setValue(v: unknown) { return range.setValues([[v]]); },
          setNumberFormat: () => range, clearContent: () => range.setValue(""),
          getSheet: () => instance, getColumn: () => col, getRow: () => row, getNumColumns: () => m, getNumRows: () => n
        };
        return range;
      }
    };
    return instance;
  }
  const questions = sheet("Questions", [headers]);
  const ledger = sheet("_Intake", [["Submission ID", "Received at", "Client key", "Email key"]]);
  const mail = { quota: 100, sendEmail: vi.fn(), getRemainingDailyQuota: () => mail.quota };
  const context = vm.createContext({
    console, MailApp: mail,
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => secret }) },
    Utilities: { Charset: { UTF_8: "utf8" }, computeHmacSha256Signature: (text: string, key: string) => Array.from(createHmac("sha256", key).update(text, "utf8").digest()) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: vi.fn() }) },
    SpreadsheetApp: { openById: () => ({ getSheetByName: (name: string) => name === "Questions" ? questions : ledger }), flush: vi.fn() },
    ScriptApp: { getProjectTriggers: () => ["handleQuestionEdit", "retryPendingQuestionEmails"].map((name) => ({ getHandlerFunction: () => name })) },
    ContentService: { MimeType: { JSON: "json" }, createTextOutput: (text: string) => ({ setMimeType: () => ({ getContent: () => text }) }) }
  });
  vm.runInContext(source, context);
  function submit(overrides: Record<string, unknown> = {}, signature?: string) {
    const payload = JSON.stringify({ id: randomUUID(), sentAt: Date.now(), name: "Listener", email: "listener@example.com", topic: "Dhamma", question: "=1+2 This must remain plain text", clientKey: "a".repeat(64), emailKey: "b".repeat(64), ...overrides });
    const result = context.doPost({ postData: { contents: JSON.stringify({ payload, signature: signature ?? createHmac("sha256", secret).update(payload).digest("hex") }) } });
    return JSON.parse(result.getContent());
  }
  return { questions, ledger, mail, context, submit };
}

describe("Google Apps Script question storage", () => {
  it("checks configured triggers only for authenticated health requests", () => {
    const h = harness();
    expect(h.submit({ action: "health" }, "0".repeat(64))).toMatchObject({ ok: false, code: "unauthorized" });
    expect(h.submit({ action: "health" })).toMatchObject({ ok: true, answerDateTrigger: true, mailRetryTrigger: true });
    expect(h.questions.getLastRow()).toBe(1);
    expect(h.mail.sendEmail).not.toHaveBeenCalled();
  });

  it("requires server authentication and never accepts direct anonymous writes", () => {
    const h = harness();
    expect(h.submit({}, "0".repeat(64))).toEqual({ ok: false, code: "unauthorized" });
    expect(h.questions.getLastRow()).toBe(1);
    expect(h.mail.sendEmail).not.toHaveBeenCalled();
  });

  it("saves a safe text row, sends both copies, and deduplicates retries", () => {
    const h = harness();
    const id = randomUUID();
    expect(h.submit({ id })).toMatchObject({ ok: true, id });
    expect(h.questions.rows[1][5]).toBe("'=1+2 This must remain plain text");
    expect(h.questions.rows[1][6]).toBe("New");
    expect(h.questions.rows[1][11]).toBe("Sent");
    expect(h.mail.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "harshanal@gmail.com", cc: "ladhammaquestion@gmail.com", replyTo: "listener@example.com" }));
    expect(h.submit({ id })).toMatchObject({ ok: true, duplicate: true });
    expect(h.questions.getLastRow()).toBe(2);
    expect(h.mail.sendEmail).toHaveBeenCalledTimes(1);
  });

  it("keeps the question when mail quota runs out and retries later", () => {
    const h = harness(); h.mail.quota = 1;
    expect(h.submit().ok).toBe(true);
    expect(h.questions.rows[1][11]).toBe("Pending");
    expect(h.mail.sendEmail).not.toHaveBeenCalled();
    h.mail.quota = 100; h.context.retryPendingQuestionEmails();
    expect(h.questions.rows[1][11]).toBe("Sent");
    expect(h.mail.sendEmail).toHaveBeenCalledTimes(1);
  });

  it("flags ambiguous mail errors for review instead of repeatedly sending", () => {
    const h = harness(); h.mail.sendEmail.mockImplementation(() => { throw new Error("Ambiguous delivery"); });
    const id = randomUUID(); expect(h.submit({ id }).ok).toBe(true);
    expect(h.questions.rows[1][11]).toBe("Review");
    h.submit({ id }); h.context.retryPendingQuestionEmails();
    expect(h.mail.sendEmail).toHaveBeenCalledTimes(1);
  });

  it("limits repeated questions and stamps manual Answered status changes", () => {
    const h = harness();
    for (let i = 0; i < 3; i++) expect(h.submit().ok).toBe(true);
    expect(h.submit()).toMatchObject({ ok: false, code: "rate_limit" });
    h.questions.getRange(2, 7).setValue("Answered");
    h.context.handleQuestionEdit({ range: h.questions.getRange(2, 7) });
    expect(Number.isFinite(new Date(h.questions.rows[1][8] as string).getTime())).toBe(true);
    h.questions.getRange(2, 7).setValue("In progress");
    h.context.handleQuestionEdit({ range: h.questions.getRange(2, 7) });
    expect(h.questions.rows[1][8]).toBe("");
  });
});
