import { KrystalCloudAdapter, type KrystalPoolSignal } from '../../adapters/krystal-cloud-adapter.js';
import { GMGNAdapter } from '../../adapters/gmgn-adapter.js';
import { securityGateToken, securityAuditGate, tokenSecurityAuditLabel } from '../shared/gmgn-meme-helpers.js';
import type { ScreeningAgent, AgentReport, CallCardPayload } from '../shared/agent-contract.js';

export class LPRobinhoodAgent implements ScreeningAgent<KrystalPoolSignal> {
  readonly domain = 'lp-robinhood';
  private krystal: KrystalCloudAdapter;
  private gmgn: GMGNAdapter;

  constructor(krystal?: KrystalCloudAdapter, gmgn?: GMGNAdapter) {
    this.krystal = krystal || new KrystalCloudAdapter();
    this.gmgn = gmgn || new GMGNAdapter(process.env.GMGN_API_KEY_ROBINHOOD || process.env.GMGN_API_KEY);
  }

  public async runScreeningPass(): Promise<AgentReport<KrystalPoolSignal>[]> {
    console.log('[LP ROBINHOOD AGENT] Scanning Uniswap V3 concentrated liquidity pools on Robinhood Chain...');
    const high = await this.krystal.fetchTopRobinhoodPools();
    const isBaseAsset = (sym: string) => /^(WETH|ETH|USDC|USDT|DAI|WBTC|WSTETH|STETH)$/i.test(sym);
    const enriched = new Map<string, any>();
    const results: AgentReport<KrystalPoolSignal>[] = [];

    for (const p of high) {
      const memeToken = !isBaseAsset(p.token0Symbol)
        ? { addr: p.token0Address, sym: p.token0Symbol }
        : !isBaseAsset(p.token1Symbol)
          ? { addr: p.token1Address, sym: p.token1Symbol }
          : { addr: p.token0Address, sym: p.token0Symbol };
      const baseToken = memeToken.sym === p.token0Symbol
        ? { addr: p.token1Address, sym: p.token1Symbol }
        : { addr: p.token0Address, sym: p.token0Symbol };

      if (memeToken.addr && !enriched.has(memeToken.addr)) {
        try {
          const info = await this.gmgn.fetchTokenInfo('robinhood', memeToken.addr);
          enriched.set(memeToken.addr, info);
        } catch { enriched.set(memeToken.addr, null); }
      }
      const info = enriched.get(memeToken.addr) ?? null;

      if (!info) {
        console.log(`[LP ROBINHOOD] ⛔ Pool rejected: ${memeToken.sym}-${baseToken.sym} — token not found in GMGN.`);
        continue;
      }
      if (info.marketCapUsd < 200000) {
        console.log(`[LP ROBINHOOD] ⛔ Pool rejected: ${memeToken.sym} MC $${(info.marketCapUsd / 1000).toFixed(0)}k < $200k.`);
        continue;
      }
      const sec = securityGateToken(info, { enableTaxGate: false });
      if (!sec.ok) {
        console.log(`[LP ROBINHOOD] ⛔ Pool rejected: ${memeToken.sym}-${baseToken.sym} — ${sec.reasons.join(' ')}`);
        continue;
      }

      const audit = await this.gmgn.fetchTokenSecurity('robinhood', memeToken.addr);
      const secAudit = securityAuditGate(audit, { enableTaxGate: false });
      if (!secAudit.ok) {
        console.log(`[LP ROBINHOOD] ⛔ Pool rejected: ${memeToken.sym}-${baseToken.sym} — AUDIT FAIL: ${secAudit.reasons.join(' ')}`);
        continue;
      }

      const ageHours = info?.creationTimestamp ? (Date.now() / 1000 - info.creationTimestamp) / 3600 : undefined;
      const smart = (info?.smartDegenCount ?? 0) + (info?.renownedCount ?? 0);

      results.push({
        passed: true,
        signal: p,
        reason: p.aiRecommendation,
        confidence: 80,
        payload: {
          domain: 'LP_ROBINHOOD' as const,
          title: `${memeToken.sym}-${baseToken.sym}`,
          symbol: memeToken.sym,
          contractAddress: p.poolAddress,
          network: 'Robinhood Chain',
          liquidity: `$${(p.tvlUsd / 1000).toFixed(1)}k`,
          devHoldingPct: `${p.feeAprPercentage.toFixed(1)}% APR`,
          sniperPct: `${(p.feesToTvlRatio24h * 100).toFixed(2)}% 24h`,
          bundlerPct: `${p.volumeToTvlRatio1h.toFixed(1)}x vol/TVL`,
          feeApr: `${(p.feesToTvlRatio24h * 100).toFixed(2)}% (24h Fee/TVL)`,
          dexPaidStatus: 'Uniswap V3 (Robinhood)',
          tokenVerified: true,
          confidenceScore: 80,
          aiThesis: p.aiRecommendation,
          socialHypeScore: 0,
          poolUrl: p.poolAddress ? `https://dexscreener.com/robinhood/${p.poolAddress}` : undefined,
          token0Address: memeToken.addr,
          token1Address: baseToken.addr,
          token0Symbol: memeToken.sym,
          token1Symbol: baseToken.sym,
          token0ChartUrl: memeToken.addr ? `https://dexscreener.com/robinhood/${memeToken.addr}` : undefined,
          token1ChartUrl: baseToken.addr ? `https://dexscreener.com/robinhood/${baseToken.addr}` : undefined,
          gmgnUrl: memeToken.addr ? `https://gmgn.ai/robinhood/token/${memeToken.addr}` : undefined,
          token0PriceUsd: info?.priceUsd,
          token0MarketCapUsd: info?.marketCapUsd,
          token0Volume24hUsd: info?.volume24hUsd,
          token0Holders: info?.holderCount,
          token0AgeHours: ageHours,
          token0SmartDegenCount: smart > 0 ? smart : undefined,
          liquidityUsd: p.tvlUsd,
          volume1hUsd: p.volume1hUsd,
          securityAuditPassed: true,
          securityScore: tokenSecurityAuditLabel(audit),
        },
      });
    }

    console.log(`[LP ROBINHOOD AGENT] Pass complete. ${results.length} pools passed.`);
    return results;
  }
}
