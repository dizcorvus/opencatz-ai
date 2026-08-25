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

const DEFAULT_ROBINHOOD_NFT_CONFIG: NFTScreeningConfig = {
  floorSurgeThresholdPct: 10,
  volSpikeThresholdRatio: 1.5,
  minSalesVelocity1h: 2.0,
  passThreshold: 80,
  chains: ['robinhood'],
  trendingLimitPerChain: 8,
};

export class NFTRobinhoodAgent implements ScreeningAgent<NFTSnipingReport> {
  readonly domain = 'nft-robinhood';
  private adapter: OpenSeaAdapter;
  private strategyEngine: StrategyEngine;
  private config: NFTScreeningConfig;

  constructor(adapter?: OpenSeaAdapter, config?: Partial<NFTScreeningConfig>) {
    this.adapter = adapter || new OpenSeaAdapter(undefined, 'robinhood');
    this.strategyEngine = new StrategyEngine();
    this.config = { ...DEFAULT_ROBINHOOD_NFT_CONFIG, ...config };
  }

  public async runScreeningPass(): Promise<AgentReport<NFTSnipingReport>[]> {
    console.log('[NFT ROBINHOOD AGENT] Screening Robinhood Chain NFT momentum signals...');
    const reports: AgentReport<NFTSnipingReport>[] = [];

    const trending = await this.adapter.fetchTrendingCollections(['robinhood'], this.config.trendingLimitPerChain);
    const allSlugs = trending.map(t => t.slug);

    for (const slug of allSlugs) {
      const signals = await this.adapter.fetchFloorSnipingSignals(slug, 'robinhood');
      for (const sig of signals) {
        const report = evaluateNFTListing(sig, this.config);
        if (!report || report.confidenceScore < this.config.passThreshold) continue;

        let confidence = report.confidenceScore;
        try {
          const strat = this.strategyEngine.getActiveStrategy('nft-robinhood');
          if (strat?.evaluate) {
            const ev = this.strategyEngine.runStrategySafely(strat, 'evaluate', buildNFTStrategyCtx(report, 'NFT_ROBINHOOD'));
            if (ev?.recommendedAction === 'SKIP') continue;
            if (ev && typeof ev.confidence === 'number') {
              confidence = Math.round(confidence * 0.7 + Math.max(0, Math.min(100, ev.confidence)) * 0.3);
            }
          }
        } catch (err: any) {
          console.warn(`[NFT ROBINHOOD AGENT] Strategy error: ${err.message}`);
        }

        if (confidence < this.config.passThreshold) continue;

        reports.push({
          passed: true,
          signal: report,
          reason: report.detectionReason,
          confidence,
          payload: buildNFTPayload(report, `👑 Robinhood Chain NFT Radar: ${report.collectionName} active on Robinhood L2 (floor ${report.floorPriceEth} ETH, +${report.floorSurge1hPct.toFixed(1)}% 1h).`, 'NFT_ROBINHOOD'),
        });
      }
    }

    console.log(`[NFT ROBINHOOD AGENT] Pass complete. ${reports.length} signals generated.`);
    return reports;
  }
}
