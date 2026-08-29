import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TelegramService } from '../src/telegram/telegram-service.js';
import { StateStore } from '../src/services/state-store.js';
import fs from 'fs';
import path from 'path';

describe('TelegramService & Standalone Broadcasting', () => {
  const testDbPath = path.resolve(process.cwd(), 'database', `test_telegram_service_${Date.now()}.json`);
  let stateStore: StateStore;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    stateStore = new StateStore(testDbPath);
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch {}
    }
  });

  it('isEnabled() returns true only when botToken and chatId are set', () => {
    const serviceDisabled = new TelegramService({});
    expect(serviceDisabled.isEnabled()).toBe(false);

    const serviceEnabled = new TelegramService({
      botToken: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
      chatId: '-1001234567890',
    });
    expect(serviceEnabled.isEnabled()).toBe(true);
  });

  it('sendMessage() delivers payload with chat_id and message_thread_id', async () => {
    let capturedBody: any = null;
    global.fetch = vi.fn().mockImplementation(async (url: string, init: any) => {
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, result: { message_id: 999 } }),
      };
    }) as any;

    const service = new TelegramService({
      botToken: 'test_token',
      chatId: '-100999',
    });

    const success = await service.sendMessage('Hello OpenCatz!', 'Markdown', undefined, 42);
    expect(success).toBe(true);
    expect(capturedBody).toEqual({
      chat_id: '-100999',
      text: 'Hello OpenCatz!',
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      reply_markup: undefined,
      message_thread_id: 42,
    });
  });

  it('sendMessage() handles network or HTTP failure gracefully without throwing', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

    const service = new TelegramService({
      botToken: 'test_token',
      chatId: '-100999',
    });

    const success = await service.sendMessage('Test message');
    expect(success).toBe(false);
  });

  it('createForumTopic() saves thread ID to memory and StateStore', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string, init: any) => {
      const body = JSON.parse(init.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          result: { message_thread_id: 101, name: body.name },
        }),
      };
    }) as any;

    const service = new TelegramService({
      botToken: 'test_token',
      chatId: '-100999',
    });
    service.attachStateStore(stateStore);

    const threadId = await service.createForumTopic('call-meme-solana');
    expect(threadId).toBe(101);

    // StateStore persistence check
    const savedTopics = stateStore.getTelegramTopics();
    expect(savedTopics['call-meme-solana']).toBe(101);

    // Calling again returns cached thread ID without repeating network call
    const fetchCallCount = (global.fetch as any).mock.calls.length;
    const cachedThreadId = await service.createForumTopic('call-meme-solana');
    expect(cachedThreadId).toBe(101);
    expect((global.fetch as any).mock.calls.length).toBe(fetchCallCount);
  });

  it('attachStateStore() restores previously saved forum topic thread IDs', () => {
    stateStore.setTelegramTopic('call-meme-solana', 201);
    stateStore.setTelegramTopic('call-meme-base', 202);

    const service = new TelegramService({
      botToken: 'test_token',
      chatId: '-100999',
    });
    service.attachStateStore(stateStore);

    let capturedThreadId: number | undefined;
    global.fetch = vi.fn().mockImplementation(async (url: string, init: any) => {
      const body = JSON.parse(init.body);
      capturedThreadId = body.message_thread_id;
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, result: { message_id: 888 } }),
      };
    }) as any;

    service.broadcastSignalCall('High Conviction Buy', 'SOLCAT', 'So11111111111111111111111111111111111111112', 'AI Thesis', undefined, 'call-meme-solana');
    expect(capturedThreadId).toBe(201);
  });

  it('bootstrapTelegramTopics() auto-provisions all 17 channels', async () => {
    const createdNames: string[] = [];
    global.fetch = vi.fn().mockImplementation(async (url: string, init: any) => {
      const body = JSON.parse(init.body);
      createdNames.push(body.name);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          result: { message_thread_id: createdNames.length + 100, name: body.name },
        }),
      };
    }) as any;

    const service = new TelegramService({
      botToken: 'test_token',
      chatId: '-100999',
    });

    const results = await service.bootstrapTelegramTopics();
    expect(Object.keys(results).length).toBe(17);
    expect(results['call-meme-solana']).toBeDefined();
    expect(results['call-meme-base']).toBeDefined();
    expect(results['call-meme-eth']).toBeDefined();
    expect(results['call-meme-ink']).toBeDefined();
    expect(results['call-nft-hyperevm']).toBeDefined();
    expect(results['call-whale-tracking']).toBeDefined();
    expect(results['call-prediction-markets']).toBeDefined();
    expect(results['call-ct-alpha']).toBeDefined();
    expect(results['opencatz-control-room']).toBeDefined();
  });

  it('broadcastSignalCall() formats DexScreener chart links and dispatches call card', async () => {
    let capturedText = '';
    global.fetch = vi.fn().mockImplementation(async (url: string, init: any) => {
      const body = JSON.parse(init.body);
      capturedText = body.text;
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, result: { message_id: 777 } }),
      };
    }) as any;

    const service = new TelegramService({
      botToken: 'test_token',
      chatId: '-100999',
    });

    await service.broadcastSignalCall(
      'Breakout Alert',
      'PEPECAT',
      '0x1234567890123456789012345678901234567890',
      'Strong whale inflows and +30% volume spike',
      undefined,
      'call-meme-base'
    );

    expect(capturedText).toContain('🚨 *OPENCATZ CALL: Breakout Alert ($PEPECAT)*');
    expect(capturedText).toContain('0x1234567890123456789012345678901234567890');
    expect(capturedText).toContain('Strong whale inflows and +30% volume spike');
    expect(capturedText).toContain('https://dexscreener.com/base/0x1234567890123456789012345678901234567890');
  });
});
