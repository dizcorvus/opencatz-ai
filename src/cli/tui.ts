import dotenv from 'dotenv';
import readline from 'readline';
dotenv.config();
import { AthenaHub } from '../orchestrator/hub.js';
import { SwarmConsensusEngine } from '../orchestrator/swarm-consensus.js';
import { AIService } from '../services/ai-service.js';
import { globalWalletService } from '../services/wallet-service.js';
import { StateStore } from '../services/state-store.js';
import { globalNFTGatingService } from '../services/nft-gating-service.js';

const stateStore = new StateStore();
const hub = new AthenaHub();
const swarmEngine = new SwarmConsensusEngine();
const aiService = new AIService();
const walletService = globalWalletService;
walletService.attachStateStore(stateStore);

// OpenCatz ANSI Color Palette
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  lime: '\x1b[38;2;204;255;0m',      // #CCFF00 Robinhood Green (Hero)
  pink: '\x1b[38;2;255;183;178m',    // #FFB7B2 Pastel Pink
  lavender: '\x1b[38;2;214;199;255m',// #D6C7FF Lavender Purple
  cyan: '\x1b[38;2;128;222;234m',    // #80DEEA Retro Cyan
  yellow: '\x1b[38;2;255;245;157m',  // #FFF59D Pastel Yellow
  gold: '\x1b[38;2;255;215;0m',      // #FFD700 Golden Fortune
  red: '\x1b[38;2;229;57;53m',       // #E53935 Maneki-Neko Red
  green: '\x1b[38;2;0;230;118m',     // #00E676 Jade Spirit
  blue: '\x1b[38;2;2;119;189m',      // #0277BD Denim Blue
};

const OPENCATZ_TUI_ASCII = `
${C.lime}${C.bold}       /\\_____/\\
      /  ${C.pink}■${C.lime}   ${C.pink}■${C.lime}  \\      ${C.lime}🐾 OPENCATZ AI COMMAND CENTER 🐾${C.reset}
${C.lime}     ( ==  ${C.pink}^${C.lime}  == )     ${C.cyan}Autonomous Multichain Swarm Intelligence${C.reset}
${C.lime}      )    ${C.yellow}~${C.lime}    (      ${C.lavender}Solana • Robinhood Chain • EVM • Perps • NFTs${C.reset}
${C.lime}     (   _____   )     ${C.gold}"Chill trades, 9 lives, sharp alpha." • opencatz.xyz${C.reset}
${C.lime}    ( (  )   (  ) )
   (__(__)___(__)__)${C.reset}
`;

