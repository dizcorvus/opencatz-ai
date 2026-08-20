import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { bootstrapCustomStrategies } from '../src/orchestrator/strategy-bootstrap.js';
import { StrategyEngine } from '../src/orchestrator/strategy-engine.js';

describe('strategy-bootstrap', () => {
  const testDir = path.join(process.cwd(), 'strategies', 'test-bootstrap-temp');
  const mainStrategiesDir = path.join(process.cwd(), 'strategies');
  const customFile = path.join(mainStrategiesDir, 'meme-solana-custom.mjs');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    if (fs.existsSync(customFile)) {
      fs.unlinkSync(customFile);
    }
  });

  it('skips when no prompt file exists', async () => {
    const res = await bootstrapCustomStrategies({ strategiesDir: testDir });
    expect(res.skipped).toBe(true);
    expect(res.generated).toHaveLength(0);
  });

  it('compiles and smoke-tests custom strategy on valid prompt', async () => {
    const promptPath = path.join(testDir, 'custom-strategy-prompt.txt');
    fs.writeFileSync(promptPath, 'Screen high volume tokens with low tax', 'utf-8');

    const fakeAi = {
      generateCompletion: async (msgs: any[]) => {
        const match = msgs[1]?.content?.match(/Domain:\s*([a-zA-Z0-9-]+)/);
        const domain = match ? match[1] : 'meme-solana';
        return `
        export default {
          id: '${domain}-custom',
          name: 'Custom ${domain} Strategy',
          version: '1.0.0',
          description: 'Test custom strategy',
          params: { passThreshold: 80 },
          evaluate(ctx) {
            return { confidence: 85, recommendedAction: 'BUY', reason: 'High volume' };
          }
        };
      `;
      },
    };

    const engine = new StrategyEngine();
    const res = await bootstrapCustomStrategies({
      strategiesDir: testDir,
      aiService: fakeAi,
      engine,
      log: () => {},
    });

    expect(res.generated).toContain('meme-solana-custom');
    expect(res.failed).toHaveLength(0);
  });
});
