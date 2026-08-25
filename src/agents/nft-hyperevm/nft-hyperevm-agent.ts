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

const DEFAULT_HYPEREVM_NFT_CONFIG: NFTScreeningConfig = {
  floorSurgeThresholdPct: 15,
  volSpikeThresholdRatio: 1.5,
  minSalesVelocity1h: 2.0,
  passThreshold: 80,
  chains: ['hyperevm'],
  trendingLimitPerChain: 8,
};

export class NFTHyperEVMAgent implements ScreeningAgent<NFTSnipingReport> {
  readonly domain = 'nft-hyperevm';
  private adapter: OpenSeaAdapter;
  private strategyEngine: StrategyEngine;
  private config: NFTScreeningConfig;

  constructor(adapter?: OpenSeaAdapter, config?: Partial<NFTScreeningConfig>) {
    this.adapter = adapter || new OpenSeaAdapter(undefined, 'hyperevm');
    this.strategyEngine = new StrategyEngine();
    this.config = { ...DEFAULT_HYPEREVM_NFT_CONFIG, ...config };
  }

  public async runScreeningPass(): Promise<AgentReport<NFTSnipingReport>[]> {
    console.log('[NFT HYPEREVM AGENT] Screening Hyperliquid HyperEVM L1 NFT momentum & mints...');
    const reports: AgentReport<NFTSnipingReport>[] = [];

    const candidates = await this.adapter.fetchTrendingCollections(['hyperevm'], this.config.trendingLimitPerChain);
    for (const item of candidates) {
      const signals = await this.adapter.fetchFloorSnipingSignals(item.slug, 'hyperevm');
      for (const sig of signals) {
        const report = evaluateNFTListing(sig, this.config);
        if (!report || report.confidenceScore < this.config.passThreshold) continue;

        let confidence = report.confidenceScore;
        try {
          const strat = this.strategyEngine.getActiveStrategy('nft-hyperevm');
          if (strat?.evaluate) {
            const ev = this.strategyEngine.runStrategySafely(strat, 'evaluate', buildNFTStrategyCtx(report, 'NFT_HYPEREVM'));
            if (ev?.recommendedAction === 'SKIP') continue;
            if (ev && typeof ev.confidence === 'number') {
              confidence = Math.round(confidence * 0.7 + Math.max(0, Math.min(100, ev.confidence)) * 0.3);
            }
          }
        } catch (err: any) {
          console.warn(`[NFT HYPEREVM AGENT] Strategy error: ${err.message}`);
        }

        if (confidence < this.config.passThreshold) continue;

        reports.push({
          passed: true,
          signal: report,
          reason: report.detectionReason,
          confidence,
          payload: buildNFTPayload(report, `⚡ HyperEVM L1 NFT Radar: ${report.collectionName} active on Hyperliquid EVM (floor ${report.floorPriceEth} ETH, +${report.floorSurge1hPct.toFixed(1)}% in 1h).`, 'NFT_HYPEREVM'),
        });
      }
    }

    console.log(`[NFT HYPEREVM AGENT] Pass complete. ${reports.length} signals generated.`);
    return reports;
  }
}
