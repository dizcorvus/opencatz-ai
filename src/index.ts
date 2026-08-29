import dotenv from 'dotenv';
import path from 'path';
import { isDryRun as isDryRunMode } from './config/config.js';
import { Client, GatewayIntentBits, REST, Routes, ChannelType } from 'discord.js';
import { buildCallEmbed } from './discord/embeds/call-embed.js';
import type { CallCardPayload as CallSignalPayload } from './agents/shared/agent-contract.js';
import { OpenCatzHub } from './orchestrator/hub.js';
import { dispatchDomain } from './orchestrator/dispatch.js';
import { SwarmConsensusEngine } from './orchestrator/swarm-consensus.js';
import { StrategyEngine } from './orchestrator/strategy-engine.js';
import { PositionManager } from './position/position-manager.js';
import { AIService } from './services/ai-service.js';
import { slashCommands } from './discord/commands/index.js';
import { handleInteraction } from './discord/handlers/interaction-handler.js';
import { handleControlRoomMessage } from './discord/handlers/message-handler.js';
import { globalHealthWatcher } from './services/health-watcher.js';
import { globalMarketRegimeFilter } from './services/market-regime.js';
import { bootstrapDiscordChannels } from './discord/setup/channel-bootstrap.js';
import { SkillLoader } from './services/skill-loader.js';
import { MeteoraDLMMAdapter } from './adapters/meteora-dlmm-adapter.js';
import { OpenSeaAdapter } from './adapters/opensea-adapter.js';
import { SolanaTradeAdapter } from './adapters/solana-adapter.js';
import { EVMTradeAdapter } from './adapters/evm-adapter.js';
import { GMGNAdapter } from './adapters/gmgn-adapter.js';
import { SolanaScreeningAgent } from './agents/meme-solana/solana-screening-agent.js';
import { RobinhoodScreeningAgent } from './agents/meme-robinhood/robinhood-screening-agent.js';
import { BaseScreeningAgent } from './agents/meme-base/base-screening-agent.js';
import { EthScreeningAgent } from './agents/meme-eth/eth-screening-agent.js';
import { InkScreeningAgent } from './agents/meme-ink/ink-screening-agent.js';
import { LPSolanaAgent } from './agents/lp-solana/lp-solana-agent.js';
import { LPRobinhoodAgent } from './agents/lp-robinhood/lp-robinhood-agent.js';
import { NFTEthAgent } from './agents/nft-eth/nft-eth-agent.js';
import { NFTBaseAgent } from './agents/nft-base/nft-base-agent.js';
import { NFTInkAgent } from './agents/nft-ink/nft-ink-agent.js';
import { NFTRobinhoodAgent } from './agents/nft-robinhood/nft-robinhood-agent.js';
import { NFTHyperEVMAgent } from './agents/nft-hyperevm/nft-hyperevm-agent.js';
import { PolymarketAdapter } from './adapters/polymarket-adapter.js';
import { HyperliquidAdapter } from './adapters/hyperliquid-adapter.js';
import { CexRadarAdapter } from './adapters/cex-radar-adapter.js';
import { PolymarketAgent } from './agents/prediction/polymarket-agent.js';
import { PerpsScreeningAgent } from './agents/perps/perps-screening-agent.js';
import { CTAlphaAgent } from './agents/ct-alpha/ct-alpha-agent.js';
import { priceAlertService, tradeJournalService, walletService, priceFeedService } from './discord/handlers/interaction-handler.js';
import { TelegramService } from './telegram/telegram-service.js';
import { StateStore } from './services/state-store.js';
import { ApiKeyGuardService } from './services/api-key-guard.js';
import { globalRiskEngineV2 } from './orchestrator/risk-engine-v2.js';
import { WalletTracker } from './services/wallet-tracker.js';

dotenv.config();

const telegramService = new TelegramService();
const apiKeyGuard = new ApiKeyGuardService();
const ctAlphaAgent = new CTAlphaAgent();
const perpsScreeningAgent = new PerpsScreeningAgent(new HyperliquidAdapter(), undefined, new CexRadarAdapter());

console.log('----------------------------------------------------');
console.log('🐾 OPENCATZ MULTI-AGENT CRYPTO SYSTEM INITIALIZING...');
console.log('----------------------------------------------------');

const isDryRun = isDryRunMode();
console.log(`[CONFIG] DRY_RUN Mode: ${isDryRun ? 'ENABLED (Safe Mode)' : 'DISABLED (LIVE TRADING)'}`);

// Initialize persistent StateStore (survives bot restarts)
const stateStore = new StateStore();

const hub = new OpenCatzHub();
const swarmEngine = new SwarmConsensusEngine();
swarmEngine.attachStateStore(stateStore);

// Wire sandboxed StrategyEngine into Swarm Consensus (active strategy can adjust confidence)
const strategyEngine = new StrategyEngine();
SwarmConsensusEngine.setStrategyProvider((domain: string) => strategyEngine.getActiveStrategy(domain));

function gateSignal(payload: any): boolean {
  const res = swarmEngine.evaluateSignal({
    symbol: payload.symbol || 'CUSTOM',
    domain: payload.domain || 'MEME_SOLANA',
    contractAddress: payload.contractAddress || '',
    liquidityUsd: Number(payload.liquidityUsd) || 0,
    volume1hUsd: Number(payload.volume1hUsd) || 0,
    securityAuditPassed: Boolean(payload.securityAuditPassed),
    socialHypeScore: Number(payload.socialHypeScore) || 0,
    confidence: Number(payload.confidenceScore) || undefined,
  });
  if (!res.passed) {
    console.warn(`[SWARM GATE] ${payload.domain} ${payload.symbol} rejected (confidence ${res.confidenceScore}%) — not posting.`);
  }
  return res.passed;
}

