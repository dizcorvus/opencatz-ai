import { GMGNAdapter, GMGNRawToken, SolChain } from '../../adapters/gmgn-adapter.js';
import { globalPriceFeedService } from '../../services/price-feed-service.js';
import { StrategyEngine } from '../../orchestrator/strategy-engine.js';
import type { ScreeningAgent, AgentReport, CallCardPayload } from '../shared/agent-contract.js';
import { createDedupe, preFilterToken, detectMemeSignal, volume24hOf, buildSignalBoostMap, applySignalBoost, toStrategyGmgn, buildMemeThesis, isGraduatedToken, validateMemeConfigUpdate, securityAuditGate, buildTrackAccumulation, trackAccumulationLabel } from '../shared/gmgn-meme-helpers.js';
import type { SignalBoostMap, TrackAccumulation } from '../shared/gmgn-meme-helpers.js';

export interface InkSignal {
  token: GMGNRawToken;
  signalType: 'CTO' | 'REVIVAL' | 'MOMENTUM' | 'NONE';
  confidence: number;
  reasons: string[];
}

export interface InkScreeningConfig {
  chains: SolChain[];
  minVolume1hUsd: number;
  minLiquidityUsd: number;
  minMarketCapUsd: number;
  minAgeHours: number;
  maxRugRatio: number;
  maxRatTraderRate: number;
  maxTop10HolderRate: number;
  minTotalFeeUsd: number;
  passThreshold: number;
  signalTypes: number[];
  rankLimit: number;
  trenchesLimit: number;
  hotSearchesLimit: number;
  trackFeedEnabled: boolean;
  minTrackWallets: number;
  minTrackBuyUsd: number;
  trackFreshMinutes: number;
}

const DEFAULT_CONFIG: InkScreeningConfig = {
  chains: ['ink'],
  minVolume1hUsd: 25000,   // lowered for younger L2 ecosystem
  minLiquidityUsd: 5000,
  minMarketCapUsd: 50000,
  minAgeHours: 0,
  maxRugRatio: 0.3,
  maxRatTraderRate: 0.3,
  maxTop10HolderRate: 0.4,
  minTotalFeeUsd: 250,
  passThreshold: 80,
  signalTypes: [6, 7, 8, 11, 12, 13, 19, 20],
  rankLimit: 100,
  trenchesLimit: 80,
  hotSearchesLimit: 100,
  trackFeedEnabled: true,
  minTrackWallets: 2,
  minTrackBuyUsd: 5000,
  trackFreshMinutes: 30,
};

export class InkScreeningAgent implements ScreeningAgent<InkSignal> {
  readonly domain = 'meme-ink';
  private gmgn: GMGNAdapter;
  private priceFeed = globalPriceFeedService;
  private strategyEngine: StrategyEngine;
  private config: InkScreeningConfig;
  private dedupeTokens = createDedupe();

