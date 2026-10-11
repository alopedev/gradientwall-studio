import { vi } from "vitest";
import type { LoopsClient } from "./loops";
import type { KVBackend } from "./orders-store";

export type SentEmail = Parameters<LoopsClient["sendTransactional"]>[0];

export function fakeLoops(): LoopsClient & { sent: SentEmail[] } {
  const sent: SentEmail[] = [];
  return {
    sent,
    sendTransactional: vi.fn(async (opts: SentEmail) => {
      sent.push(opts);
    }),
  };
}

/** A Loops client whose every send fails, like an outage. */
export function failingLoops(): LoopsClient {
  return {
    sendTransactional: vi.fn(async () => {
      throw new Error("Loops sendTransactional failed: 503");
    }),
  };
}

/** A store whose every operation fails, like a Blobs outage. */
export function brokenStore(): KVBackend {
  const boom = async (): Promise<never> => {
    throw new Error("blobs unavailable");
  };
  return { get: boom, set: boom, getVersioned: boom, setIf: boom };
}

/** Silences the handlers' log lines and lets a test assert on them. */
export function captureLogs() {
  return {
    error: vi.spyOn(console, "error").mockImplementation(() => {}),
    log: vi.spyOn(console, "log").mockImplementation(() => {}),
    warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
  };
}