// Rate-limited Discord notification to #opencatz-control-room (never spam)
const controlRoomNotifyCooldown = new Map<string, number>();
const CONTROL_ROOM_NOTIFY_MS = 10 * 60 * 1000; // max 1 notif per key per 10 minutes

// Per-agent screening timeout: a stuck pass logs and resolves to [] (fail-closed),
// so one hung agent can never stall the whole sub-agent loop.
const SCREENING_TIMEOUT_MS = Math.max(1000, Number(process.env.SCREENING_TIMEOUT_MS) || 60000);
function withScreeningTimeout<T>(promise: Promise<T>, domain: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      console.warn(`[SCREENING TIMEOUT] ${domain.toUpperCase()} pass exceeded ${SCREENING_TIMEOUT_MS}ms — discarded, no signals emitted (fail-closed).`);
      resolve([] as unknown as T);
    }, SCREENING_TIMEOUT_MS);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); }
    );
  });
}

// Perps call-card titles are formatted `${direction} ${coin} (${leverage}x)`; extract
// direction/leverage for the auto-execute simulation log (fallbacks if title deviates).
function parsePerpsSimulation(title: string | undefined): { direction: string; leverage: string } {
  const m = String(title || '').match(/^(LONG|SHORT)\s+\S+\s+\(([\d.]+)x\)/);
  return { direction: m ? m[1] : 'LONG', leverage: m ? m[2] : '10' };
}

async function notifyControlRoom(client: any, key: string, content: string): Promise<void> {
  const now = Date.now();
  const last = controlRoomNotifyCooldown.get(key);
  if (last && now - last < CONTROL_ROOM_NOTIFY_MS) return;
  controlRoomNotifyCooldown.set(key, now);
  try {
    if (client && client.channels && client.channels.cache) {
      const channel = client.channels.cache.find(
        (c: any) => c.type === ChannelType.GuildText && (c.name === 'opencatz-control-room')
      );
      if (channel && 'send' in channel) {
        await channel.send(content);
      }
    }
    if (telegramService.isEnabled()) {
      await telegramService.sendMessage(content, 'Markdown');
    }
  } catch (err: any) {
    console.warn(`[NOTIFY] Control room notification failed (${key}): ${err.message}`);
  }
}


const positionManager = new PositionManager();
positionManager.attachStateStore(stateStore);
const { PositionScanner } = await import('./services/position-scanner.js');
const positionScanner = new PositionScanner({ positionManager, walletService, stateStore });

// Wallet auto-tracker: mirrors user's on-chain holdings into PositionManager lifecycle + exit alerts
const walletTracker = new WalletTracker({ positionManager, stateStore, gmgn: new GMGNAdapter(), walletService, tradeJournal: tradeJournalService });

import { bootstrapCustomStrategies } from './orchestrator/strategy-bootstrap.js';

const aiService = new AIService();
await bootstrapCustomStrategies({ aiService });

const skillLoader = new SkillLoader();
const meteoraAdapter = new MeteoraDLMMAdapter();
const openseaAdapter = new OpenSeaAdapter();
const polymarketAdapter = new PolymarketAdapter();
const solanaTradeAdapter = new SolanaTradeAdapter();
const evmTradeAdapter = new EVMTradeAdapter();
// Apply persisted per-domain screening overrides (set via chat `set_screening_config`)
const savedScreeningConfigs = stateStore.getScreeningConfigs();
const solanaScreeningAgent = new SolanaScreeningAgent(savedScreeningConfigs['meme-solana'] as any);
const robinhoodScreeningAgent = new RobinhoodScreeningAgent(savedScreeningConfigs['meme-robinhood'] as any);
const baseScreeningAgent = new BaseScreeningAgent(savedScreeningConfigs['meme-base'] as any);
const ethScreeningAgent = new EthScreeningAgent(savedScreeningConfigs['meme-eth'] as any);
const inkScreeningAgent = new InkScreeningAgent(savedScreeningConfigs['meme-ink'] as any);
const lpSolanaAgent = new LPSolanaAgent(meteoraAdapter);
const lpRobinhoodAgent = new LPRobinhoodAgent();
const nftEthAgent = new NFTEthAgent(openseaAdapter);
const nftBaseAgent = new NFTBaseAgent(openseaAdapter);
const nftInkAgent = new NFTInkAgent(openseaAdapter);
const nftRobinhoodAgent = new NFTRobinhoodAgent(openseaAdapter);
const nftHyperEVMAgent = new NFTHyperEVMAgent(openseaAdapter);
const polymarketAgent = new PolymarketAgent(polymarketAdapter);

// Wire shared adapters + singleton agent instances into the Hub so on-demand
// passes (Discord/TUI) use the SAME instances as the 5-min loop.
hub.attachAdapters({ meteoraAdapter });
hub.attachAgentFactories({
  'meme-solana': () => solanaScreeningAgent,
  'meme-robinhood': () => robinhoodScreeningAgent,
  'meme-base': () => baseScreeningAgent,
  'meme-eth': () => ethScreeningAgent,
  'meme-ink': () => inkScreeningAgent,
  'lp-solana': () => lpSolanaAgent,
  'lp-robinhood': () => lpRobinhoodAgent,
  'nft-eth': () => nftEthAgent,
  'nft-base': () => nftBaseAgent,
  'nft-ink': () => nftInkAgent,
  'nft-robinhood': () => nftRobinhoodAgent,
  'nft-hyperevm': () => nftHyperEVMAgent,
  prediction: () => polymarketAgent,
  perps: () => perpsScreeningAgent,
  'ct-alpha': () => ctAlphaAgent,
});

