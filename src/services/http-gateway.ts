/**
 * Shared outbound HTTP gateway.
 *
 * Every external call made after `installHttpGateway()` shares one policy per
 * host: a serial pace, a hard timeout, and a circuit that opens when a host
 * starts returning 429s or transport failures. Callers still receive the
 * Response and keep their own key-rotation logic. The gateway never retries
 * a banned host on its own — it stops the process from hammering it.
 */

import { AsyncLocalStorage } from 'node:async_hooks';

export class GatewayPausedError extends Error {
  readonly host: string;

  constructor(host: string) {
    super(`[HTTP GATEWAY] ${host} is paused so this process does not extend a rate limit or IP ban.`);
    this.name = 'GatewayPausedError';
    this.host = host;
  }
}

interface HostPolicy {
  /** Minimum gap between requests when serialize is true. */
  minIntervalMs: number;
  timeoutMs: number;
  serialize: boolean;
}

interface HostLane {
  tail: Promise<void>;
  lastStart: number;
}

interface CircuitState {
  failures: number;
  openUntil: number;
  rateHits: number[];
}

interface ScopeStore {
  signal: AbortSignal;
  domain: string;
}

const scopeStorage = new AsyncLocalStorage<ScopeStore>();

const DEFAULT_POLICY: HostPolicy = { minIntervalMs: 0, timeoutMs: 15_000, serialize: false };

const HOST_POLICIES: Record<string, HostPolicy> = {
  'openapi.gmgn.ai': { minIntervalMs: 0, timeoutMs: 20_000, serialize: false },
  'api.dexscreener.com': { minIntervalMs: 280, timeoutMs: 15_000, serialize: true },
  'api.coingecko.com': { minIntervalMs: 1_500, timeoutMs: 12_000, serialize: true },
  'api.gopluslabs.io': { minIntervalMs: 200, timeoutMs: 15_000, serialize: true },
  'api.opensea.io': { minIntervalMs: 250, timeoutMs: 15_000, serialize: true },
  'cloud-api.krystal.app': { minIntervalMs: 200, timeoutMs: 15_000, serialize: true },
  'api.rugcheck.xyz': { minIntervalMs: 250, timeoutMs: 15_000, serialize: true },
  'gamma-api.polymarket.com': { minIntervalMs: 250, timeoutMs: 15_000, serialize: true },
  'clob.polymarket.com': { minIntervalMs: 250, timeoutMs: 15_000, serialize: true },
  'api.hyperliquid.xyz': { minIntervalMs: 200, timeoutMs: 15_000, serialize: true },
  'stats-data.hyperliquid.xyz': { minIntervalMs: 1_000, timeoutMs: 30_000, serialize: true },
  'dlmm-api.meteora.ag': { minIntervalMs: 200, timeoutMs: 15_000, serialize: true },
  'dlmm.datapi.meteora.ag': { minIntervalMs: 200, timeoutMs: 15_000, serialize: true },
  'quote-api.jup.ag': { minIntervalMs: 0, timeoutMs: 20_000, serialize: false },
  'api.relay.link': { minIntervalMs: 200, timeoutMs: 20_000, serialize: true },
  'trade-api.gateway.uniswap.org': { minIntervalMs: 0, timeoutMs: 20_000, serialize: false },
  'api.telegram.org': { minIntervalMs: 0, timeoutMs: 35_000, serialize: false },
  'ai.6551.io': { minIntervalMs: 300, timeoutMs: 30_000, serialize: true },
  'api.twexapi.io': { minIntervalMs: 300, timeoutMs: 20_000, serialize: true },
  'openrouter.ai': { minIntervalMs: 0, timeoutMs: 90_000, serialize: false },
  'api.openai.com': { minIntervalMs: 0, timeoutMs: 90_000, serialize: false },
  'api.anthropic.com': { minIntervalMs: 0, timeoutMs: 90_000, serialize: false },
  'generativelanguage.googleapis.com': { minIntervalMs: 0, timeoutMs: 90_000, serialize: false },
};

const FAILURES_TO_OPEN = 5;
const RATE_LIMITS_TO_OPEN = 3;
const CIRCUIT_OPEN_MS = 60_000;
const RATE_WINDOW_MS = 60_000;

const lanes = new Map<string, HostLane>();
const circuits = new Map<string, CircuitState>();

let nativeFetch: typeof fetch = globalThis.fetch.bind(globalThis);
let installed = false;

function pacingEnabled(): boolean {
  if (process.env.HTTP_GATEWAY_FORCE_PACE === '1') return true;
  if (process.env.VITEST === 'true') return false;
  return true;
}

function policyFor(host: string): HostPolicy {
  const base = HOST_POLICIES[host] ?? DEFAULT_POLICY;
  const override = Number(process.env.HTTP_GATEWAY_TEST_INTERVAL_MS);
  if (process.env.HTTP_GATEWAY_FORCE_PACE === '1' && Number.isFinite(override) && override >= 0) {
    return { ...base, minIntervalMs: override, serialize: true };
  }
  return base;
}

function laneFor(host: string): HostLane {
  let lane = lanes.get(host);
  if (!lane) {
    lane = { tail: Promise.resolve(), lastStart: 0 };
    lanes.set(host, lane);
  }
  return lane;
}

