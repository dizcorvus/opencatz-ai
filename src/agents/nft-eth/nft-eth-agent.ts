import { OpenSeaAdapter } from '../../adapters/opensea-adapter.js';
import { StrategyEngine } from '../../orchestrator/strategy-engine.js';
import type { ScreeningAgent, AgentReport, CallCardPayload } from '../shared/agent-contract.js';
import {
  NFTSnipingReport,
  NFTScreeningConfig,
  evaluateNFTListing,
  deriveNFTCollectionSafety,
  buildNFTPayload,
  buildNFTStrategyCtx,
} from '../shared/nft-helpers.js';

const DEFAULT_ETH_NFT_CONFIG: NFTScreeningConfig = {
  floorSurgeThresholdPct: 20,
  volSpikeThresholdRatio: 2.0,
  minSalesVelocity1h: 5.0,
  passThreshold: 80,
  chains: ['ethereum'],
  trendingLimitPerChain: 8,
};

export class NFTEthAgent implements ScreeningAgent<NFTSnipingReport> {
  readonly domain = 'nft-eth';
  private adapter: OpenSeaAdapter;
  private strategyEngine: StrategyEngine;
  private config: NFTScreeningConfig;

  constructor(adapter?: OpenSeaAdapter, config?: Partial<NFTScreeningConfig>) {
    this.adapter = adapter || new OpenSeaAdapter();
    this.strategyEngine = new StrategyEngine();
    this.config = { ...DEFAULT_ETH_NFT_CONFIG, ...config };
  }

  public async runScreeningPass(): Promise<AgentReport<NFTSnipingReport>[]> {
    console.log('[NFT ETH AGENT] Screening Ethereum Blue-chip & Floor Surge NFT signals...');
    const reports: AgentReport<NFTSnipingReport>[] = [];

    const candidates = await this.adapter.fetchTrendingCollections(['ethereum'], this.config.trendingLimitPerChain);
    for (const item of candidates) {
      const signals = await this.adapter.fetchFloorSnipingSignals(item.slug, 'ethereum');
      for (const sig of signals) {
        const report = evaluateNFTListing(sig, this.config);
        if (!report || report.confidenceScore < this.config.passThreshold) continue;

        let confidence = report.confidenceScore;
        try {
          const strat = this.strategyEngine.getActiveStrategy('nft-eth');
          if (strat?.evaluate) {
            const ev = this.strategyEngine.runStrategySafely(strat, 'evaluate', buildNFTStrategyCtx(report, 'NFT_ETH'));
            if (ev?.recommendedAction === 'SKIP') continue;
            if (ev && typeof ev.confidence === 'number') {
              confidence = Math.round(confidence * 0.7 + Math.max(0, Math.min(100, ev.confidence)) * 0.3);
            }
          }
        } catch (err: any) {
          console.warn(`[NFT ETH AGENT] Strategy error: ${err.message}`);
        }

        if (confidence < this.config.passThreshold) continue;

        const payload = buildNFTPayload(report, report.detectionReason, 'NFT_ETH');
        reports.push({
          passed: true,
          signal: report,
          reason: report.detectionReason,
          confidence,
          payload,
        });
        console.log(`[NFT ETH AGENT] 💎 ETH NFT SIGNAL: ${report.name} (${confidence}%)`);
      }
    }

    return reports;
  }
}
