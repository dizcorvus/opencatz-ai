import { OpenSeaAdapter } from '../../adapters/opensea-adapter.js';
import { StrategyEngine } from '../../orchestrator/strategy-engine.js';
import type { ScreeningAgent, AgentReport } from '../shared/agent-contract.js';
import {
  NFTSnipingReport,
  NFTScreeningConfig,
  evaluateNFTListing,
  buildNFTPayload,
  buildNFTStrategyCtx,
} from '../shared/nft-helpers.js';

const DEFAULT_INK_NFT_CONFIG: NFTScreeningConfig = {
  floorSurgeThresholdPct: 15,
  volSpikeThresholdRatio: 1.5,
  minSalesVelocity1h: 3.0,
  passThreshold: 80,
  chains: ['ink'],
  trendingLimitPerChain: 8,
};

export class NFTInkAgent implements ScreeningAgent<NFTSnipingReport> {
  readonly domain = 'nft-ink';
  private adapter: OpenSeaAdapter;
  private strategyEngine: StrategyEngine;
  private config: NFTScreeningConfig;

  constructor(adapter?: OpenSeaAdapter, config?: Partial<NFTScreeningConfig>) {
    this.adapter = adapter || new OpenSeaAdapter(undefined, 'ink');
    this.strategyEngine = new StrategyEngine();
    this.config = { ...DEFAULT_INK_NFT_CONFIG, ...config };
  }

  public async runScreeningPass(): Promise<AgentReport<NFTSnipingReport>[]> {
    console.log('[NFT INK AGENT] Screening Ink Chain (Kraken L2) NFT momentum & mints...');
    const reports: AgentReport<NFTSnipingReport>[] = [];

    const candidates = await this.adapter.fetchTrendingCollections(['ink'], this.config.trendingLimitPerChain);
    for (const item of candidates) {
      const signals = await this.adapter.fetchFloorSnipingSignals(item.slug, 'ink');
      for (const sig of signals) {
        const report = evaluateNFTListing(sig, this.config);
        if (!report || report.confidenceScore < this.config.passThreshold) continue;

        let confidence = report.confidenceScore;
        try {
          const strat = this.strategyEngine.getActiveStrategy('nft-ink');
          if (strat?.evaluate) {
            const ev = this.strategyEngine.runStrategySafely(strat, 'evaluate', buildNFTStrategyCtx(report, 'NFT_INK'));
            if (ev?.recommendedAction === 'SKIP') continue;
            if (ev && typeof ev.confidence === 'number') {
              confidence = Math.round(confidence * 0.7 + Math.max(0, Math.min(100, ev.confidence)) * 0.3);
            }
          }
        } catch (err: any) {
          console.warn(`[NFT INK AGENT] Strategy error: ${err.message}`);
        }

        if (confidence < this.config.passThreshold) continue;

        reports.push({
          passed: true,
          signal: report,
          reason: report.detectionReason,
          confidence,
          payload: buildNFTPayload(report, `⚡ Ink Chain NFT Momentum: ${report.collectionName} floor +${report.floorSurge1hPct.toFixed(1)}% in 1h with ${report.salesVelocity1h.toFixed(0)} sales/h on Kraken L2.`, 'NFT_INK'),
        });
      }
    }

    console.log(`[NFT INK AGENT] Pass complete. ${reports.length} signals generated.`);
    return reports;
  }
}
