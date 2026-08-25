export interface ApiKeyPool {
  readonly baseVar: string;
  readonly keys: string[];
  readonly size: number;
  get(): string | undefined;
  markFailed(reason: string): string | undefined;
  reset(): void;
}

const PLACEHOLDER_RE = /YOUR_|placeholder|mock/i;

export function createApiKeyPool(baseVar: string, keys: string[]): ApiKeyPool {
  const clean = keys.map((k) => k.trim()).filter((k) => k && !PLACEHOLDER_RE.test(k));
  let index = 0;
  let failed = new Set<number>();

  return {
    baseVar,
    keys: clean,
    size: clean.length,
    get(): string | undefined {
      return clean[index] ?? undefined;
    },
    markFailed(reason: string): string | undefined {
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
    },
  };
}

export function loadApiKeyPool(baseVar: string, chainHint?: string): ApiKeyPool {
  const primary = process.env[baseVar] || '';
  const backups = process.env[`${baseVar}_BACKUP_KEYS`] || process.env[`${baseVar.replace(/_API_KEY$/, '')}_BACKUP_KEYS`] || '';
  const commaSeparated = process.env[`${baseVar}S`] || process.env[`${baseVar.replace(/_API_KEY$/, '')}_API_KEYS`] || '';

  // Collect indexed backup keys (e.g. GMGN_API_KEY_1, OPENSEA_API_KEY_1 ... 20)
  const indexedKeys: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const k1 = process.env[`${baseVar}_${i}`];
    const k2 = process.env[`${baseVar.replace(/_API_KEY$/, '')}_API_KEY_${i}`];
    if (k1) indexedKeys.push(k1);
    if (k2) indexedKeys.push(k2);
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
    ...backups.split(','),
    ...commaSeparated.split(','),
    ...indexedKeys,
    ...chainKeys,
  ];

  // Deduplicate keys preserving priority order
  const uniqueKeys = Array.from(new Set(allRaw.map((k) => k.trim()).filter(Boolean)));
  return createApiKeyPool(baseVar, uniqueKeys);
}
