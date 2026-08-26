/**
 * Discord interaction entry point — dispatches to focused handler modules.
 * Service instances live in command-handlers.ts; re-exported here for
 * backward compatibility with existing consumers (index.ts, message-handler.ts).
 */
import { Interaction } from 'discord.js';
import { OpenCatzHub } from '../../orchestrator/hub.js';
import { AIService } from '../../services/ai-service.js';
import {
  priceAlertService,
  tradeJournalService,
  walletService,
  priceFeedService,
  handleChatInput,
} from './command-handlers.js';
import {
  handleModalSubmit,
  handleSelectMenu,
  handleButtonPress,
} from './interaction-buttons.js';

export { priceAlertService, tradeJournalService, walletService, priceFeedService };
export type { PriceAlertService } from '../../services/price-alert-service.js';
export type { TradeJournalService } from '../../services/trade-journal-service.js';
export type { WalletService } from '../../services/wallet-service.js';

export function isOpenCatzChannel(interaction: Interaction): boolean {
  if (!interaction.guild) return true; // Direct Messages allowed

  const channel = interaction.channel;
  if (!channel || !('name' in channel)) return false;

  const channelName = (channel.name || '').toLowerCase();
  const parentName = ('parent' in channel && channel.parent?.name) ? channel.parent.name.toLowerCase() : '';

  // 1. Belongs to Category containing OpenCatz
  if (parentName.includes('opencatz') || parentName.includes('opencat')) return true;

  // 2. Standard OpenCatz multichain channel names
  const KNOWN_CHANNELS = [
    'opencatz-control-room',
    'opencat-control-room',
    'opencatz-audit',
    'opencat-audit',
    'audit-on-demand',
    'call-meme-solana',
    'call-meme-robinhood',
    'call-meme-base',
    'call-meme-eth',
    'call-meme-ink',
    'call-lp-solana',
    'call-lp-robinhood',
    'call-nft-eth',
    'call-nft-base',
    'call-nft-ink',
    'call-nft-robinhood',
    'call-nft-hyperevm',
    'call-whale-tracking',
    'call-prediction-markets',
    'call-ct-alpha',
    'opencatz-logs',
    'opencat-logs',
    'opencatz-journal',
    'opencat-journal',
  ];

  if (KNOWN_CHANNELS.includes(channelName)) return true;

  // 3. Custom created channel prefixes
  if (channelName.startsWith('opencatz-') || channelName.startsWith('opencat-') || channelName.startsWith('call-') || channelName.startsWith('audit-')) return true;

  return false;
}

export async function handleInteraction(
  interaction: Interaction,
  hub: OpenCatzHub,
  aiService: AIService
): Promise<void> {
  try {
    // Channel Restriction Guard: Block interactions outside OpenCatz channels
    if (interaction.isChatInputCommand() || interaction.isButton() || interaction.isModalSubmit() || interaction.isStringSelectMenu()) {
      if (!isOpenCatzChannel(interaction)) {
        if (interaction.isRepliable()) {
          const controlRoomChannel = interaction.guild?.channels.cache.find(c => c.name === 'opencatz-control-room' || c.name === 'opencat-control-room');
          const controlRoomRef = controlRoomChannel ? `<#${controlRoomChannel.id}>` : '**#opencatz-control-room**';
          await interaction.reply({
            content: `🐾 **OpenCatz Channel Notice:**\n` +
              `OpenCatz slash commands and interactive controls are scoped to **OpenCatz Command Center** channels (e.g. ${controlRoomRef}).\n\n` +
              `Please run your command inside ${controlRoomRef} or dedicated OpenCatz call channels!`,
            flags: 1 << 6, // EPHEMERAL
          });
        }
        return;
      }
    }

    if (interaction.isChatInputCommand()) {
      await handleChatInput(interaction, hub);
    } else if (interaction.isModalSubmit()) {
      await handleModalSubmit(interaction);
    } else if (interaction.isButton()) {
      await handleButtonPress(interaction, hub);
    } else if (interaction.isStringSelectMenu()) {
      await handleSelectMenu(interaction, hub);
    }
  } catch (error: any) {
    console.error('Interaction handling error:', error);
    if (!interaction.isRepliable()) return;
    const message = `❌ Error processing interaction: ${error.message}`;
    try {
      if (interaction.deferred) {
        // Already deferred (e.g. /analyze, /screening) — must edit, not reply
        await interaction.editReply(message);
      } else if (!interaction.replied) {
        await interaction.reply({ content: message, flags: 1 << 6 }); // EPHEMERAL
      }
    } catch (replyErr: any) {
      console.error('Error replying to interaction:', replyErr.message);
    }
  }
}