// Attach StateStore to all persistent services
hub.attachStateStore(stateStore);
priceAlertService.attachStateStore(stateStore);
tradeJournalService.attachStateStore(stateStore);
walletService.attachStateStore(stateStore);

const loadedSkills = skillLoader.loadAllSkills();

console.log(`[SKILL SYSTEM] Active skills loaded: ${loadedSkills.length} (${loadedSkills.map(s => s.name).join(', ')})`);
console.log(`[SECURITY SERVICES] RugCheck API (Solana) & GoPlus Security (EVM - Base/ETH/Robinhood) Initialized.`);
console.log(`[SCREENING AGENTS] Solana Meme + EVM Meme + EVM NFT Sniping + Polymarket Prediction Agents Initialized.`);
console.log(`[SCREENING ADAPTERS] OpenSea + Polymarket Gamma/CLOB + GMGN AI + Meteora DLMM + Uniswap LP Adapters Initialized.`);
console.log(`[AI SERVICE] Configured with provider: ${aiService.getConfig().provider}, model: ${aiService.getConfig().modelName}`);

let discordClient: Client | null = null;
const discordToken = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

if (discordToken && clientId) {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    rest: {
      // REST Discord timeout
      timeout: 30000,
    },
  });
  discordClient = client;

  client.once('ready', async () => {
    console.log(`[DISCORD BOT] Logged in as ${client.user?.tag}!`);

    // Post-update report: if a self-update just ran (fire-and-forget killed the
    // old process before it could reply), forward the saved report to the
    // control room so the user sees the update result after restart.
    try {
      const fs = await import('fs');
      const reportPath = path.join(process.cwd(), 'database', 'last_update_report.json');
      if (fs.existsSync(reportPath)) {
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
        fs.unlinkSync(reportPath); // one-shot: hapus setelah dibaca
        const stepLines = (report.steps || []).map((s: { label: string; ok: boolean }) => `• **${s.label}:** ${s.ok ? '✅' : '❌'}`).join('\n');
        const restartLine = report.restartOk
          ? '🔄 **PM2 agent restarted — new code is live.**'
          : '⚠ **PM2 restart failed** — run `opencatz deploy` manually.';
        const controlRoomId = process.env.DISCORD_CHANNEL_CONTROL_ROOM;
        const channel = controlRoomId
          ? client.channels.cache.get(controlRoomId)
          : client.channels.cache.find((c: any) => c.name === 'opencatz-control-room');
        if (channel && 'send' in channel) {
          await channel.send(
            `${report.ok ? '✅' : '❌'} **OpenCatz Self-Update ${report.ok ? 'Complete' : 'GAGAL'}**\n\n` +
            `${stepLines}\n${restartLine}`
          );
          console.log('[UPDATE REPORT] Laporan update dikirim ke control room.');
        }
      }
    } catch (reportErr: any) {
      console.warn(`[UPDATE REPORT] Gagal kirim laporan: ${reportErr.message}`);
    }

    // Auto-Bootstrap Discord Category & Channels if bot is in a server
    const firstGuild = client.guilds.cache.first();
    if (firstGuild) {
      try {
        await bootstrapDiscordChannels(firstGuild);
      } catch (err) {
        console.error('[DISCORD BOOTSTRAP] Channel auto-creation error:', err);
      }
    }

    // Register Slash Commands
    try {
      const rest = new REST({ version: '10' }).setToken(discordToken);
      console.log('[DISCORD REST] Registering Slash Commands...');
      await rest.put(Routes.applicationCommands(clientId), {
        body: slashCommands.map(cmd => cmd.toJSON()),
      });
      console.log('[DISCORD REST] Slash Commands registered successfully!');
    } catch (error) {
      console.error('[DISCORD REST] Error registering Slash Commands:', error);
    }
  });

  client.on('interactionCreate', (interaction) => {
    handleInteraction(interaction, hub, aiService);
  });

  client.on('messageCreate', (message) => {
    const controlRoomChannelId = process.env.DISCORD_CHANNEL_CONTROL_ROOM;
    if (isControlRoomChannel(controlRoomChannelId, message)) {
      handleControlRoomMessage(message, aiService, hub);
    }
  });

  client.login(discordToken).catch((err) => {
    console.warn(`[DISCORD BOT] Login skipped or failed: ${err.message}. Running in offline simulation mode.`);
  });
} else {
  console.log('[DISCORD BOT] DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID not set in .env. Running standalone engine.');
}

// Attach StateStore to Telegram service for persistent forum topic mappings
telegramService.attachStateStore(stateStore);

// Auto-Bootstrap Telegram Sub-Channels (Topics) & Broadcast Control Menu on startup if Telegram configured
if (telegramService.isEnabled()) {
  console.log('[TELEGRAM SERVICE] Telegram Notification Bridge Connected! Provisioning Topics & broadcasting control menu...');
  try {
    await telegramService.bootstrapTelegramTopics();
    await telegramService.broadcastInteractiveMenu(hub, walletService);
    telegramService.startPolling(hub, walletService, aiService);
  } catch (tgErr: any) {
    console.error('[TELEGRAM SERVICE] Startup broadcast error:', tgErr.message);
  }
} else {
  console.log('[TELEGRAM SERVICE] Telegram bridge not configured (TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing).');
}