  constructor(config?: Partial<InkScreeningConfig>) {
    this.gmgn = new GMGNAdapter();
    this.strategyEngine = new StrategyEngine();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  public updateConfig(partial: Record<string, unknown>): { applied: Record<string, unknown>; rejected: string[] } {
    const { applied, rejected } = validateMemeConfigUpdate(partial);
    if (Array.isArray(partial.chains)) {
      const validChains = partial.chains.filter((c): c is SolChain => ['ink'].includes(c as any));
      if (validChains.length > 0) applied.chains = validChains;
      else rejected.push('chains: must be ["ink"]');
    }
    this.config = { ...this.config, ...applied };
    if (Object.keys(applied).length > 0) {
      console.log(`[INK MEME AGENT] Config updated: ${JSON.stringify(applied)}`);
    }
    return { applied, rejected };
  }

  public getConfig(): InkScreeningConfig {
    return { ...this.config };
  }

  public async collectCandidates(): Promise<GMGNRawToken[]> {
    const allChainCandidates = await Promise.all(
      this.config.chains.map(async (chain) => {
        try {
          const [rank, trenches, hotSearches] = await Promise.all([
            this.gmgn.fetchRank(chain, {
              interval: '1h',
              limit: Math.min(this.config.rankLimit, 60),
              filters: ['not_honeypot', 'verified', 'renounced', 'is_out_market'],
            }),
            this.gmgn.fetchTrenches(chain, {
              types: ['completed'],
              limit: Math.min(this.config.trenchesLimit, 50),
              filters: { max_rug_ratio: 0.3, max_insider_ratio: 0.3 },
            }),
            this.gmgn.fetchHotSearches({
              chain,
              interval: '1h',
              limit: Math.min(this.config.hotSearchesLimit, 60),
              filters: ['migrated', 'not_honeypot', 'verified', 'renounced'],
            }),
          ]);

          const results = [...rank, ...trenches.completed, ...hotSearches];
          if (results.length === 0 && typeof (this.gmgn as any).fetchDexScreenerFallback === 'function') {
            try {
              const fallback = await (this.gmgn as any).fetchDexScreenerFallback(chain);
              return fallback;
            } catch {
              return [];
            }
          }
          return results;
        } catch (err: any) {
          console.warn(`[INK MEME AGENT] Failed candidate collection for ${chain}: ${err.message}`);
          if (typeof (this.gmgn as any).fetchDexScreenerFallback === 'function') {
            try {
              return await (this.gmgn as any).fetchDexScreenerFallback(chain);
            } catch {
              return [];
            }
          }
          return [];
        }
      })
    );

    const candidates = allChainCandidates.flat();
    return this.dedupeTokens.dedupe(candidates);
  }

  public async collectSignalBoostMap(): Promise<SignalBoostMap> {
    try {
      const allEvents = await Promise.all(
        this.config.chains.map(async (chain) => {
          try {
            return await this.gmgn.fetchTokenSignals(chain, this.config.signalTypes);
          } catch {
            return [];
          }
        })
      );
      return buildSignalBoostMap(allEvents.flat());
    } catch (err: any) {
      console.warn(`[INK MEME AGENT] Signal boost failed (skipped): ${err.message}`);
      return new Map();
    }
  }

  public async collectTrackAccumulation(): Promise<Map<string, TrackAccumulation>> {
    if (!this.config.trackFeedEnabled) return new Map();
    try {
      const allTrades = await Promise.all(
        this.config.chains.map(async (chain) => {
          try {
            const [sm, kol] = await Promise.all([
              this.gmgn.fetchTrackTrades(chain, 'smartmoney').catch(() => []),
              this.gmgn.fetchTrackTrades(chain, 'kol').catch(() => []),
            ]);
            return [...sm, ...kol];
          } catch {
            return [];
          }
        })
      );
      return buildTrackAccumulation(allTrades.flat());
    } catch (err: any) {
      console.warn(`[INK MEME AGENT] Smart money track failed for Ink: ${err.message}`);
      return new Map();
    }
  }

  public preFilter(t: GMGNRawToken, nativePriceUsd: number | null): { ok: boolean; reason?: string } {
    return preFilterToken(t, {
      minVolume1hUsd: this.config.minVolume1hUsd,
      minLiquidityUsd: this.config.minLiquidityUsd,
      minMarketCapUsd: this.config.minMarketCapUsd,
      minAgeHours: this.config.minAgeHours,
      maxRugRatio: this.config.maxRugRatio,
      maxRatTraderRate: this.config.maxRatTraderRate,
      maxTop10HolderRate: this.config.maxTop10HolderRate,
      minTotalFeeUsd: this.config.minTotalFeeUsd,
    }, nativePriceUsd);
  }

  public detectSignal(t: GMGNRawToken) {
    return detectMemeSignal(t);
  }

  public toStrategyGmgn(t: GMGNRawToken) {
    return toStrategyGmgn(t);
  }

  public buildPayload(t: GMGNRawToken, confidence: number, thesis: string, trackLabel?: string): CallCardPayload {
    const ageHours = t.creationTimestamp ? (Date.now() / 1000 - t.creationTimestamp) / 3600 : null;
    const buys = t.buys || 0;
    const sells = t.sells || 0;
    const txRatio = buys + sells > 0 ? `${buys}B / ${sells}S (${(buys / (buys + sells) * 100).toFixed(0)}% buys)` : 'N/A';
    const top10Str = t.top10HolderRate !== null ? `${(t.top10HolderRate * 100).toFixed(1)}%` : 'N/A';
    const devStr = t.devTeamHoldRate !== null ? `${(t.devTeamHoldRate * 100).toFixed(1)}%` : 'N/A';
    const bundlerStr = t.bundlerRate !== null ? `${(t.bundlerRate * 100).toFixed(1)}%` : 'N/A';
    const rugStr = t.rugRatio !== null ? `${(t.rugRatio * 100).toFixed(1)}% rug ratio` : 'Clean';
    let smStr = t.smartDegenCount || t.renownedCount ? `Smart: ${t.smartDegenCount || 0} degen | ${t.renownedCount || 0} renowned` : 'None';
    if (trackLabel) smStr = `${smStr} | ${trackLabel}`;

    return {
      domain: 'MEME_EVM',
      title: `${t.name} (${t.symbol})`,
      symbol: t.symbol,
      contractAddress: t.address,
      network: 'Ink Chain (Kraken L2)',
      tokenAge: ageHours !== null ? `${ageHours.toFixed(1)}h` : 'N/A',
      priceUsd: t.priceUsd > 0 ? `$${t.priceUsd}` : 'N/A',
      marketCap: t.marketCapUsd > 0 ? `$${(t.marketCapUsd/1000).toFixed(1)}k` : 'N/A',
      liquidity: t.liquidityUsd > 0 ? `$${(t.liquidityUsd/1000).toFixed(1)}k` : 'N/A',
      volume5m: 'N/A',
      volume1h: 'N/A',
      volume24h: (() => { const v = volume24hOf(t); return v > 0 ? `$${(v/1000).toFixed(1)}k` : 'N/A'; })(),
      txRatio,
      top10Pct: top10Str,
      devHoldingPct: devStr,
      sniperPct: 'N/A',
      bundlerPct: bundlerStr,
      dexPaidStatus: t.dexscrBoostFee > 0 ? `✅ $${t.dexscrBoostFee} boost` : (t.dexscrAd ? '✅ DexScreener ad' : 'None'),
      smartMoneyInfo: smStr,
      confidenceScore: confidence,
      securityScore: rugStr,
      aiThesis: thesis,
      gmgnUrl: `https://gmgn.ai/ink/token/${t.address}`,
      dexScreenerUrl: `https://dexscreener.com/ink/${t.address}`,
      rugcheckUrl: `https://gopluslabs.io/token-security/57073/${t.address}`,
      securityAuditPassed: true,
      socialHypeScore: confidence,
      liquidityUsd: t.liquidityUsd,
      volume1hUsd: t.volume1hUsd > 0 ? t.volume1hUsd : volume24hOf(t) / 24,
    };
  }

  public async runScreeningPass(): Promise<AgentReport<InkSignal>[]> {
    console.log('[INK MEME AGENT] Ink Chain (Kraken L2) screening pass started (GMGN/DexScreener)...');
    const reports: AgentReport<InkSignal>[] = [];

    let ethPrice: number | null = null;
    try {
      ethPrice = await this.priceFeed.getPrice('ETH').catch(() => null);
    } catch (err: any) {
      console.warn(`[INK MEME AGENT] Failed to fetch ETH price: ${err.message}`);
    }

    const [rawCandidates, signalBoostMap, trackAcc] = await Promise.all([
      this.collectCandidates(),
      this.collectSignalBoostMap(),
      this.collectTrackAccumulation(),
    ]);

    const candidates = this.dedupeTokens.dedupe(rawCandidates);
    for (const t of candidates) {
      if (!isGraduatedToken(t)) continue;
      const filter = this.preFilter(t, ethPrice);
      if (!filter.ok) continue;

      if (t.source === 'gmgn') {
        const audit = await this.gmgn.fetchTokenSecurity(t.chain, t.address);
        const sec = securityAuditGate(audit);
        if (!sec.ok) continue;
      }

      let det = applySignalBoost(this.detectSignal(t), signalBoostMap, t.address);
      const trackEntry = trackAcc.get(t.address.toLowerCase());
      const trackLabel = trackEntry ? trackAccumulationLabel(trackEntry) : undefined;
      if (trackEntry && trackEntry.buyWalletCount >= 3 && det.type !== 'NONE') {
        det = {
          ...det,
          confidence: Math.min(100, det.confidence + 20),
          reasons: [...det.reasons, `⚡ Cluster of ${trackEntry.buyWalletCount} smart-money wallets bought $${(trackEntry.totalBuyUsd / 1000).toFixed(0)}k (+20)`],
        };
      }
      if (det.type === 'NONE' || det.confidence < this.config.passThreshold) continue;

      let confidence = det.confidence;
      let strategyReason = '';
      try {
        const strat = this.strategyEngine.getActiveStrategy('meme-ink');
        if (strat?.evaluate) {
          const ev = this.strategyEngine.runStrategySafely(strat, 'evaluate', {
            domain: 'MEME_EVM', symbol: t.symbol, contractAddress: t.address,
            priceUsd: t.priceUsd, liquidityUsd: t.liquidityUsd,
            volume24hUsd: volume24hOf(t), volume1hUsd: t.volume1hUsd > 0 ? t.volume1hUsd : volume24hOf(t)/24,
            smartMoneyCount: t.smartDegenCount, securityAuditPassed: true,
            socialHypeScore: confidence,
            gmgn: { ...toStrategyGmgn(t), native_price_usd: ethPrice },
          });
          if (ev?.recommendedAction === 'SKIP') continue;
          if (ev && typeof ev.confidence === 'number') {
            confidence = Math.round(confidence * 0.7 + Math.max(0, Math.min(100, ev.confidence)) * 0.3);
            strategyReason = ev.reason || '';
          }
        }
      } catch (err: any) { console.warn(`[INK MEME AGENT] Strategy failed: ${err.message}`); }

      if (confidence < this.config.passThreshold) continue;

      const thesis = buildMemeThesis(t, det.type, confidence, det.reasons, strategyReason);
      const payload = this.buildPayload(t, confidence, thesis, trackLabel);
      const signal: InkSignal = { token: t, signalType: det.type, confidence, reasons: det.reasons };
      reports.push({ passed: true, signal, reason: thesis, confidence, payload });
      console.log(`[INK MEME AGENT] 🎯 [INK] ${det.type} ${t.symbol} ${confidence}%`);
    }

    console.log(`[INK MEME AGENT] Pass complete. ${reports.length} signals passed.`);
    return reports;
  }
}
