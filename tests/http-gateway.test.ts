import { afterEach, describe, expect, it, vi } from 'vitest';
import { GatewayPausedError, installHttpGateway, resetHttpGateway } from '../src/services/http-gateway.js';
import { createSkipGate, runScreeningGuarded } from '../src/services/screening-scheduler.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  resetHttpGateway();
  delete process.env.HTTP_GATEWAY_FORCE_PACE;
  delete process.env.HTTP_GATEWAY_TEST_INTERVAL_MS;
  vi.unstubAllGlobals();
});

function enableGateway(intervalMs: number): void {
  process.env.HTTP_GATEWAY_FORCE_PACE = '1';
  process.env.HTTP_GATEWAY_TEST_INTERVAL_MS = String(intervalMs);
  installHttpGateway();
}

describe('HttpGateway', () => {
  it('spaces requests to the same host when pacing is on', async () => {
    enableGateway(60);
    const times: number[] = [];
    const stub = vi.fn(async () => {
      times.push(Date.now());
      return new Response('{}', { status: 200 });
    });
    // install captured fetch before this stub — reinstall against the stub
    globalThis.fetch = stub as typeof fetch;
    resetHttpGateway();
    enableGateway(60);

    await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin');
    await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum');

    expect(stub).toHaveBeenCalledTimes(2);
    expect(times[1] - times[0]).toBeGreaterThanOrEqual(50);
  });

  it('pauses a host after repeated HTTP 429 and stops calling it', async () => {
    const stub = vi.fn(async () => new Response('slow down', { status: 429 }));
    globalThis.fetch = stub as typeof fetch;
    resetHttpGateway();
    enableGateway(0);

    await fetch('https://api.dexscreener.com/token-boosts/top/v1');
    await fetch('https://api.dexscreener.com/token-boosts/top/v1');
    await fetch('https://api.dexscreener.com/token-boosts/top/v1');
    await expect(fetch('https://api.dexscreener.com/token-boosts/top/v1')).rejects.toBeInstanceOf(GatewayPausedError);
    expect(stub).toHaveBeenCalledTimes(3);
  });

  it('aborts an in-flight request when the screening scope times out', async () => {
    let sawAbort = false;
    const stub = vi.fn((_url: string, init?: RequestInit) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        sawAbort = true;
        reject(new DOMException('This operation was aborted', 'AbortError'));
      });
    }));
    globalThis.fetch = stub as typeof fetch;
    resetHttpGateway();
    enableGateway(0);

    const result = await runScreeningGuarded(
      'meme-solana',
      () => fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana') as Promise<never>,
      40
    );

    expect(result).toEqual([]);
    expect(sawAbort).toBe(true);
  });
});

describe('screening pass gate', () => {
  it('skips a second run while the first pass is still going', async () => {
    const gate = createSkipGate();
    let release!: () => void;
    const first = gate.runOrSkip('screening', () => new Promise<void>((resolve) => { release = resolve; }));
    const skipped: string[] = [];
    const warn = vi.spyOn(console, 'warn').mockImplementation((msg) => { skipped.push(String(msg)); });
    await gate.runOrSkip('screening', async () => { skipped.push('ran'); });
    expect(skipped.some((line) => line.includes('skipped'))).toBe(true);
    expect(skipped).not.toContain('ran');
    release();
    await first;
    warn.mockRestore();
  });
});