// Start Price Alert Checking Interval Loop (Every 60s)
setInterval(async () => {
  try {
    const triggered = await priceAlertService.checkAlerts(priceFeedService);
    for (const alert of triggered) {
      const currentPx = alert.lastTriggeredPriceUsd || alert.targetPriceUsd;
      const alertMsg =
        `🔔 **OPENCATZ PRICE ALERT TRIGGERED!**\n\n` +
        `📈 **Asset:** \`${alert.symbol}/USDT\`\n` +
        `💵 **Target Price Hit:** \`$${alert.targetPriceUsd.toLocaleString()} USD\` (Current: \`$${currentPx.toLocaleString()} USD\`)\n` +
        `👤 **Alert for:** <@${alert.userId}>\n` +
        `🎯 **Condition:** Price reached \`${alert.direction}\` target!`;

      if (discordClient && discordClient.channels && discordClient.channels.cache) {
        const targetChannelId = alert.channelId || process.env.DISCORD_CHANNEL_CONTROL_ROOM;
        if (targetChannelId && discordClient.channels.cache.has(targetChannelId)) {
          const channel = discordClient.channels.cache.get(targetChannelId) as any;
          if (channel && 'send' in channel) {
            await channel.send(alertMsg);
          }
        }
      }
      if (telegramService.isEnabled()) {
        await telegramService.sendMessage(alertMsg, 'Markdown');
      }
    }
  } catch (err: any) {
    console.error('[PRICE ALERT LOOP ERROR]', err.message);
  }
}, 60 * 1000);

// Signal dedup cache: prevents posting same signal within 2-hour window (persisted across restarts)
const recentSignals = new Map<string, number>(); // key: "channel:symbol:ca" -> timestamp
for (const [k, v] of Object.entries(stateStore.getAllDedupEntries())) {
  recentSignals.set(k, v);
}
const DEDUP_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours (GMGN trending returns the same top tokens)

// Real portfolio equity tracker (feeds RiskManager drawdown)
let prevPortfolioEquityUsd: number | null = null;