function circuitFor(host: string): CircuitState {
  let state = circuits.get(host);
  if (!state) {
    state = { failures: 0, openUntil: 0, rateHits: [] };
    circuits.set(host, state);
  }
  return state;
}

type FetchInput = Parameters<typeof fetch>[0];

function resolveUrl(input: FetchInput): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isAbortError(err: unknown): boolean {
  return err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError');
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('This operation was aborted', 'AbortError'));
    };
    if (signal?.aborted) {
      clearTimeout(timer);
      onAbort();
      return;
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

async function pace(host: string, minIntervalMs: number, signal?: AbortSignal): Promise<void> {
  if (minIntervalMs <= 0) return;
  const lane = laneFor(host);
  const previous = lane.tail;
  let release!: () => void;
  lane.tail = new Promise((resolve) => {
    release = resolve;
  });
  try {
    await previous;
    if (signal?.aborted) {
      throw new DOMException('This operation was aborted', 'AbortError');
    }
    const wait = Math.max(0, lane.lastStart + minIntervalMs - Date.now());
    if (wait > 0) await sleep(wait, signal);
    lane.lastStart = Date.now();
  } finally {
    release();
  }
}

function assertCircuitClosed(host: string): void {
  const state = circuitFor(host);
  if (state.openUntil > Date.now()) {
    throw new GatewayPausedError(host);
  }
}

function noteSuccess(host: string): void {
  const state = circuitFor(host);
  state.failures = 0;
  state.openUntil = 0;
  state.rateHits = [];
}

function noteTransportFailure(host: string): void {
  const state = circuitFor(host);
  state.failures += 1;
  if (state.failures >= FAILURES_TO_OPEN) {
    state.openUntil = Date.now() + CIRCUIT_OPEN_MS;
    state.failures = 0;
    console.warn(`[HTTP GATEWAY] ${host} circuit open for ${CIRCUIT_OPEN_MS / 1000}s after repeated failures.`);
  }
}

function noteRateLimit(host: string): void {
  const now = Date.now();
  const state = circuitFor(host);
  state.rateHits = state.rateHits.filter((ts) => now - ts < RATE_WINDOW_MS);
  state.rateHits.push(now);
  if (state.rateHits.length >= RATE_LIMITS_TO_OPEN) {
    state.openUntil = now + CIRCUIT_OPEN_MS;
    state.rateHits = [];
    console.warn(`[HTTP GATEWAY] ${host} paused for ${CIRCUIT_OPEN_MS / 1000}s after repeated HTTP 429.`);
  }
}

function combinedSignal(policy: HostPolicy, init?: RequestInit): AbortSignal | undefined {
  const signals: AbortSignal[] = [];
  if (policy.timeoutMs > 0) signals.push(AbortSignal.timeout(policy.timeoutMs));
  const scope = scopeStorage.getStore();
  if (scope?.signal) signals.push(scope.signal);
  if (init?.signal) signals.push(init.signal);
  if (signals.length === 0) return undefined;
  if (signals.length === 1) return signals[0];
  return AbortSignal.any(signals);
}

/**
 * Run `fn` inside a screening scope. In-flight gateway requests for this scope
 * abort when `signal` aborts, so a timed-out pass stops hitting upstream APIs.
 */
export function runInScope<T>(domain: string, signal: AbortSignal, fn: () => Promise<T>): Promise<T> {
  return scopeStorage.run({ domain, signal }, fn);
}

export async function gatewayFetch(input: FetchInput, init?: RequestInit): Promise<Response> {
  const url = resolveUrl(input);
  const host = hostOf(url);
  if (!host) return nativeFetch(input, init);

  const policy = policyFor(host);
  const scopeSignal = scopeStorage.getStore()?.signal;
  if (pacingEnabled() && policy.serialize) {
    await pace(host, policy.minIntervalMs, scopeSignal);
  }
  if (pacingEnabled()) assertCircuitClosed(host);
  if (scopeSignal?.aborted) {
    throw new DOMException('This operation was aborted', 'AbortError');
  }

  try {
    const response = await nativeFetch(input, { ...init, signal: combinedSignal(policy, init) });
    if (pacingEnabled()) {
      if (response.status === 429) noteRateLimit(host);
      else if (response.status >= 500) noteTransportFailure(host);
      else noteSuccess(host);
    }
    return response;
  } catch (err) {
    if (pacingEnabled() && !isAbortError(err)) noteTransportFailure(host);
    throw err;
  }
}

/** Install once at process startup. Later calls are no-ops. */
export function installHttpGateway(): void {
  const current = globalThis.fetch as typeof fetch & { __opencatzGateway?: boolean };
  if (installed || current.__opencatzGateway) return;
  nativeFetch = current.bind(globalThis);
  const wrapped = (async (input: FetchInput, init?: RequestInit) => gatewayFetch(input, init)) as typeof fetch & {
    __opencatzGateway?: boolean;
  };
  wrapped.__opencatzGateway = true;
  globalThis.fetch = wrapped;
  installed = true;
}

/** Test-only: drop pace lanes, circuits, and the installed flag. */
export function resetHttpGateway(): void {
  lanes.clear();
  circuits.clear();
  installed = false;
  const current = globalThis.fetch as typeof fetch & { __opencatzGateway?: boolean };
  if (!current.__opencatzGateway) {
    nativeFetch = current.bind(globalThis);
  }
}
