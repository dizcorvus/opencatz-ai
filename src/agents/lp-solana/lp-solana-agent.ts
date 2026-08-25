import { MeteoraDLMMAdapter, MeteoraPoolSignal } from '../../adapters/meteora-dlmm-adapter.js';
import { GMGNAdapter } from '../../adapters/gmgn-adapter.js';
import { securityGateToken, securityAuditGate, tokenSecurityAuditLabel } from '../shared/gmgn-meme-helpers.js';
import { buildLPPayload } from '../../orchestrator/dispatch.js';
import type { ScreeningAgent, AgentReport } from '../shared/agent-contract.js';

export class LPSolanaAgent implements ScreeningAgent<MeteoraPoolSignal> {
  readonly domain = 'lp-solana';
  private meteora: MeteoraDLMMAdapter;
  private gmgn: GMGNAdapter;

  constructor(meteora?: MeteoraDLMMAdapter, gmgn?: GMGNAdapter) {
    this.meteora = meteora || new MeteoraDLMMAdapter();
    this.gmgn = gmgn || new GMGNAdapter();
  }

  public async runScreeningPass(): Promise<AgentReport<MeteoraPoolSignal>[]> {
    console.log('[LP SOLANA AGENT] Scanning Meteora DLMM concentrated liquidity pools on Solana...');
    const results: AgentReport<MeteoraPoolSignal>[] = [];
    const rawPools = await this.meteora.fetchTopYieldPools();
    const pools = this.meteora.filterHighYieldPools(rawPools);

    const enriched = new Map<string, any>();
    for (const p of pools) {
      if (p.tokenXAddress && !enriched.has(p.tokenXAddress)) {
        try {
          const info = await this.gmgn.fetchTokenInfo('sol', p.tokenXAddress);
          enriched.set(p.tokenXAddress, info);
        } catch { enriched.set(p.tokenXAddress, null); }
      }
      const info = enriched.get(p.tokenXAddress) ?? null;
      if (!info) {
        console.log(`[LP SOLANA] ⛔ Pool rejected: ${p.pairName} — token not found in GMGN (audit cannot be verified).`);
        continue;
      }
      const sec = securityGateToken(info, { enableTaxGate: false });
      if (!sec.ok) {
        console.log(`[LP SOLANA] ⛔ Pool rejected: ${p.pairName} — ${sec.reasons.join(' ')}`);
        continue;
      }
      const audit = await this.gmgn.fetchTokenSecurity('sol', p.tokenXAddress);
      const secAudit = securityAuditGate(audit, { enableTaxGate: false });
      if (!secAudit.ok) {
        console.log(`[LP SOLANA] ⛔ Pool rejected: ${p.pairName} — AUDIT FAIL: ${secAudit.reasons.join(' ')}`);
        continue;
      }

      const payload = buildLPPayload(p);
      payload.token0PriceUsd = info.priceUsd || payload.token0PriceUsd;
      payload.token0MarketCapUsd = info.marketCapUsd || payload.token0MarketCapUsd;
      payload.token0Volume24hUsd = info.volume24hUsd || payload.token0Volume24hUsd;
      payload.token0Holders = info.holderCount || payload.token0Holders;
      payload.token0AgeHours = info.creationTimestamp ? (Date.now() / 1000 - info.creationTimestamp) / 3600 : payload.token0AgeHours;
      const smart = (info.smartDegenCount ?? 0) + (info.renownedCount ?? 0);
      if (smart > 0) payload.token0SmartDegenCount = smart;
      payload.gmgnUrl = `https://gmgn.ai/sol/token/${p.tokenXAddress}`;
      payload.securityAuditPassed = true;
      payload.securityScore = tokenSecurityAuditLabel(audit);

      results.push({
        passed: true,
        signal: p,
        reason: p.aiRecommendation,
        confidence: 80,
        payload,
      });
    }

    console.log(`[LP SOLANA AGENT] Pass complete. ${results.length} pools passed.`);
    return results;
  }
}
