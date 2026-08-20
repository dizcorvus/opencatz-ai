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

export function loadApiKeyPool(baseVar: string): ApiKeyPool {
  const primary = process.env[baseVar] || '';
  const backups = process.env[`${baseVar}_BACKUP_KEYS`] || process.env[`${baseVar.replace(/_API_KEY$/, '')}_BACKUP_KEYS`] || '';
  const commaSeparated = process.env[`${baseVar}S`] || process.env[`${baseVar.replace(/_API_KEY$/, '')}_API_KEYS`] || '';

  // Collect indexed backup keys (e.g. GMGN_API_KEY_1, GMGN_API_KEY_2 ... GMGN_API_KEY_10)
  const indexedKeys: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const k1 = process.env[`${baseVar}_${i}`];
    const k2 = process.env[`${baseVar.replace(/_API_KEY$/, '')}_API_KEY_${i}`];
    if (k1) indexedKeys.push(k1);
    if (k2) indexedKeys.push(k2);
  }

  // Collect chain-specific keys if baseVar relates to GMGN
  const chainKeys: string[] = [];
  if (baseVar.includes('GMGN')) {
    for (const suffix of ['ROBINHOOD', 'SOLANA', 'BASE', 'ETH', 'BSC']) {
      const k = process.env[`GMGN_API_KEY_${suffix}`];
      if (k) chainKeys.push(k);
    }
  }

  const allRaw = [
    primary,
    ...backups.split(','),
    ...commaSeparated.split(','),
    ...indexedKeys,
    ...chainKeys,
  ];

  // Deduplicate keys preserving order
  const uniqueKeys = Array.from(new Set(allRaw.map((k) => k.trim()).filter(Boolean)));
  return createApiKeyPool(baseVar, uniqueKeys);
}
