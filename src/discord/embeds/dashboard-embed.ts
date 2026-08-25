import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { OpenCatzHub } from '../../orchestrator/hub.js';
import { AGENT_DOMAINS } from '../../orchestrator/agent-registry.js';
import { isDryRun as isDryRunMode } from '../../config/config.js';

export interface DashboardEmbedOptions {
  solBalance?: string | null;
  ethBalance?: string | null;
  activeAlerts?: number;
}

export function createDashboardComponents(hub: OpenCatzHub, opts: DashboardEmbedOptions = {}) {
  const isTwexSet = Boolean(process.env.TWEX_API_KEY);
  const isOpenSeaSet = Boolean(process.env.OPENSEA_API_KEY);
  const isLlmSet = Boolean(process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY);

  const getStatusBadge = (domain: string) => (hub.isAgentActive(domain) ? '`🟢 RUNNING`' : '`🔴 PAUSED`');

  const risk = hub.getRiskManager().getRiskState();
  const executionMode = isDryRunMode() ? 'DRY_RUN (Safe Simulation)' : 'LIVE';
  const drawdownStr = `Current Drawdown: \`${risk.currentDrawdownPct.toFixed(1)}%\` (Max Limit: \`${risk.maxDrawdownLimitPct.toFixed(1)}%\`)`;
  const solBalanceStr = opts.solBalance ?? '`— (unavailable)`';
  const ethBalanceStr = opts.ethBalance ?? '`— (unavailable)`';
  const activeAlertsStr = `${opts.activeAlerts ?? 0} Active Alerts`;

  const embed = new EmbedBuilder()
    .setTitle('🐾 OPENCATZ MULTI-AGENT CONTROL CENTER')
    .setColor(0xccff00)
    .setDescription(
      'Welcome to **Opencatz AI** — Autonomous Multi-Agent Crypto Intelligence & Trading Swarm.\n' +
      'Control screening agents, 9-Lives risk engine, price alerts, API keys, and burner wallets interactively below.'
    )
    .addFields(
      {
        name: '🛡️ 9-Lives Risk Engine & Execution Mode',
        value:
          `• **Execution Mode:** \`${executionMode}\`\n` +
          `• **9-Lives Status:** ${drawdownStr}`,
        inline: false,
      },
      {
        name: '🐱 24/7 Specialist Sub-Agents Status (15 Agents Active)',
        value:
          `**🚀 Meme Hunters:** SOL ${getStatusBadge('meme-solana')} • RH ${getStatusBadge('meme-robinhood')} • BASE ${getStatusBadge('meme-base')} • ETH ${getStatusBadge('meme-eth')} • INK ${getStatusBadge('meme-ink')}\n` +
          `**💧 Liquidity & Yield:** SOL LP ${getStatusBadge('lp-solana')} • RH LP ${getStatusBadge('lp-robinhood')}\n` +
          `**🔮 NFT Division (OpenSea EVM):** ETH ${getStatusBadge('nft-eth')} • BASE ${getStatusBadge('nft-base')} • INK ${getStatusBadge('nft-ink')} • RH ${getStatusBadge('nft-robinhood')} • HYPER ${getStatusBadge('nft-hyperevm')}\n` +
          `**🎯 Oracles & Alpha:** 🐋 Perps ${getStatusBadge('perps')} • 🎯 Poly ${getStatusBadge('prediction')} • ☀️ CT ${getStatusBadge('ct-alpha')}`,
        inline: false,
      },
      {
        name: '🌐 Connected API Keys & Social Intelligence',
        value:
          `• 🐦 **Twitter/X Intelligence:** ${isTwexSet ? '`🟢 CONFIGURED`' : '`⚪ NOT CONFIGURED (fail-closed)`'}\n` +
          `• 🖼️ **OpenSea NFT Stream API:** ${isOpenSeaSet ? '`🟢 CONFIGURED`' : '`⚪ NOT CONFIGURED (fail-closed)`'}\n` +
          `• 🧠 **LLM AI Reasoning Engine:** ${isLlmSet ? '`🟢 CONFIGURED`' : '`⚪ NOT CONFIGURED`'}`,
        inline: false,
      },
      {
        name: '🔑 Wallet Balances & Price Alerts',
        value:
          `• **Solana Balance:** ${solBalanceStr}\n` +
          `• **Robinhood/EVM Balance:** ${ethBalanceStr}\n` +
          `• **Active Price Alerts:** \`${activeAlertsStr}\` (Use \`/alert\` or chat)`,
        inline: false,
      }
    )
    .setFooter({ text: '🐾 Opencatz AI • "Chill trades, 9 lives, sharp alpha." • opencatz.xyz' })
    .setTimestamp();

  // Dropdown Select Menu to Toggle Agents
  const CATEGORY_EMOJI: Record<string, string> = {
    MEME: '🌸', LP: '🌊', PERPS: '🐋', NFT: '🔮', PREDICTION: '🎯', CT_ALPHA: '☀️',
  };
  const agentSelect = new StringSelectMenuBuilder()
    .setCustomId('select_toggle_agent')
    .setPlaceholder('👇 Select a Sub-Agent to Toggle (START / PAUSE)')
    .addOptions(
      ...AGENT_DOMAINS.map((d) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(d.displayName.replace(/-/g, ' '))
          .setValue(d.id)
          .setDescription(d.name)
          .setEmoji(CATEGORY_EMOJI[d.category] || '🐾')
      )
    );

  // Row 1: Master Toggles
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_start_all_agents')
      .setLabel('Start All Agents')
      .setStyle(ButtonStyle.Success)
      .setEmoji('▶️'),
    new ButtonBuilder()
      .setCustomId('btn_pause_all_agents')
      .setLabel('Pause All Agents')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('⏸️'),
    new ButtonBuilder()
      .setCustomId('btn_emergency_stop')
      .setLabel('9-Lives Stop')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🛑')
  );

  // Row 2: Quick Action Buttons
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_setup_api_keys')
      .setLabel('Setup API Keys')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('⚙️'),
    new ButtonBuilder()
      .setCustomId('btn_view_wallets')
      .setLabel('Wallet Balances')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🔑'),
    new ButtonBuilder()
      .setCustomId('btn_view_alerts')
      .setLabel('Active Alerts')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🔔'),
    new ButtonBuilder()
      .setCustomId('btn_refresh_dashboard')
      .setLabel('Refresh Menu')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🔄')
  );

  const rowDropdown = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(agentSelect);

  return {
    embeds: [embed],
    components: [rowDropdown, row1, row2],
  };
}
