export interface ApiKeyPool {
  readonly baseVar: string;
  readonly keys: string[];
  readonly size: number;
  get(): string | undefined;
  /**
   * Rotate away from the active key.
   * `cooldownMs` parks that key so the next calls skip it until the window ends.
   * With cooldown 0 the historical rotate-and-reset behavior is unchanged.
   */
  markFailed(reason: string, cooldownMs?: number): string | undefined;
  reset(): void;
}

const PLACEHOLDER_RE = /YOUR_|placeholder|mock/i;

export function createApiKeyPool(baseVar: string, keys: string[]): ApiKeyPool {
  const clean = keys.map((k) => k.trim()).filter((k) => k && !PLACEHOLDER_RE.test(k));
  let index = 0;
  let failed = new Set<number>();
  const cooledUntil = clean.map(() => 0);

  const nextAvailable = (from: number): number | undefined => {
    if (clean.length === 0) return undefined;
    const now = Date.now();
    for (let step = 0; step < clean.length; step++) {
      const candidate = (from + step) % clean.length;
      if (cooledUntil[candidate] <= now) return candidate;
    }
    return undefined;
  };

  return {
    baseVar,
    keys: clean,
    size: clean.length,
    get(): string | undefined {
      const available = nextAvailable(index);
      if (available === undefined) return undefined;
      index = available;
      return clean[index];
    },
    markFailed(reason: string, cooldownMs = 0): string | undefined {
      if (clean.length === 0) return undefined;
      if (cooldownMs > 0) {
        cooledUntil[index] = Date.now() + cooldownMs;
        console.warn(`[API KEY POOL] ${baseVar}: key #${index + 1}/${clean.length} cooling ${Math.ceil(cooldownMs / 1000)}s (${reason}).`);
        if (clean.length === 1) return undefined;
        const available = nextAvailable((index + 1) % clean.length);
        if (available === undefined) {
          console.warn(`[API KEY POOL] ${baseVar}: every key is cooling — requests pause until one recovers.`);
          return undefined;
        }
        index = available;
        console.warn(`[API KEY POOL] ${baseVar}: rotating to key #${index + 1}/${clean.length} (${reason}).`);
        return clean[index];
      }
      if (clean.length <= 1) return clean[0] ?? undefined;
      failed.add(index);
      if (failed.size >= clean.length) {
        failed = new Set();
        console.warn(`[API KEY POOL] ${baseVar}: all keys failed — rotation reset.`);
      }
      let next = index;
      do {
        next = (next + 1) % clean.length;
      } while (failed.has(next) && failed.size < clean.length);
      index = next;
      console.warn(`[API KEY POOL] ${baseVar}: rotating to key #${index + 1}/${clean.length} (${reason}).`);
      return clean[index] ?? undefined;
    },
    reset(): void {
      failed = new Set();
      for (let i = 0; i < cooledUntil.length; i++) cooledUntil[i] = 0;
    },
  };
}

export function loadApiKeyPool(baseVar: string, chainHint?: string): ApiKeyPool {
  const primary = process.env[baseVar] || '';
  const backups = process.env[`${baseVar}_BACKUP_KEYS`] || process.env[`${baseVar.replace(/_API_KEY$/, '')}_BACKUP_KEYS`] || '';
  const singleBackup = process.env[`${baseVar}_BACKUP`] || process.env[`${baseVar.replace(/_API_KEY$/, '')}_BACKUP`] || process.env[`${baseVar}_BACKUP_KEY`] || '';
  const commaSeparated = process.env[`${baseVar}S`] || process.env[`${baseVar.replace(/_API_KEY$/, '')}_API_KEYS`] || '';

  // Collect indexed backup keys (e.g. GMGN_API_KEY_1, OPENSEA_API_KEY_1 ... 20)
  const indexedKeys: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const k1 = process.env[`${baseVar}_${i}`];
    const k2 = process.env[`${baseVar.replace(/_API_KEY$/, '')}_API_KEY_${i}`];
    const k3 = process.env[`${baseVar.replace(/_API_KEY$/, '')}_KEY_${i}`];
    if (k1) indexedKeys.push(k1);
    if (k2) indexedKeys.push(k2);
    if (k3) indexedKeys.push(k3);
  }

  // Collect chain-specific keys (e.g. GMGN_API_KEY_ETH, OPENSEA_API_KEY_BASE, etc.)
  const chainKeys: string[] = [];
  const normalizedHint = chainHint ? chainHint.toUpperCase().replace(/[-_]/g, '') : '';
  let hintKey: string | undefined;

  const supportedChains = ['ETH', 'ETHEREUM', 'BASE', 'INK', 'ROBINHOOD', 'RH', 'HYPEREVM', 'HYPER', 'SOLANA', 'SOL', 'BSC', 'POLYGON', 'ARBITRUM'];
  for (const c of supportedChains) {
    const k1 = process.env[`${baseVar}_${c}`];
    const k2 = process.env[`${baseVar.replace(/_API_KEY$/, '')}_API_KEY_${c}`];
    if (k1) {
      if (normalizedHint && (c === normalizedHint || (c === 'ETH' && normalizedHint === 'ETHEREUM') || (c === 'RH' && normalizedHint === 'ROBINHOOD'))) {
        hintKey = k1;
      } else {
        chainKeys.push(k1);
      }
    }
    if (k2) {
      if (normalizedHint && (c === normalizedHint || (c === 'ETH' && normalizedHint === 'ETHEREUM') || (c === 'RH' && normalizedHint === 'ROBINHOOD'))) {
        hintKey = k2;
      } else {
        chainKeys.push(k2);
      }
    }
  }

  // If a chain hint key is matched, put it at the very front of the queue
  const allRaw = [
    ...(hintKey ? [hintKey] : []),
    primary,
    singleBackup,
    ...backups.split(','),
    ...commaSeparated.split(','),
    ...indexedKeys,
    ...chainKeys,
  ];

  // Deduplicate keys preserving priority order
  const uniqueKeys = Array.from(new Set(allRaw.map((k) => k.trim()).filter(Boolean)));

  return createApiKeyPool(baseVar, uniqueKeys);
}
