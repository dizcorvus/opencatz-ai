/**
 * Keeps the modular screening loop from stacking on itself.
 * A pass that is still running causes the next interval tick to skip.
 * Each domain runs inside an abort scope so a timeout cancels upstream fetches.
 */

import { runInScope } from './http-gateway.js';

export function screeningTimeoutMs(): number {
  return Math.max(1000, Number(process.env.SCREENING_TIMEOUT_MS) || 60_000);
}

export function createSkipGate() {
  let running = false;
  return {
    isRunning(): boolean {
      return running;
    },
    runOrSkip(label: string, fn: () => Promise<void>): Promise<void> {
      if (running) {
        console.warn(`[SCHEDULER] ${label} skipped — previous run still in progress.`);
        return Promise.resolve();
      }
      running = true;
      return fn().finally(() => {
        running = false;
      });
    },
  };
}

/**
 * Fail-closed screening wrapper. On timeout the returned value is [] and the
 * scope signal aborts, so fetches still in flight are cancelled.
 */
export function runScreeningGuarded<T>(domain: string, run: () => Promise<T>, timeoutMs = screeningTimeoutMs()): Promise<T> {
  const controller = new AbortController();
  let settled = false;
  let timer: ReturnType<typeof setTimeout>;

  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      if (settled) return;
      controller.abort();
      console.warn(
        `[SCREENING TIMEOUT] ${domain.toUpperCase()} pass exceeded ${timeoutMs}ms — discarded, upstream requests aborted (fail-closed).`
      );
      resolve([] as unknown as T);
    }, timeoutMs);
  });

  const work = runInScope(domain, controller.signal, run).then(
    (value) => value,
    (err: unknown) => {
      if (controller.signal.aborted) return [] as unknown as T;
      throw err;
    }
  );

  return Promise.race([work, timeout]).finally(() => {
    settled = true;
    clearTimeout(timer);
  });
}
