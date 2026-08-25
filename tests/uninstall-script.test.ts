import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runCleanUninstall, safeExec, removePath } from '../scripts/uninstall-core.mjs';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(),
    rmSync: vi.fn(),
  },
  existsSync: vi.fn(),
  rmSync: vi.fn(),
}));

describe('Uninstall Core & Script Suite', () => {
  const mockLog = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.rmSync).mockReturnValue(undefined);
    vi.mocked(execSync).mockReturnValue(Buffer.from(''));
  });

  describe('safeExec', () => {
    it('returns true on successful execution', () => {
      vi.mocked(execSync).mockReturnValueOnce(Buffer.from('ok'));
      expect(safeExec('pm2 delete test', { timeout: 1000 })).toBe(true);
      expect(execSync).toHaveBeenCalledWith('pm2 delete test', expect.objectContaining({
        timeout: 1000,
        stdio: 'ignore',
        windowsHide: true,
      }));
    });

    it('catches errors gracefully and returns false without crashing', () => {
      vi.mocked(execSync).mockImplementationOnce(() => {
        throw new Error('Process not found or timed out');
      });
      expect(safeExec('pm2 delete nonexistent')).toBe(false);
    });
  });

  describe('removePath', () => {
    it('calls rmSync with retries when file exists', () => {
      vi.mocked(fs.existsSync).mockReturnValueOnce(true);
      const res = removePath('database', 'State DB', { cwd: '/test-root', logFn: mockLog });
      expect(res).toBe(true);
      expect(fs.rmSync).toHaveBeenCalledWith(
        expect.stringContaining('database'),
        expect.objectContaining({ recursive: true, force: true, maxRetries: 5 })
      );
    });

    it('skips silently when file does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValueOnce(false);
      const res = removePath('nonexistent.json', 'Test file', { cwd: '/test-root', logFn: mockLog });
      expect(res).toBe(true);
      expect(fs.rmSync).not.toHaveBeenCalled();
    });

    it('returns false and logs error when rmSync throws', () => {
      vi.mocked(fs.existsSync).mockReturnValueOnce(true);
      vi.mocked(fs.rmSync).mockImplementationOnce(() => {
        throw new Error('EPERM: operation not permitted');
      });
      const res = removePath('locked-file.log', 'Locked', { cwd: '/test-root', logFn: mockLog });
      expect(res).toBe(false);
    });
  });

  describe('runCleanUninstall', () => {
    it('cancels if user declines the master confirmation', async () => {
      const promptMock = vi.fn().mockResolvedValueOnce('n');
      const result = await runCleanUninstall({
        isForce: false,
        promptFn: promptMock,
        logFn: mockLog,
        printBanner: false,
      });

      expect(result.ok).toBe(false);
      expect(result.canceled).toBe(true);
      expect(execSync).not.toHaveBeenCalled();
      expect(fs.rmSync).not.toHaveBeenCalled();
    });

    it('executes full sequence when user answers "y" to all prompts sequentially', async () => {
      // 1. Master confirm, 2. .env confirm, 3. node_modules confirm
      const promptMock = vi
        .fn()
        .mockResolvedValueOnce('y')
        .mockResolvedValueOnce('y')
        .mockResolvedValueOnce('y');

      const result = await runCleanUninstall({
        isForce: false,
        promptFn: promptMock,
        logFn: mockLog,
        printBanner: false,
      });

      expect(result.ok).toBe(true);
      expect(result.canceled).toBe(false);
      expect(promptMock).toHaveBeenCalledTimes(3);

      // Verify PM2 & unlink
      expect(execSync).toHaveBeenCalledWith(expect.stringContaining('pm2 delete'), expect.any(Object));
      expect(execSync).toHaveBeenCalledWith(expect.stringContaining('npm unlink'), expect.any(Object));

      // Verify rmSync called for DB, env, dist, logs, and node_modules
      expect(fs.rmSync).toHaveBeenCalledWith(expect.stringContaining('database'), expect.any(Object));
      expect(fs.rmSync).toHaveBeenCalledWith(expect.stringContaining('.env'), expect.any(Object));
      expect(fs.rmSync).toHaveBeenCalledWith(expect.stringContaining('dist'), expect.any(Object));
      expect(fs.rmSync).toHaveBeenCalledWith(expect.stringContaining('node_modules'), expect.any(Object));
    });

    it('executes fully without prompting when isForce is true', async () => {
      const promptMock = vi.fn();
      const result = await runCleanUninstall({
        isForce: true,
        promptFn: promptMock,
        logFn: mockLog,
        printBanner: false,
      });

      expect(result.ok).toBe(true);
      expect(promptMock).not.toHaveBeenCalled();
      expect(fs.rmSync).toHaveBeenCalledWith(expect.stringContaining('dist'), expect.any(Object));
      expect(fs.rmSync).toHaveBeenCalledWith(expect.stringContaining('node_modules'), expect.any(Object));
    });

    it('respects --keep-env flag', async () => {
      const promptMock = vi.fn().mockResolvedValueOnce('y').mockResolvedValueOnce('y');
      const result = await runCleanUninstall({
        isForce: false,
        keepEnv: true,
        promptFn: promptMock,
        logFn: mockLog,
        printBanner: false,
      });

      expect(result.ok).toBe(true);
      // Prompt should only be called twice (master confirm, node_modules confirm)
      expect(promptMock).toHaveBeenCalledTimes(2);

      const rmCalls = vi.mocked(fs.rmSync).mock.calls.map((c) => c[0] as string);
      const envDeleted = rmCalls.some((p) => p.endsWith('.env'));
      expect(envDeleted).toBe(false);
    });

    it('respects --keep-data flag', async () => {
      const promptMock = vi.fn().mockResolvedValueOnce('y').mockResolvedValueOnce('y').mockResolvedValueOnce('y');
      const result = await runCleanUninstall({
        isForce: false,
        keepData: true,
        promptFn: promptMock,
        logFn: mockLog,
        printBanner: false,
      });

      expect(result.ok).toBe(true);
      const rmCalls = vi.mocked(fs.rmSync).mock.calls.map((c) => c[0] as string);
      const dbDeleted = rmCalls.some((p) => p.endsWith('database'));
      expect(dbDeleted).toBe(false);
    });

    it('respects --keep-modules flag', async () => {
      const promptMock = vi.fn().mockResolvedValueOnce('y').mockResolvedValueOnce('y');
      const result = await runCleanUninstall({
        isForce: false,
        keepModules: true,
        promptFn: promptMock,
        logFn: mockLog,
        printBanner: false,
      });

      expect(result.ok).toBe(true);
      // Prompt should only be called twice (master confirm, .env confirm)
      expect(promptMock).toHaveBeenCalledTimes(2);

      const rmCalls = vi.mocked(fs.rmSync).mock.calls.map((c) => c[0] as string);
      const modulesDeleted = rmCalls.some((p) => p.endsWith('node_modules'));
      expect(modulesDeleted).toBe(false);
    });
  });
});