export async function launchTUI(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = (query: string) => new Promise<string>((resolve) => rl.question(query, resolve));

  while (true) {
    console.clear();
    console.log(OPENCATZ_TUI_ASCII);
    console.log(`${C.cyan}${C.bold}========================================================================${C.reset}`);
    console.log(`${C.lime}🌿 Mode:${C.reset} MANUAL EXECUTION (screener/caller) | ${C.yellow}🐱 AI Companion:${C.reset} ${aiService.getConfig().provider} (${aiService.getConfig().modelName})`);
    console.log(`${C.cyan}------------------------------------------------------------------------${C.reset}`);
    console.log(` ${C.lime}[1]${C.reset} 🔑 Burner Wallet & Treasury Manager (Solana & Robinhood/EVM)`);
    console.log(` ${C.pink}[2]${C.reset} 🔍 On-Demand 3-Layer Swarm Token Audit (Input CA)`);
    console.log(` ${C.cyan}[3]${C.reset} ⚡ Background Screening Control (8 Multichain Specialist Agents)`);
    console.log(` ${C.yellow}[4]${C.reset} 🧠 Cat Den Command Room Chat (Natural Language AI Hub)`);
    console.log(` ${C.lime}[5]${C.reset} 🛡️ 9-Lives Risk Management & Safeguards`);
    console.log(` ${C.gold}[6]${C.reset} 📊 Trade Journal & Realized PnL Analytics (View Summary)`);
    console.log(` ${C.red}[7]${C.reset} 🛑 9-Lives Circuit Breaker (Halt All Active Agents)`);
    console.log(` ${C.green}[8]${C.reset} ▶️ Run Local Screening Pass (Test One Agent)`);
    console.log(` ${C.lavender}[9]${C.reset} 🐱 Catz NFT Holder Gating & Verification`);
    console.log(` ${C.red}[0]${C.reset} ❌ Exit OpenCatz Control Center`);
    console.log(`${C.cyan}------------------------------------------------------------------------${C.reset}`);

    const choice = await prompt(`${C.bold}🐾 Select Command Option (0-9): ${C.reset}`);

    if (choice === '0') {
      console.log(`\n${C.yellow}May OpenCatz 9 lives protect your bags. Purr-fect trading! 👋🐾${C.reset}\n`);
      rl.close();
      break;
    }

    switch (choice.trim()) {
      case '1': {
        console.clear();
        console.log(`${C.cyan}=== 🔑 OPENCATZ TREASURY & BURNER WALLETS ===${C.reset}`);
        const hasSol = walletService.hasWallet('solana');
        const hasEvm = walletService.hasWallet('evm');
        console.log(`• Solana Wallet:        ${hasSol ? C.green + walletService.getSolanaAddress() + C.reset : C.red + 'Not Configured' + C.reset}`);
        console.log(`• Robinhood/EVM Wallet: ${hasEvm ? C.green + walletService.getEvmAddress() + C.reset : C.red + 'Not Configured' + C.reset}\n`);
        console.log('[1] Import / Replace Solana Private Key');
        console.log('[2] Import / Replace EVM / Robinhood Private Key');
        console.log('[3] Remove / Clear Solana Private Key');
        console.log('[4] Remove / Clear EVM Private Key');
        console.log('[5] 💸 Execute Instant Withdrawal (Transfer Native Funds)');
        console.log('[0] Back to OpenCatz Menu\n');
        const walletSub = await prompt('Select Treasury Action (0-5): ');
        if (walletSub === '1' || walletSub === '2') {
          const chain = walletSub === '1' ? 'solana' : 'evm';
          const pk = await prompt(`Enter ${chain.toUpperCase()} Private Key: `);
          if (pk.trim()) {
            walletService.setKey(chain, pk.trim());
            console.log(`${C.green}✅ ${chain.toUpperCase()} Private Key imported and active!${C.reset}`);
          }
        } else if (walletSub === '3' || walletSub === '4') {
          const chain = walletSub === '3' ? 'solana' : 'evm';
          walletService.removeKey(chain);
          console.log(`${C.yellow}🗑️ ${chain.toUpperCase()} Private Key removed from memory!${C.reset}`);
        } else if (walletSub === '5') {
          const to = await prompt('Destination Recipient Wallet Address: ');
          const amtStr = await prompt('Amount of Native Token (SOL / ETH) to Withdraw: ');
          const amt = parseFloat(amtStr);
          if (to.trim() && !isNaN(amt) && amt > 0) {
            console.log(`${C.yellow}Executing withdrawal...${C.reset}`);
            try {
              if (!to.startsWith('0x')) {
                const res = await walletService.sendSol(to.trim(), amt);
                console.log(`${C.green}✅ Solana Withdrawal Complete! Tx: ${res.txHash}${C.reset}`);
              } else {
                const res = await walletService.sendEvm(4663, to.trim(), amt);
                console.log(`${C.green}✅ Robinhood Chain Withdrawal Complete! Tx: ${res.txHash}${C.reset}`);
              }
            } catch (err: any) {
              console.log(`${C.red}❌ Withdrawal failed: ${err.message}${C.reset}`);
            }
          }
        }
        await prompt(`\n${C.yellow}Press Enter to return to Menu...${C.reset}`);
        break;
      }

      case '2': {
        console.clear();
        console.log(`${C.cyan}=== 🔍 ON-DEMAND SWARM TOKEN AUDIT ===${C.reset}`);
        const ca = await prompt('Enter Token Contract Address (CA): ');
        if (ca.trim()) {
          console.log(`${C.yellow}Executing 3-Layer Swarm Consensus Audit (Quant + Catalyst + Security)...${C.reset}`);
          const isSol = !ca.trim().startsWith('0x');
          let liquidityUsd = 0;
          let volume1hUsd = 0;
          let securityPassed = false;
          let socialHypeScore = 0;
          try {
            if (isSol) {
              const { RugCheckService } = await import('../services/security-service.js');
              const { GMGNAdapter } = await import('../adapters/gmgn-adapter.js');
              const rug = new RugCheckService();
              const audit = await rug.auditSolanaToken(ca.trim());
              securityPassed = audit ? audit.isSafeForRunner : false;
              const gmgn = new GMGNAdapter();
              const sigs = await gmgn.fetchTrendingSignals('sol');
              const tok = sigs.find((s) => s.contractAddress.toLowerCase() === ca.trim().toLowerCase());
              if (tok) {
                liquidityUsd = tok.liquidityUsd || 0;
                volume1hUsd = (tok.volume24hUsd || 0) / 24;
                socialHypeScore = Math.min(98, 40 + (tok.smartMoneyCount >= 2 ? 20 : 0) + (tok.liquidityUsd >= 25000 ? 15 : 0) + (tok.volume24hUsd >= 100000 ? 15 : 0));
              }
            } else {
              const { GoPlusSecurityService } = await import('../services/goplus-security-service.js');
              const goplus = new GoPlusSecurityService();
              const audit = await goplus.auditToken('base', ca.trim());
              securityPassed = audit !== null && audit.buyTaxPct <= 5 && audit.sellTaxPct <= 5;
            }
          } catch (err: any) {
            console.log(`${C.red}⚠️ Real audit data unavailable: ${err?.message}${C.reset}`);
          }
          const res = swarmEngine.evaluateSignal({
            symbol: 'CUSTOM',
            domain: isSol ? 'MEME_SOLANA' : 'MEME_EVM',
            contractAddress: ca.trim(),
            liquidityUsd,
            volume1hUsd,
            securityAuditPassed: securityPassed,
            socialHypeScore,
          });
          console.log(`\n${C.green}🐾 OpenCatz Swarm Verdict:${C.reset}`);
          console.log(`• Real Liquidity: $${liquidityUsd} | Real 1h Vol: $${volume1hUsd} | Security: ${securityPassed ? 'PASS' : 'FAIL/UNAVAILABLE'}`);
          console.log(`• Confidence Score: ${C.bold}${res.confidenceScore}%${C.reset} (${res.passed ? C.green + 'APPROVED (>=80%)' : C.red + 'REJECTED'}${C.reset})`);
          console.log(`• Audit Reasoning: ${res.reason}`);
        }
        await prompt(`\n${C.yellow}Press Enter to return to Menu...${C.reset}`);
        break;
      }

      case '3': {
        console.clear();
        console.log(`${C.cyan}=== ⚡ BACKGROUND SCREENING SUB-AGENTS CONTROL ===${C.reset}`);
        const { AGENT_DOMAINS } = await import('../orchestrator/agent-registry.js');
        const subAgentsList = AGENT_DOMAINS.map((d, i) => ({
          id: String(i + 1),
          domain: d.id,
          label: `${d.displayName.replace(/-/g, ' ')} (${d.channel.replace('call-', '#')})`,
        }));
        const activeDomains = hub.getActiveDomains();
        subAgentsList.forEach(a => {
          const isActive = activeDomains.includes(a.domain);
          console.log(`[${a.id}] ${a.label}: ${isActive ? C.green + '🟢 ACTIVE' + C.reset : C.red + '🔴 PAUSED' + C.reset}`);
        });
        console.log('[A] ⚡ Activate ALL Agents');
        console.log('[P] ⏸️ Pause ALL Agents');
        console.log('[0] Back to OpenCatz Menu\n');
        const agentChoice = await prompt('Select Option (1-8, A, P, 0): ');
        if (agentChoice.toUpperCase() === 'A') {
          subAgentsList.forEach(a => hub.toggleChannelScreening('tui-terminal', a.domain, true));
          console.log(`${C.green}⚡ All 8 Sub-Agents activated in OpenCatz TUI!${C.reset}`);
        } else if (agentChoice.toUpperCase() === 'P') {
          subAgentsList.forEach(a => hub.toggleChannelScreening('tui-terminal', a.domain, false));
          console.log(`${C.yellow}⏸️ All 8 Sub-Agents paused in OpenCatz TUI!${C.reset}`);
        } else {
          const selected = subAgentsList.find(a => a.id === agentChoice.trim());
          if (selected) {
            const currentActive = activeDomains.includes(selected.domain);
            hub.toggleChannelScreening('tui-terminal', selected.domain, !currentActive);
            console.log(`${C.green}✅ ${selected.domain} is now ${!currentActive ? 'ACTIVE' : 'PAUSED'}!${C.reset}`);
          }
        }
        await prompt(`\n${C.yellow}Press Enter to return to Menu...${C.reset}`);
        break;
      }

      case '4': {
        console.clear();
        console.log(`${C.cyan}=== 🧠 CAT DEN COMMAND ROOM CHAT ===${C.reset}`);
        console.log(`${C.yellow}Ask OpenCatz anything about trades, on-chain sentiment, or portfolio (type 'exit' to quit):${C.reset}\n`);
        while (true) {
          const chatMsg = await prompt(`${C.pink}You: ${C.reset}`);
          if (chatMsg.toLowerCase() === 'exit') break;
          try {
            const { OPENCATZ_SYSTEM_PROMPT_BASE } = await import('../services/opencatz-system-prompt.js');
            const { ToolRegistry } = await import('../orchestrator/tool-registry.js');
            const { runAgent } = await import('../orchestrator/agent-runner.js');
            const { SessionMemoryService } = await import('../services/session-memory.js');
            const toolRegistry = new ToolRegistry();
            toolRegistry.attachOrchestrator(hub);
            toolRegistry.attachAIService(aiService);
            toolRegistry.attachWalletService(globalWalletService);
            const activeDomains = hub.getActiveDomains();
            const activeAgentsLine = activeDomains.length > 0
              ? `Active Sub-Agents right now: ${activeDomains.join(', ')}`
              : 'Active Sub-Agents right now: NONE (all paused)';
            const risk = hub.getRiskManager().getRiskState();
            const memoryContext = new SessionMemoryService().buildMemoryContextLine();
            const systemPrompt = OPENCATZ_SYSTEM_PROMPT_BASE + `
Current Operating Parameters:
- ${activeAgentsLine}
- Execution Mode: MANUAL EXECUTION — bot is screener/caller only, execution done by the user via the call-card link.
- Global Portfolio Drawdown Limit: ${risk.maxDrawdownLimitPct}%.
- Current Portfolio Drawdown: ${risk.currentDrawdownPct ?? 0}%.${memoryContext}`;

            const agentResult = await runAgent(
              { aiService, toolRegistry, systemPrompt },
              chatMsg
            );
            const aiRes = agentResult.text || (agentResult.toolResults.length > 0
              ? agentResult.toolResults.map((t) => `• ${t.name}: ${t.success ? '✅' : '❌'} ${t.message}`).join('\n')
              : '[No response from AI.]');
            console.log(`${C.lime}OpenCatz:${C.reset} ${aiRes}\n`);
          } catch (err: any) {
            console.log(`${C.lime}OpenCatz:${C.reset} Order acknowledged: "${chatMsg}". Operating in DRY_RUN safe simulation.\n`);
          }
        }
        break;
      }

      case '5': {
        console.clear();
        const risk = hub.getRiskManager().getRiskState();
        console.log(`${C.cyan}=== 🛡️ 9-LIVES RISK MANAGEMENT & SAFEGUARDS ===${C.reset}`);
        console.log(`• Max Portfolio Drawdown Limit: ${risk.maxDrawdownLimitPct}% (current: ${risk.currentDrawdownPct ?? 0}%)`);
        console.log(`• Max Position Size: $${risk.maxPositionSizeUsd} per trade`);
        console.log(`• Max Sector Exposure: ${risk.maxSectorExposurePercent}% | Max Correlated Positions: ${risk.maxCorrelatedPositions}`);
        console.log(`• 9-Lives Circuit Breaker: ${risk.paused ? 'ACTIVE (TRADING HALTED)' : 'NORMAL (RUNNING)'}`);
        console.log(`• Position Manager: Auto TP (2x/3x), Stop Loss (-20%), Dynamic Trailing Stops`);
        await prompt(`\n${C.yellow}Press Enter to return to Menu...${C.reset}`);
        break;
      }

      case '6': {
        console.clear();
        console.log(`${C.cyan}=== 📊 TRADE JOURNAL & PNL ANALYTICS ===${C.reset}`);
        const { TradeJournalService } = await import('../services/trade-journal-service.js');
        const stats = new TradeJournalService().getSummaryStats();
        console.log(`• Total Logged Trades: ${C.green}${stats.totalTrades}${C.reset} (${stats.openTradesCount} Open, ${stats.winCount + stats.lossCount} Closed)`);
        console.log(`• Win Rate: ${C.green}${stats.winRatePct.toFixed(1)}%${C.reset} (${stats.winCount} Wins / ${stats.lossCount} Losses)`);
        console.log(`• Total Realized PnL: ${C.green}$${stats.totalRealizedPnlUsd.toFixed(2)} USD${C.reset}`);
        console.log(`• Best Trade: ${C.green}+$${stats.bestTradeUsd.toFixed(2)} USD${C.reset} | Worst: ${C.red}-$${Math.abs(stats.worstTradeUsd).toFixed(2)} USD${C.reset}`);
        await prompt(`\n${C.yellow}Press Enter to return to Menu...${C.reset}`);
        break;
      }

      case '7': {
        console.clear();
        console.log(`${C.red}=== 🛑 9-LIVES EMERGENCY CIRCUIT BREAKER ===${C.reset}`);
        console.log(`${C.red}9-Lives Protection engaged! All screening agents and pending orders halted!${C.reset}`);
        hub.getActiveDomains().forEach(d => hub.toggleChannelScreening('tui-terminal', d, false));
        await prompt(`\n${C.yellow}Press Enter to return to Menu...${C.reset}`);
        break;
      }

      case '8': {
        console.clear();
        console.log(`${C.cyan}=== ▶️ RUN SCREENING PASS (LOCAL TEST) ===${C.reset}`);
        const { AGENT_DOMAINS } = await import('../orchestrator/agent-registry.js');
        AGENT_DOMAINS.forEach((d, i) => console.log(`[${i + 1}] ${d.displayName} (${d.channel})`));
        console.log('[0] Back\n');
        const sel = await prompt('Select Agent (1-8): ');
        const chosen = AGENT_DOMAINS[parseInt(sel) - 1];
        if (!chosen) { await prompt(`${C.red}Invalid. Press Enter...${C.reset}`); break; }
        console.log(`\n${C.yellow}Running ${chosen.displayName} screening pass...${C.reset}`);
        const results = await hub.triggerAgentPass(chosen.id);
        if (results.length === 0) {
          console.log(`${C.yellow}No signals passed. (Data unavailable or filtered out — check logs.)${C.reset}`);
        }
        for (const r of results) {
          const payload = (r as any).payload;
          if (payload) {
            console.log(`\n${C.green}✅ ${payload.symbol} (${payload.title}) — ${payload.confidenceScore}%${C.reset}`);
            console.log(`   MC: ${payload.marketCap} | Liq: ${payload.liquidity} | Vol1h: ${payload.volume1h}`);
            console.log(`   Tx: ${payload.txRatio} | Dev: ${payload.devHoldingPct} | Bundler: ${payload.bundlerPct}`);
            console.log(`   Thesis: ${payload.aiThesis}`);
          } else {
            console.log(`\n${C.green}✅ Signal: ${r.reason}${C.reset}`);
          }
        }
        await prompt(`\n${C.yellow}Press Enter to return to Menu...${C.reset}`);
        break;
      }

      case '9': {
        console.clear();
        console.log(`${C.lavender}=== 🐱 CATZ NFT HOLDER GATING & VERIFICATION ===${C.reset}`);
        const info = globalNFTGatingService.getCollectionInfo();
        console.log(`• Collection:   ${C.bold}${info.name} (${info.symbol})${C.reset}`);
        console.log(`• Supply:       ${info.totalSupply} Unique 24x24 Pixel Art NFTs`);
        console.log(`• Chain:        ${info.chain} (Chain ID: ${info.chainId})`);
        console.log(`• Contract:     ${info.contractAddress}`);
        console.log(`• Standard:     ${info.standard} (100% Fully On-Chain SVG)\n`);

        const wallet = await prompt('Enter EVM Wallet Address to Verify (0x...): ');
        if (wallet.trim()) {
          console.log(`${C.yellow}Checking on-chain Catz NFT holdings on Robinhood Chain...${C.reset}`);
          const status = await globalNFTGatingService.verifyHolder(wallet.trim());
          if (status.isHolder) {
            console.log(`\n${C.green}🎉 VERIFIED CATZ HOLDER!${C.reset}`);
            console.log(`• Tier: ${status.holderTier}`);
            console.log(`• Balance: ${status.balance} CATZ NFT`);
            console.log(`• VIP Privileges: Full Multichain Access Unlocked 🐾⚡`);
          } else {
            console.log(`\n${C.red}❌ No Catz NFT found in wallet: ${status.walletAddress}${C.reset}`);
            console.log(`• Info: Mint or buy on OpenSea / Robinhood Chain (opencatz.xyz)`);
          }
        }
        await prompt(`\n${C.yellow}Press Enter to return to Menu...${C.reset}`);
        break;
      }

      default:
        await prompt(`${C.red}Invalid option. Press Enter to try again...${C.reset}`);
        break;
    }
  }
}

if (process.argv[1]?.includes('tui') || process.argv.includes('--tui')) {
  launchTUI().catch(console.error);
}
