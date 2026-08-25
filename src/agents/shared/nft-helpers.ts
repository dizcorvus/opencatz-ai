import { OpenSeaAdapter, OpenSeaNFTSignal, OpenSeaWhaleInfo } from '../../adapters/opensea-adapter.js';
import { StrategyEngine } from '../../orchestrator/strategy-engine.js';
import type { StrategyContext } from '../../orchestrator/strategy-types.js';
import type { AgentReport, CallCardPayload } from './agent-contract.js';

export interface NFTSnipingReport {
  collectionSlug: string;
  collectionName: string;
  tokenId: string;
  name: string;
  chain: 'ethereum' | 'polygon' | 'base' | 'arbitrum' | 'robinhood' | 'ink' | 'hyperevm';
  priceEth: number;
  floorPriceEth: number;
  floorSurge1hPct: number;
  volumeSpike1hRatio: number;
  salesVelocity1h: number;
  isFloorSurge: boolean;
  isVolumeSpike: boolean;
  isWhaleSweep: boolean;
  isVerified: boolean;
  whaleInfo?: OpenSeaWhaleInfo;
  openseaUrl: string;
  confidenceScore: number; // 0 - 100
  detectionReason: string;
}

export interface NFTScreeningConfig {
  floorSurgeThresholdPct: number;   // REQUIRED filter: floor up >= 20% within 1h
  volSpikeThresholdRatio: number;   // REQUIRED filter: volume >= 2.0x baseline
  minSalesVelocity1h: number;       // REQUIRED filter: >= 5 sales/hour (genuinely active collection)
  passThreshold: number;            // confidence card gate (>= 80)
  chains: string[];                 // multichain
  trendingLimitPerChain: number;    // top N trending collections per chain per pass
}

export const DEFAULT_NFT_CONFIG: NFTScreeningConfig = {
  floorSurgeThresholdPct: 20,
  volSpikeThresholdRatio: 2.0,
  minSalesVelocity1h: 5.0,
  passThreshold: 80,
  chains: ['ethereum'],
  trendingLimitPerChain: 5,
};

export function evaluateNFTListing(signal: OpenSeaNFTSignal, config: NFTScreeningConfig): NFTSnipingReport | null {
  const isFloorSurge = signal.floorSurge1hPct >= config.floorSurgeThresholdPct;
  const isVolumeSpike = signal.volumeSpike1hRatio >= config.volSpikeThresholdRatio;
  const isHighVelocity = signal.salesVelocity1h >= config.minSalesVelocity1h;
  const isWhaleSweep = signal.isWhaleSweep && Boolean(signal.whaleInfo);

  if (!(isFloorSurge && isVolumeSpike && isHighVelocity)) {
    return null;
  }

  let confidenceScore = 80;
  if (isWhaleSweep) confidenceScore += 10;
  if (signal.isVerified) confidenceScore += 10;
  confidenceScore = Math.min(100, confidenceScore);

  const verifiedBadge = signal.isVerified ? '✅ Verified' : '⚠️ Unverified';
  const chainLabel = signal.chain.charAt(0).toUpperCase() + signal.chain.slice(1);
  let detectionReason = 'NFT Momentum Signal Detected';
  if (isWhaleSweep) {
    detectionReason = `🚀 NFT PUMP & WHALE SWEEP (${chainLabel}): ${signal.collectionName} Floor surged +${signal.floorSurge1hPct.toFixed(1)}% in 1h with Sweep (${signal.whaleInfo?.address.slice(0, 8)}... bought ${signal.whaleInfo?.buyCount} items / ${signal.whaleInfo?.spentEth.toFixed(2)} ETH)!`;
  } else {
    detectionReason = `📈 FLOOR PUMP SURGE (${chainLabel}): ${signal.collectionName} Floor price surged +${signal.floorSurge1hPct.toFixed(1)}% in 1 hour (vol ${signal.volumeSpike1hRatio.toFixed(1)}x, ${signal.salesVelocity1h.toFixed(1)} sales/h)!`;
  }
  detectionReason += ` [${verifiedBadge}]`;

  return {
    collectionSlug: signal.collectionSlug,
    collectionName: signal.collectionName,
    tokenId: signal.tokenId,
    name: signal.name,
    chain: signal.chain,
    priceEth: signal.priceEth,
    floorPriceEth: signal.floorPriceEth,
    floorSurge1hPct: signal.floorSurge1hPct,
    volumeSpike1hRatio: signal.volumeSpike1hRatio,
    salesVelocity1h: signal.salesVelocity1h,
    isFloorSurge,
    isVolumeSpike,
    isWhaleSweep,
    isVerified: signal.isVerified,
    whaleInfo: signal.whaleInfo,
    openseaUrl: signal.openseaUrl,
    confidenceScore,
    detectionReason,
  };
}