// Start 24/7 Sub-Agents Background Screening Interval Loop (Every 5 minutes)
setInterval(async () => {
  console.log('[SUB-AGENTS LOOP] Checking active sub-agent domains...');
  try {
    // Register heartbeats AT THE START of each pass so agents are marked alive while the
    // loop is running (loop interval 5m > watcher timeout, so end-of-pass heartbeats alone
    // would always trip the UNRESPONSIVE threshold between passes).
    for (const domain of hub.getActiveDomains()) {
      globalHealthWatcher.recordHeartbeat(domain);
    }
    // Real portfolio equity -> drawdown (fail-soft: skip if data unavailable)
    try {
      let currentEquityUsd = 0;
      const solBal = await walletService.getSolanaBalance();
      const solPrice = await priceFeedService.getPrice('SOL');
      if (solBal && solPrice !== null) currentEquityUsd += solBal.balance * solPrice;
      const ethBal = await walletService.getEvmBalance(1);
      const ethPrice = await priceFeedService.getPrice('ETH');
      if (ethBal && ethPrice !== null) currentEquityUsd += ethBal.balance * ethPrice;
      const openPositions = stateStore.getAllPositions();
      for (const p of openPositions) {
        currentEquityUsd += (p.currentPriceUsd ?? 0) * (p.amount ?? 0);
      }
      if (prevPortfolioEquityUsd !== null) {
        hub.getRiskManager().updateDrawdown(currentEquityUsd, prevPortfolioEquityUsd);
      }
      prevPortfolioEquityUsd = currentEquityUsd;
    } catch (equityErr: any) {
      console.warn(`[RISK] Portfolio equity unavailable this pass: ${equityErr.message}`);
    }

    // Real market regime from live BTC/ETH 24h changes (fail-soft when unavailable)
    try {
      const btcChange = await priceFeedService.get24hChange('BTC');
      const ethChange = await priceFeedService.get24hChange('ETH');
      if (btcChange !== null && ethChange !== null) {
        const volIdx = Math.min(100, Math.round(Math.max(Math.abs(btcChange), Math.abs(ethChange)) * 15));
        globalMarketRegimeFilter.updateMarketRegime(btcChange, ethChange, volIdx);
      }
    } catch (regimeErr: any) {
      console.warn(`[MARKET REGIME] Update failed: ${regimeErr.message}`);
    }

    let dispatchedPayloads: Array<{ payload: CallSignalPayload; channelName: string; rawReason: string }> = [];

    const solanaDispatched = await dispatchDomain({
      domain: 'meme-solana',
      channelName: 'call-meme-solana',
      isActive: () => hub.isAgentActive('meme-solana'),
      runPass: () => withScreeningTimeout(solanaScreeningAgent.runScreeningPass(), 'meme-solana'),
      keyReady: () => apiKeyGuard.checkDomainKeys('meme-solana'),
      onHalt: (domain, msg) => notifyControlRoom(discordClient, `halt:${domain}`, `⚠️ **${domain.toUpperCase()} TIDAK BISA JALAN**\n${msg}`),
    });
    dispatchedPayloads.push(...solanaDispatched);

    const robinhoodDispatched = await dispatchDomain({
      domain: 'meme-robinhood',
      channelName: 'call-meme-robinhood',
      isActive: () => hub.isAgentActive('meme-robinhood'),
      runPass: () => withScreeningTimeout(robinhoodScreeningAgent.runScreeningPass(), 'meme-robinhood'),
      keyReady: () => apiKeyGuard.checkDomainKeys('meme-robinhood'),
      onHalt: (domain, msg) => notifyControlRoom(discordClient, `halt:${domain}`, `⚠️ **${domain.toUpperCase()} TIDAK BISA JALAN**\n${msg}`),
    });
    dispatchedPayloads.push(...robinhoodDispatched);

    const baseDispatched = await dispatchDomain({
      domain: 'meme-base',
      channelName: 'call-meme-base',
      isActive: () => hub.isAgentActive('meme-base'),
      runPass: () => withScreeningTimeout(baseScreeningAgent.runScreeningPass(), 'meme-base'),
      keyReady: () => apiKeyGuard.checkDomainKeys('meme-base'),
      onHalt: (domain, msg) => notifyControlRoom(discordClient, `halt:${domain}`, `⚠️ **${domain.toUpperCase()} TIDAK BISA JALAN**\n${msg}`),
    });
    dispatchedPayloads.push(...baseDispatched);

    const ethDispatched = await dispatchDomain({
      domain: 'meme-eth',
      channelName: 'call-meme-eth',
      isActive: () => hub.isAgentActive('meme-eth'),
      runPass: () => withScreeningTimeout(ethScreeningAgent.runScreeningPass(), 'meme-eth'),
      keyReady: () => apiKeyGuard.checkDomainKeys('meme-eth'),
      onHalt: (domain, msg) => notifyControlRoom(discordClient, `halt:${domain}`, `⚠️ **${domain.toUpperCase()} TIDAK BISA JALAN**\n${msg}`),
    });
    dispatchedPayloads.push(...ethDispatched);

    const inkDispatched = await dispatchDomain({
      domain: 'meme-ink',
      channelName: 'call-meme-ink',
      isActive: () => hub.isAgentActive('meme-ink'),
      runPass: () => withScreeningTimeout(inkScreeningAgent.runScreeningPass(), 'meme-ink'),
      keyReady: () => apiKeyGuard.checkDomainKeys('meme-ink'),
      onHalt: (domain, msg) => notifyControlRoom(discordClient, `halt:${domain}`, `⚠️ **${domain.toUpperCase()} TIDAK BISA JALAN**\n${msg}`),
    });
    dispatchedPayloads.push(...inkDispatched);

    const nftEthDispatched = await dispatchDomain({
      domain: 'nft-eth',
      channelName: 'call-nft-eth',
      isActive: () => hub.isAgentActive('nft-eth'),
      runPass: () => withScreeningTimeout(nftEthAgent.runScreeningPass(), 'nft-eth'),
      keyReady: () => apiKeyGuard.checkDomainKeys('nft-eth'),
      onHalt: (domain, msg) => notifyControlRoom(discordClient, `halt:${domain}`, `⚠️ **${domain.toUpperCase()} TIDAK BISA JALAN**\n${msg}`),
    });
    dispatchedPayloads.push(...nftEthDispatched);

    const nftBaseDispatched = await dispatchDomain({
      domain: 'nft-base',
      channelName: 'call-nft-base',
      isActive: () => hub.isAgentActive('nft-base'),
      runPass: () => withScreeningTimeout(nftBaseAgent.runScreeningPass(), 'nft-base'),
      keyReady: () => apiKeyGuard.checkDomainKeys('nft-base'),
      onHalt: (domain, msg) => notifyControlRoom(discordClient, `halt:${domain}`, `⚠️ **${domain.toUpperCase()} TIDAK BISA JALAN**\n${msg}`),
    });
    dispatchedPayloads.push(...nftBaseDispatched);

    const nftInkDispatched = await dispatchDomain({
      domain: 'nft-ink',
      channelName: 'call-nft-ink',
      isActive: () => hub.isAgentActive('nft-ink'),
      runPass: () => withScreeningTimeout(nftInkAgent.runScreeningPass(), 'nft-ink'),
      keyReady: () => apiKeyGuard.checkDomainKeys('nft-ink'),
      onHalt: (domain, msg) => notifyControlRoom(discordClient, `halt:${domain}`, `⚠️ **${domain.toUpperCase()} TIDAK BISA JALAN**\n${msg}`),
    });
    dispatchedPayloads.push(...nftInkDispatched);

    const nftRobinhoodDispatched = await dispatchDomain({
      domain: 'nft-robinhood',
      channelName: 'call-nft-robinhood',
      isActive: () => hub.isAgentActive('nft-robinhood'),
      runPass: () => withScreeningTimeout(nftRobinhoodAgent.runScreeningPass(), 'nft-robinhood'),
      keyReady: () => apiKeyGuard.checkDomainKeys('nft-robinhood'),
      onHalt: (domain, msg) => notifyControlRoom(discordClient, `halt:${domain}`, `⚠️ **${domain.toUpperCase()} TIDAK BISA JALAN**\n${msg}`),
    });
    dispatchedPayloads.push(...nftRobinhoodDispatched);

    const nftHyperEVMDispatched = await dispatchDomain({
      domain: 'nft-hyperevm',
      channelName: 'call-nft-hyperevm',
      isActive: () => hub.isAgentActive('nft-hyperevm'),
      runPass: () => withScreeningTimeout(nftHyperEVMAgent.runScreeningPass(), 'nft-hyperevm'),
      keyReady: () => apiKeyGuard.checkDomainKeys('nft-hyperevm'),
      onHalt: (domain, msg) => notifyControlRoom(discordClient, `halt:${domain}`, `⚠️ **${domain.toUpperCase()} TIDAK BISA JALAN**\n${msg}`),
    });
    dispatchedPayloads.push(...nftHyperEVMDispatched);

    const predictionDispatched = await dispatchDomain({
      domain: 'prediction',
      channelName: 'call-prediction-markets',
      isActive: () => hub.isAgentActive('prediction'),
      runPass: () => withScreeningTimeout(polymarketAgent.runScreeningPass(), 'prediction'),
      keyReady: () => apiKeyGuard.checkDomainKeys('prediction'),
      onHalt: (domain, msg) => notifyControlRoom(discordClient, `halt:${domain}`, `⚠️ **${domain.toUpperCase()} TIDAK BISA JALAN**\n${msg}`),
    });
    dispatchedPayloads.push(...predictionDispatched);

    const perpsDispatched = await dispatchDomain({
      domain: 'perps',
      channelName: 'call-whale-tracking',
      isActive: () => hub.isAgentActive('perps'),
      runPass: () => withScreeningTimeout(perpsScreeningAgent.runScreeningPass(), 'perps'),
      keyReady: () => apiKeyGuard.checkDomainKeys('perps'),
      onHalt: (domain, msg) => notifyControlRoom(discordClient, `halt:${domain}`, `⚠️ **${domain.toUpperCase()} TIDAK BISA JALAN**\n${msg}`),
    });
    dispatchedPayloads.push(...perpsDispatched);

    const ctAlphaDispatched = await dispatchDomain({
      domain: 'ct-alpha',
      channelName: 'call-ct-alpha',
      isActive: () => hub.isAgentActive('ct-alpha'),
      runPass: () => withScreeningTimeout(ctAlphaAgent.runScreeningPass(), 'ct-alpha'),
      keyReady: () => apiKeyGuard.checkDomainKeys('ct-alpha'),
      onHalt: (domain, msg) => notifyControlRoom(discordClient, `halt:${domain}`, `⚠️ **${domain.toUpperCase()} TIDAK BISA JALAN**\n${msg}`),
    });
    dispatchedPayloads.push(...ctAlphaDispatched);

    const lpSolanaDispatched = await dispatchDomain({
      domain: 'lp-solana',
      channelName: 'call-lp-solana',
      isActive: () => hub.isAgentActive('lp-solana'),
      runPass: () => withScreeningTimeout(lpSolanaAgent.runScreeningPass(), 'lp-solana'),
      keyReady: () => ({ ready: true, statusMessage: '' }),
      onHalt: (domain, msg) => notifyControlRoom(discordClient, `halt:${domain}`, `⚠️ **${domain.toUpperCase()} TIDAK BISA JALAN**\n${msg}`),
    });
    dispatchedPayloads.push(...lpSolanaDispatched);

    const lpRobinhoodDispatched = await dispatchDomain({
      domain: 'lp-robinhood',
      channelName: 'call-lp-robinhood',
      isActive: () => hub.isAgentActive('lp-robinhood'),
      runPass: () => withScreeningTimeout(lpRobinhoodAgent.runScreeningPass(), 'lp-robinhood'),
      keyReady: () => ({ ready: true, statusMessage: '' }),
      onHalt: (domain, msg) => notifyControlRoom(discordClient, `halt:${domain}`, `⚠️ **${domain.toUpperCase()} TIDAK BISA JALAN**\n${msg}`),
    });
    dispatchedPayloads.push(...lpRobinhoodDispatched);

    // Real Swarm Consensus gate (>= 80%): every signal must pass with real data
    dispatchedPayloads = dispatchedPayloads.filter((item) => gateSignal(item.payload));

    // Register real heartbeats for every active agent that ran this pass
    for (const domain of hub.getActiveDomains()) {
      globalHealthWatcher.recordHeartbeat(domain);
    }

    // Purge expired dedup entries
    const now = Date.now();
    for (const [key, ts] of recentSignals.entries()) {
      if (now - ts > DEDUP_WINDOW_MS) recentSignals.delete(key);
    }

    // Dispatch all passed signals to Discord channels & Telegram topics (with dedup)
    for (const item of dispatchedPayloads) {
      const dedupKey = `${item.channelName}:${item.payload.symbol}:${item.payload.contractAddress || 'N/A'}`;
      if (recentSignals.has(dedupKey)) {
        console.log(`[DEDUP] Skipping duplicate signal: ${dedupKey} (posted ${((now - recentSignals.get(dedupKey)!) / 60000).toFixed(0)}m ago)`);
        continue;
      }
      recentSignals.set(dedupKey, now);
      stateStore.setDedupEntry(dedupKey, now);

      // AUTO-EXECUTE — LOCKED OFF by default (manual-execution mode).
      // The bot is a screener/caller only: every execution is done by the
      // user. Flip AUTO_EXECUTE_ENABLED=true in .env to re-enable.
      const AUTO_EXECUTE_ENABLED = process.env.AUTO_EXECUTE_ENABLED === 'true';
      const autoExecDomain: string | undefined =
        item.channelName === 'call-meme-solana' ? 'meme-solana' :
        item.channelName === 'call-meme-robinhood' ? 'meme-robinhood' :
        item.channelName === 'call-meme-base' ? 'meme-base' :
        item.channelName === 'call-meme-eth' ? 'meme-eth' :
        item.channelName === 'call-meme-ink' ? 'meme-ink' :
        item.channelName === 'call-whale-tracking' ? 'perps' :
        item.channelName === 'call-prediction-markets' ? 'prediction' :
        undefined;
      if (autoExecDomain && AUTO_EXECUTE_ENABLED) {
        const autoExec = hub.isAutoExecuteEnabled(autoExecDomain);
        if (autoExec.enabled) {
          try {
            // ── RISK GATE (RiskEngineV2 / RiskManager) ──
            // Never execute (even simulated) when risk limits are hit: global
            // drawdown cap, per-trade size cap, or kill-switch active. This wires
            // the previously-dead risk engine into the actual execution path.
            const riskCheck = hub.getRiskManager().isTradeAllowed(autoExec.maxTradeAmount || 0.1);
            if (!riskCheck.allowed) {
              console.warn(`[AUTO-EXECUTE] ${autoExecDomain} ${item.payload.symbol}: BLOCKED by risk gate — ${riskCheck.reason}`);
              await notifyControlRoom(discordClient, `risk:${autoExecDomain}`, `🚫 **RISK GATE BLOCKED** auto-execute ${autoExecDomain} ${item.payload.symbol}: ${riskCheck.reason}`);
              break;
            }
            if (globalRiskEngineV2.checkKillSwitchStatus()) {
              console.warn(`[AUTO-EXECUTE] ${autoExecDomain} ${item.payload.symbol}: BLOCKED — emergency kill-switch active.`);
              await notifyControlRoom(discordClient, 'risk:killswitch', `🚨 **KILL-SWITCH ACTIVE** — auto-execute ${autoExecDomain} ${item.payload.symbol} blocked.`);
              break;
            }
            if (autoExecDomain === 'meme-solana' && item.payload.contractAddress) {
              const execRes = await solanaTradeAdapter.executeBuyToken({ outputMint: item.payload.contractAddress, amountSol: autoExec.maxTradeAmount || 0.1, slippageBps: 150 });
              console.log(`[AUTO-EXECUTE] meme-solana ${item.payload.symbol}: ${execRes.success ? (execRes.simulated ? 'SIMULATED ' : '') + 'ok' : 'FAILED'} ${execRes.error || ''} (out=${execRes.outputTokens}, impact=${execRes.priceImpactPercentage}%)`);
            } else if ((autoExecDomain === 'meme-robinhood' || autoExecDomain === 'meme-base' || autoExecDomain === 'meme-eth' || autoExecDomain === 'meme-ink') && item.payload.contractAddress) {
              const chainKey = autoExecDomain === 'meme-base' ? 'base' : autoExecDomain === 'meme-eth' ? 'eth' : autoExecDomain === 'meme-ink' ? 'ink' : 'robinhood';
              const execRes = await evmTradeAdapter.executeBuyToken({ chain: chainKey as any, tokenAddress: item.payload.contractAddress, amountEth: autoExec.maxTradeAmount || 0.1, slippagePercentage: 1.5 });
              console.log(`[AUTO-EXECUTE] ${autoExecDomain} ${item.payload.symbol}: ${execRes.success ? (execRes.simulated ? 'SIMULATED ' : '') + 'ok' : 'FAILED'} ${execRes.error || ''} (out=${execRes.outputTokens})`);
            } else if (autoExecDomain === 'perps' && isDryRun) {
              // Simulation-only: HyperliquidAdapter.placeOrder exists (DRY_RUN-capable) but
              // dispatch keeps a log-only simulation until live perps execution is enabled.
              const sim = parsePerpsSimulation(item.payload.title);
              console.log(`[AUTO-EXECUTE] perps ${item.payload.symbol}: SIMULATED ${sim.direction} ${autoExec.maxTradeAmount || 0.1} @ ${sim.leverage}x`);
            } else if (autoExecDomain === 'prediction' && isDryRun) {
              // Simulation-only: PolymarketAdapter.placeBet exists (DRY_RUN-capable) but
              // dispatch keeps a log-only simulation of the standard 50 USDC bet.
              console.log(`[AUTO-EXECUTE] prediction ${item.payload.symbol}: SIMULATED ${item.payload.symbol} 50 USDC`);
            }

            // Record every auto-executed signal into the trade journal (real data).
            // Simulated while DRY_RUN=true — journal keeps an OPEN entry for audit/tracking.
            try {
              const entryPrice = parseFloat(String(item.payload.priceUsd || '0').replace(/[^0-9.]/g, '')) || 0;
              const journalDomain = (item.payload.domain || 'MEME_SOLANA') as any;
              tradeJournalService.recordTradeEntry({
                id: `TRADE_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                domain: journalDomain,
                symbol: item.payload.symbol || 'TOKEN',
                contractAddressOrId: item.payload.contractAddress || item.payload.symbol || 'N/A',
                chain: autoExecDomain === 'meme-solana' ? 'solana' : autoExecDomain === 'meme-robinhood' ? 'robinhood' : autoExecDomain === 'meme-base' ? 'base' : autoExecDomain === 'meme-eth' ? 'eth' : autoExecDomain === 'meme-ink' ? 'ink' : autoExecDomain === 'perps' ? 'hyperliquid' : 'polymarket',
                entryTimestamp: new Date().toISOString(),
                entryPriceUsdOrEth: entryPrice,
                positionSizeUsd: (autoExec.maxTradeAmount || 0.1) * (entryPrice || 1),
                swarmScore: Number(item.payload.confidenceScore) || 0,
                strategyUsed: 'auto-execute',
                aiThesisSummary: (item.rawReason || item.payload.aiThesis || '').slice(0, 200),
                status: 'OPEN',
              });
              console.log(`[TRADE JOURNAL] Auto-execute recorded: ${item.payload.symbol} (${autoExecDomain}) OPEN entry.`);
            } catch (journalErr: any) {
              console.warn(`[TRADE JOURNAL] Failed to record ${item.payload.symbol}: ${journalErr.message}`);
            }
          } catch (err: any) { console.error(`[AUTO-EXECUTE] ${item.payload.symbol} error: ${err.message}`); }
        }
      }

      // 1. Post to Discord Channel (isolated try-catch per token)
      if (discordClient && discordClient.channels && discordClient.channels.cache) {
        try {
          const targetChannel = discordClient.channels.cache.find(
            (c: any) => c.type === ChannelType.GuildText && c.name === item.channelName
          ) as any;

          if (targetChannel && 'send' in targetChannel) {
            const embedData = buildCallEmbed(item.payload);
            await targetChannel.send(embedData);
            console.log(`[DISCORD DISPATCH] Posted signal call card for "${item.payload.symbol}" to #${item.channelName}`);
          }
        } catch (discordSendErr: any) {
          console.error(`[DISCORD DISPATCH ERROR] Failed to send card for ${item.payload.symbol} to #${item.channelName}:`, discordSendErr.message);
        }
      }

      // 2. Post to Telegram Topic
      if (telegramService.isEnabled()) {
        try {
          await telegramService.broadcastSignalCall(
            item.payload.title,
            item.payload.symbol,
            item.payload.contractAddress || 'N/A',
            item.rawReason,
            undefined,
            item.channelName
          );
          console.log(`[TELEGRAM DISPATCH] Broadcasted signal call for "${item.payload.symbol}" to topic: ${item.channelName}`);
        } catch (teleErr: any) {
          console.warn(`[TELEGRAM DISPATCH ERROR] Failed for ${item.payload.symbol}: ${teleErr.message}`);
        }
      }

      // 3. Register called tokens for wallet auto-tracking (own-position detection + exit alerts)
      if (item.channelName === 'call-meme-solana' && item.payload.contractAddress) {
        walletTracker.registerTrackedToken('sol', item.payload.contractAddress, item.payload.symbol);
      } else if (item.channelName === 'call-meme-robinhood' && item.payload.contractAddress) {
        walletTracker.registerTrackedToken('robinhood', item.payload.contractAddress, item.payload.symbol);
      } else if (item.channelName === 'call-meme-base' && item.payload.contractAddress) {
        walletTracker.registerTrackedToken('base', item.payload.contractAddress, item.payload.symbol);
      } else if (item.channelName === 'call-meme-eth' && item.payload.contractAddress) {
        walletTracker.registerTrackedToken('eth', item.payload.contractAddress, item.payload.symbol);
      } else if (item.channelName === 'call-meme-ink' && item.payload.contractAddress) {
        walletTracker.registerTrackedToken('ink', item.payload.contractAddress, item.payload.symbol);
      } else if (item.channelName === 'call-lp-robinhood' && item.payload.contractAddress) {
        walletTracker.registerTrackedToken('robinhood', item.payload.contractAddress, item.payload.symbol);
      } else if (item.channelName === 'call-nft-sniping' && item.payload.symbol) {
        // NFT: register collection slug for user position monitoring (floor drop -20%, TP, etc.)
        stateStore.setTrackedNftCollection(item.payload.symbol.toLowerCase());
        console.log(`[POSITION MONITOR] NFT collection di-track: ${item.payload.symbol}`);
      }

      // 4. Feed the Swarm Learning Engine
      try {
        const { globalSwarmLearning } = await import('./orchestrator/swarm-learning.js');
        const entryPrice = parseFloat(String(item.payload.priceUsd || '0').replace(/[^0-9.]/g, '')) || 0;
        globalSwarmLearning.recordSignalCall(
          item.channelName.replace('call-', ''),
          item.payload.symbol || 'TOKEN',
          item.payload.contractAddress || item.payload.symbol || 'N/A',
          entryPrice,
          Number(item.payload.confidenceScore) || 0
        );
      } catch (learnErr: any) {
        console.warn(`[SWARM LEARNING] record failed: ${learnErr.message}`);
      }
    }

    // Wallet Auto-Tracking: detect user's own positions + exit alerts
    try {
      const alerts = await walletTracker.syncPositions();
      // PositionScanner: perps (Hyperliquid), LP solana (Meteora), prediction (Polymarket)
      const scannerAlerts = await positionScanner.scanAll();
      const allAlerts = [...alerts, ...scannerAlerts];
      if (allAlerts.length > 0) {
        for (const a of allAlerts) {
          await notifyControlRoom(discordClient, `position:${a.type}:${a.address}`, `🚨 **POSITION ALERT**\n${a.reason}`);
        }
      }
      console.log(`[POSITION MONITOR] ${positionManager.getActivePositions().length} spot + ${positionManager.getActiveLpPositions().length} LP + ${positionManager.getActiveNftPositions().length} NFT positions tracked, ${allAlerts.length} alert(s) fired this cycle.`);
    } catch (wtErr: any) {
      console.warn(`[POSITION MONITOR] sync failed this cycle: ${wtErr.message}`);
    }
  } catch (err: any) {
    console.error('[SUB-AGENTS LOOP ERROR]', (err as any).errors || err.stack || err.message);
    notifyControlRoom(discordClient, 'loop-error', `⚠️ **SCREENING LOOP ERROR**\n\`${err.message}\``);
  }
}, 5 * 60 * 1000);

function isControlRoomChannel(configuredId: string | undefined, message: any): boolean {
  if (!configuredId || configuredId === '000000000000000000') {
    return message.channel?.name === 'opencatz-control-room';
  }
  return message.channelId === configuredId || message.channel?.name === 'opencatz-control-room';
}

console.log('[SYSTEM] Setup complete. All OpenCatz modules ready.');
console.log('[STATE STORE] Persistent state engine active — positions, alerts, and journal survive restarts.');


// Start OpenCatz Telemetry & REST API Server
import { OpenCatzRESTServer } from './api/server.js';
const apiServer = new OpenCatzRESTServer();
apiServer.start(hub);

// Graceful Shutdown: flush pending state writes to disk before exit
const gracefulShutdown = (signal: string) => {
  console.log(`\n[SHUTDOWN] Received ${signal}. Flushing state to disk...`);
  stateStore.flushToDisk();
  console.log('[SHUTDOWN] State saved. Goodbye!');
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
