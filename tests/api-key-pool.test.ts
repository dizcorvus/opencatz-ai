import { describe, it, expect, beforeEach } from 'vitest';
import { createApiKeyPool, loadApiKeyPool } from '../src/services/api-key-pool.js';

describe('ApiKeyPool', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  it('filters out placeholders and empty strings', () => {
    const pool = createApiKeyPool('TEST_KEY', ['key1', 'YOUR_KEY_HERE', '', '  ', 'key2']);
    expect(pool.size).toBe(2);
    expect(pool.keys).toEqual(['key1', 'key2']);
  });

  it('rotates keys on failure', () => {
    const pool = createApiKeyPool('TEST_KEY', ['key1', 'key2', 'key3']);
    expect(pool.get()).toBe('key1');
    const next = pool.markFailed('401 Unauthorized');
    expect(next).toBe('key2');
    expect(pool.get()).toBe('key2');
  });

  it('resets when all keys fail', () => {
    const pool = createApiKeyPool('TEST_KEY', ['key1', 'key2']);
    pool.markFailed('fail 1'); // now key2
    pool.markFailed('fail 2'); // reset -> key1
    expect(pool.get()).toBe('key1');
  });

  it('loads backups from environment variables', () => {
    process.env.MY_API_KEY = 'primary-key';
    process.env.MY_API_KEY_BACKUP_KEYS = 'backup1,backup2';
    const pool = loadApiKeyPool('MY_API_KEY');
    expect(pool.size).toBe(3);
    expect(pool.keys).toEqual(['primary-key', 'backup1', 'backup2']);
  });
});