export function deriveNFTCollectionSafety(report: NFTSnipingReport, minVelocity = 0): boolean {
  const floorOk = report.floorPriceEth > 0.005;
  const velocityOk = report.salesVelocity1h > minVelocity;
  const momentumOk = report.isWhaleSweep || report.isFloorSurge || report.isVolumeSpike;
  return floorOk && velocityOk && momentumOk;
}

export function buildNFTPayload(report: NFTSnipingReport, thesis: string, domainTag = 'NFT'): CallCardPayload {
  const title = report.tokenId ? `${report.collectionName} #${report.tokenId}` : `${report.collectionName} (floor)`;
  return {
    domain: domainTag as any,
    title,
    symbol: report.collectionSlug.toUpperCase(),
    contractAddress: 'N/A',
    network: report.chain.toUpperCase(),
    priceUsd: `${report.priceEth} ETH`,
    marketCap: `Floor: ${report.floorPriceEth} ETH (+${report.floorSurge1hPct.toFixed(1)}% 1h)`,
    confidenceScore: report.confidenceScore,
    aiThesis: thesis,
    dexScreenerUrl: report.openseaUrl,
    tokenVerified: report.isVerified,
    liquidityUsd: 0,
    volume1hUsd: 0,
    securityAuditPassed: deriveNFTCollectionSafety(report),
    socialHypeScore: report.confidenceScore,
  };
}

export function buildNFTStrategyCtx(report: NFTSnipingReport, domainTag = 'NFT'): StrategyContext {
  return {
    domain: domainTag,
    symbol: report.collectionSlug,
    contractAddress: 'N/A',
    priceUsd: 0,
    liquidityUsd: 0,
    volume24hUsd: 0,
    volume1hUsd: 0,
    smartMoneyCount: report.isWhaleSweep ? 1 : 0,
    securityAuditPassed: deriveNFTCollectionSafety(report),
    socialHypeScore: report.confidenceScore,
    floorPriceEth: report.floorPriceEth,
    priceEth: report.priceEth,
    floorSurge1hPct: report.floorSurge1hPct,
    volumeSpike1hRatio: report.volumeSpike1hRatio,
    salesVelocity1h: report.salesVelocity1h,
    isFloorSurge: report.isFloorSurge,
    isVolumeSpike: report.isVolumeSpike,
    isWhaleSweep: report.isWhaleSweep,
    isVerified: report.isVerified,
    nft: {
      slug: report.collectionSlug,
      floor_price_eth: report.floorPriceEth,
      price_eth: report.priceEth,
      floor_surge_1h_pct: report.floorSurge1hPct,
      volume_spike_1h_ratio: report.volumeSpike1hRatio,
      sales_velocity_1h: report.salesVelocity1h,
      is_floor_surge: report.isFloorSurge,
      is_volume_spike: report.isVolumeSpike,
      is_whale_sweep: report.isWhaleSweep,
      is_verified: report.isVerified,
    },
  };
}
