import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import type { OpenCatzStrategy, OpenCatzIndicator } from './strategy-types.js';

const requireEsm = createRequire(import.meta.url);

const PROJECT_ROOT = path.resolve(process.cwd());
const DEFAULT_STRATEGIES_DIR = path.join(PROJECT_ROOT, 'strategies');
const DEFAULT_INDICATORS_DIR = path.join(PROJECT_ROOT, 'indicators');

const SAFE_NAME_RE = /^[a-zA-Z0-9_-]+$/;

export class StrategyEngine {
  public strategiesDir: string;
  public indicatorsDir: string;
  public strategiesBackupDir: string;
  public indicatorsBackupDir: string;
  public activeFile: string;

  constructor(opts: { strategiesDir?: string; indicatorsDir?: string } = {}) {
    this.strategiesDir = opts.strategiesDir || DEFAULT_STRATEGIES_DIR;
    this.indicatorsDir = opts.indicatorsDir || DEFAULT_INDICATORS_DIR;
    this.strategiesBackupDir = path.join(this.strategiesDir, '.backup');
    this.indicatorsBackupDir = path.join(this.indicatorsDir, '.backup');
    this.activeFile = path.join(this.strategiesDir, '.active.json');
    this.ensureDirs();
  }

  private ensureDirs(): void {
    for (const dir of [this.strategiesDir, this.indicatorsDir, this.strategiesBackupDir, this.indicatorsBackupDir]) {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
  }

  // ─── Listing / reading ───────────────────────────────────────────────

  public listStrategies(): Array<{ id: string; active: boolean }> {
    this.ensureDirs();
    const activeMap = this.readActiveMap();
    const files = fs.existsSync(this.strategiesDir)
      ? fs.readdirSync(this.strategiesDir).filter((f) => f.endsWith('.mjs'))
      : [];
    return files.map((f) => {
      const id = f.replace(/\.mjs$/, '');
      return { id, active: activeMap[id] === true };
    });
  }

  public readStrategy(name: string): { success: boolean; message: string; data?: { content: string } } {
    if (!SAFE_NAME_RE.test(name)) return { success: false, message: 'Invalid strategy name (use alphanumeric, dash, underscore).' };
    const file = path.join(this.strategiesDir, `${name}.mjs`);
    if (!fs.existsSync(file)) return { success: false, message: `Strategy ${name} not found.` };
    return { success: true, message: `Contents of strategy ${name}.`, data: { content: fs.readFileSync(file, 'utf-8') } };
  }

  // ─── Validation (subprocess import — reliable in dist & test envs) ───

  private validateModuleFile(filePath: string, kind: 'strategy' | 'indicator'): { ok: boolean; error?: string } {
    const url = pathToFileURL(filePath).href;
    const script = `
      const url = process.argv[1];
      const kind = process.argv[2];
      import(url).then((m) => {
        const s = m.default || m;
        if (kind === 'strategy') {
          if (typeof s?.evaluate !== 'function') { console.error('INVALID: module must export { id, evaluate(ctx) }'); process.exit(1); }
          if (typeof s?.id !== 'string' || !s.id) { console.error('INVALID: module must export string id'); process.exit(1); }
        } else {
          if (typeof s?.calculate !== 'function') { console.error('INVALID: module must export { id, calculate(candles) }'); process.exit(1); }
          if (typeof s?.id !== 'string' || !s.id) { console.error('INVALID: module must export string id'); process.exit(1); }
        }
        console.error('VALID'); process.exit(0);
      }).catch((e) => { console.error('INVALID: ' + (e?.message || String(e))); process.exit(1); });
    `;
    try {
      const res = execFileSync(
        process.execPath,
        ['--input-type=module', '-e', script, url, kind],
        { timeout: 20000, encoding: 'utf-8', windowsHide: true }
      );
      return { ok: true };
    } catch (err: any) {
      const stderr = typeof err?.stderr === 'string' ? err.stderr.trim() : (err?.message || 'Validation failed.');
      return { ok: false, error: stderr };
    }
  }

  // ─── Write (sandbox + backup + validate + rollback) ──────────────────

  public writeStrategy(name: string, code: string): { success: boolean; message: string } {
    return this.writeSandboxed(this.strategiesDir, this.strategiesBackupDir, name, code, 'strategy');
  }

  public writeIndicator(name: string, code: string): { success: boolean; message: string } {
    return this.writeSandboxed(this.indicatorsDir, this.indicatorsBackupDir, name, code, 'indicator');
  }

  private writeSandboxed(dir: string, backupDir: string, name: string, code: string, kind: 'strategy' | 'indicator'): { success: boolean; message: string } {
    this.ensureDirs();
    if (!SAFE_NAME_RE.test(name)) return { success: false, message: 'Invalid file name (alphanumeric, dash, underscore only).' };
    if (!code || !code.trim()) return { success: false, message: 'Empty code.' };

    const file = path.join(dir, `${name}.mjs`);
    const existed = fs.existsSync(file);

    // 1. Backup existing version
    if (existed) {
      const backupPath = path.join(backupDir, `${name}.mjs.bak`);
      try {
        fs.copyFileSync(file, backupPath);
      } catch (err: any) {
        return { success: false, message: `Failed to back up the previous version: ${err.message}` };
      }
    }

    // 2. Write new version
    try {
      fs.writeFileSync(file, code, 'utf-8');
    } catch (err: any) {
      return { success: false, message: `Failed to write file: ${err.message}` };
    }

    // 3. Validate (subprocess import + shape check)
    const validation = this.validateModuleFile(file, kind);
    if (!validation.ok) {
      // 4. Rollback on failure
      const backupPath = path.join(backupDir, `${name}.mjs.bak`);
      if (existed && fs.existsSync(backupPath)) {
        try { fs.copyFileSync(backupPath, file); } catch { /* ignore */ }
        return { success: false, message: `Validation failed: ${validation.error}. The previous version has been restored.` };
      }
      if (!existed) {
        try { fs.unlinkSync(file); } catch { /* ignore */ }
      }
      return { success: false, message: `Validation failed: ${validation.error}. The new file has been removed.` };
    }

    return { success: true, message: `✅ ${name} saved & validated successfully.${existed ? ' The previous version was backed up.' : ''}` };
  }

  public rollbackStrategy(name: string): { success: boolean; message: string } {
    return this.rollbackFile(this.strategiesDir, this.strategiesBackupDir, name);
  }

  private rollbackFile(dir: string, backupDir: string, name: string): { success: boolean; message: string } {
    if (!SAFE_NAME_RE.test(name)) return { success: false, message: 'Invalid file name.' };
    const backupPath = path.join(backupDir, `${name}.mjs.bak`);
    if (!fs.existsSync(backupPath)) return { success: false, message: `No backup for ${name}.` };
    try {
      fs.copyFileSync(backupPath, path.join(dir, `${name}.mjs`));
      return { success: true, message: `✅ ${name} rolled back to the backup version.` };
    } catch (err: any) {
      return { success: false, message: `Rollback failed: ${err.message}` };
    }
  }

  // ─── Active strategy per domain ──────────────────────────────────────

  private readActiveMap(): Record<string, boolean | string> {
    if (!fs.existsSync(this.activeFile)) return {};
    try {
      return JSON.parse(fs.readFileSync(this.activeFile, 'utf-8'));
    } catch {
      return {};
    }
  }

  private writeActiveMap(map: Record<string, boolean | string>): void {
    try {
      fs.writeFileSync(this.activeFile, JSON.stringify(map, null, 2), 'utf-8');
    } catch (err: any) {
      console.warn(`[STRATEGY ENGINE] Failed to persist the active map: ${err.message}`);
    }
  }

  public setActiveStrategy(domain: string, strategyId: string): { success: boolean; message: string } {
    const normalizedDomain = domain.toLowerCase().replace(/[_\s]+/g, '-');
    const strategies = this.listStrategies();
    if (!strategies.some((s) => s.id === strategyId)) {
      return { success: false, message: `Strategy ${strategyId} not found in strategies/.` };
    }
    const map = this.readActiveMap();
    map[normalizedDomain] = strategyId;
    for (const s of strategies) {
      if (s.id.startsWith(normalizedDomain) || s.id === strategyId) {
        map[s.id] = s.id === strategyId;
      }
    }
    map[strategyId] = true;
    this.writeActiveMap(map);
    return { success: true, message: `✅ Strategy ${strategyId} is now active for domain ${domain}.` };
  }

  public getActiveStrategy(domain: string): OpenCatzStrategy | null {
    const normalizedDomain = domain.toLowerCase().replace(/[_\s]+/g, '-');
    const map = this.readActiveMap();

    // 1. Direct domain-scoped map entry (e.g. map['meme-robinhood'] = 'meme-robinhood-custom')
    const activeDomainStrategyId = typeof map[normalizedDomain] === 'string' ? map[normalizedDomain] : null;
    if (activeDomainStrategyId) {
      const file = path.join(this.strategiesDir, `${activeDomainStrategyId}.mjs`);
      if (fs.existsSync(file)) {
        try {
          const mod = this.loadModule(file);
          return mod.default || mod;
        } catch (err: any) {
          console.warn(`[STRATEGY ENGINE] Failed to load the active strategy ${activeDomainStrategyId}: ${err.message}`);
        }
      }
    }

    // 2. Search for any strategy starting with the normalized domain marked active
    const activeId = Object.keys(map).find((k) => map[k] === true && k.startsWith(normalizedDomain));
    if (activeId) {
      const file = path.join(this.strategiesDir, `${activeId}.mjs`);
      if (fs.existsSync(file)) {
        try {
          const mod = this.loadModule(file);
          return mod.default || mod;
        } catch (err: any) {
          console.warn(`[STRATEGY ENGINE] Failed to load the active strategy ${activeId}: ${err.message}`);
        }
      }
    }

    // 3. Fallback: domain-default strategy (e.g. meme-solana-default.mjs, meme-robinhood-default.mjs)
    const defaultId = `${normalizedDomain}-default`;
    const defaultFile = path.join(this.strategiesDir, `${defaultId}.mjs`);
    if (fs.existsSync(defaultFile)) {
      try {
        const mod = this.loadModule(defaultFile);
        return mod.default || mod;
      } catch (err: any) {
        console.warn(`[STRATEGY ENGINE] Failed to load the default strategy ${defaultId}: ${err.message}`);
      }
    }
    return null;
  }

  public getIndicator(id: string): OpenCatzIndicator | null {
    const file = path.join(this.indicatorsDir, `${id}.mjs`);
    if (!fs.existsSync(file)) return null;
    try {
      const mod = this.loadModule(file);
      return mod.default || mod;
    } catch (err: any) {
      console.warn(`[STRATEGY ENGINE] Failed to load indicator ${id}: ${err.message}`);
      return null;
    }
  }

  private loadModule(filePath: string): any {
    const mod = requireEsm(filePath);
    return mod.default || mod;
  }

  /**
   * Execute a strategy/indicator evaluate/calculate call with a SANITIZED env.
   * Strategy .mjs files are user/LLM-authored and run in-process; a malicious
   * strategy could otherwise read private keys via process.env. We snapshot the
   * real env, clear sensitive keys for the duration of the call, then restore.
   */
  public runStrategySafely<T extends { evaluate?: (ctx: any) => any; calculate?: (candles: any[]) => any[] }>(
    strategy: T,
    kind: 'evaluate' | 'calculate',
    arg: any
  ): any {
    const fn = kind === 'evaluate' ? strategy?.evaluate : strategy?.calculate;
    if (typeof fn !== 'function') return undefined;
    const snapshot = { ...process.env };
    const sensitiveKeys = Object.keys(process.env).filter((k) =>
      /KEY|TOKEN|SECRET|PRIVATE|PASSWORD|API/i.test(k) || k.startsWith('SOLANA_') || k.startsWith('EVM_') || k.startsWith('AI_')
    );
    for (const k of sensitiveKeys) delete process.env[k];
    try {
      return fn.call(strategy, arg);
    } finally {
      process.env = snapshot; // restore full env
    }
  }
}
