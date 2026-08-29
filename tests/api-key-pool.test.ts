import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createApiKeyPool, loadApiKeyPool } from '../src/services/api-key-pool.js';

describe('ApiKeyPool', () => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
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

  it('AIService seamlessly rotates to AI_BACKUP_KEYS when primary AI_API_KEY hits 429 rate limit or 402 out-of-credit', async () => {
    process.env.AI_API_KEY = 'ai_primary_rate_limited';
    process.env.AI_BACKUP_KEYS = 'ai_backup_valid_1';
    process.env.OPENAI_API_KEY = 'ai_backup_valid_2';

    const { AIService } = await import('../src/services/ai-service.js');
    const aiService = new AIService();
    const config = aiService.getConfig();

    expect(config.apiKeys).toContain('ai_primary_rate_limited');
    expect(config.apiKeys).toContain('ai_backup_valid_1');
    expect(config.apiKeys).toContain('ai_backup_valid_2');
    expect(config.apiKeys.length).toBe(3);

    const calledAuthHeaders: string[] = [];
    globalThis.fetch = vi.fn().mockImplementation(async (_url: string, init: any) => {
      const auth = init?.headers?.['Authorization'] || '';
      calledAuthHeaders.push(auth);

      if (auth.includes('ai_primary_rate_limited')) {
        return new Response(JSON.stringify({ error: { message: 'Rate limit exceeded' } }), { status: 429 });
      }
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: 'Autonomous multichain signal verified by backup key.' } }],
        }),
        { status: 200 }
      );
    });

    const response = await aiService.generateCompletion([
      { role: 'user', content: 'Analyze Base token' },
    ]);

    expect(response).toBe('Autonomous multichain signal verified by backup key.');
    expect(calledAuthHeaders[0]).toContain('ai_primary_rate_limited');
    expect(calledAuthHeaders[1]).toContain('ai_backup_valid_1');
  });

  it('AIService generateWithTools seamlessly rotates to backup key on 429 and updates active key pointer', async () => {
    process.env.AI_API_KEY = 'dead_key';
    process.env.AI_BACKUP_KEYS = 'working_backup_key';

    const { AIService } = await import('../src/services/ai-service.js');
    const aiService = new AIService();

    globalThis.fetch = vi.fn().mockImplementation(async (_url: string, init: any) => {
      const auth = init?.headers?.['Authorization'] || '';
      if (auth.includes('dead_key')) {
        return new Response(JSON.stringify({ error: { message: 'Insufficient credits' } }), { status: 402 });
      }
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: 'Tool executed successfully.',
                tool_calls: [{ id: 'call_1', function: { name: 'get_token_price', arguments: '{"symbol":"BRETT"}' } }],
              },
            },
          ],
        }),
        { status: 200 }
      );
    });

    const result = await aiService.generateWithTools(
      [{ role: 'user', content: 'What is BRETT price?' }],
      [{ name: 'get_token_price', description: 'Get token price', parameters: { type: 'object', properties: {} } }]
    );

    expect(result.content).toBe('Tool executed successfully.');
    expect(result.toolCalls.length).toBe(1);
    expect(result.toolCalls[0].name).toBe('get_token_price');
  });
});
