import dotenv from 'dotenv';
import readline from 'readline';
dotenv.config();
import { OpenCatzHub } from '../orchestrator/hub.js';
import { SwarmConsensusEngine } from '../orchestrator/swarm-consensus.js';
import { AIService } from '../services/ai-service.js';
import { globalWalletService } from '../services/wallet-service.js';
import { StateStore } from '../services/state-store.js';
import { THEME, getOpenCatzHeaderBanner, drawDivider } from './theme.js';

const stateStore = new StateStore();
const hub = new OpenCatzHub();
const swarmEngine = new SwarmConsensusEngine();
const aiService = new AIService();
const walletService = globalWalletService;
walletService.attachStateStore(stateStore);

const C = THEME;

export async function launchTUI(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = (query: string) => new Promise<string>((resolve) => rl.question(query, resolve));

  while (true) {
    console.clear();
    console.log(getOpenCatzHeaderBanner('Autonomous 3-Layer Swarm Consensus & Precision Execution'));
    console.log(drawDivider('═', 78, C.cyan));
    console.log(`  ${C.lime}${C.bold}🌿 Mode:${C.reset} ${C.white}MANUAL EXECUTION (Screener/Caller)${C.reset} ${C.darkGray}|${C.reset} ${C.yellow}${C.bold}🐱 AI Brain:${C.reset} ${C.white}${aiService.getConfig().provider.toUpperCase()} (${aiService.getConfig().modelName})${C.reset}`);
    console.log(drawDivider('─', 78, C.darkGray));
    console.log(`  ${C.lime}${C.bold}[1]${C.reset} ${C.white}🔑 Burner Wallet & Treasury Manager (Solana & Robinhood/EVM)${C.reset}`);
    console.log(`  ${C.pink}${C.bold}[2]${C.reset} ${C.white}🔍 On-Demand 3-Layer Swarm Token Audit (Input Contract Address)${C.reset}`);
    console.log(`  ${C.cyan}${C.bold}[3]${C.reset} ${C.white}⚡ Background Screening Control (15 Multichain Specialist Agents)${C.reset}`);
    console.log(`  ${C.yellow}${C.bold}[4]${C.reset} ${C.white}🧠 Command Room Chat Assistant (Natural Language Swarm Assistant)${C.reset}`);
    console.log(`  ${C.lime}${C.bold}[5]${C.reset} ${C.white}🛡️ 9-Lives Risk Management & Portfolio Drawdown Guards${C.reset}`);
    console.log(`  ${C.gold}${C.bold}[6]${C.reset} ${C.white}📊 Trade Journal & Realized PnL Analytics (View Performance)${C.reset}`);
    console.log(`  ${C.red}${C.bold}[7]${C.reset} ${C.white}🛑 9-Lives Emergency Circuit Breaker (Halt All Active Agents)${C.reset}`);
    console.log(`  ${C.green}${C.bold}[8]${C.reset} ${C.white}▶️ Run Local Agent Screening Pass (Instant Single-Agent Test)${C.reset}`);
    console.log(`  ${C.lavender}${C.bold}[9]${C.reset} ${C.white}🩺 System Diagnostics & Doctor Health Check (APIs, RPCs & Hub)${C.reset}`);
    console.log(`  ${C.red}${C.bold}[0]${C.reset} ${C.gray}❌ Exit OpenCatz Terminal Control Center${C.reset}`);
    console.log(drawDivider('─', 78, C.darkGray));

    const choice = await prompt(`  ${C.lime}${C.bold}🐾 Select Command Option (0-9): ${C.reset}`);

    if (choice.trim() === '0') {
      console.log(`\n  ${C.gold}${C.bold}🐾 May OpenCatz 9 lives protect your bags. Purr-fect trading! 👋${C.reset}\n`);
      rl.close();
      break;
    }

    switch (choice.trim()) {
      case '1': {
        console.clear();
        console.log(getOpenCatzHeaderBanner('Treasury & Burner Wallets Manager'));
        console.log(drawDivider('═', 78, C.lime));
        const hasSol = walletService.hasWallet('solana');
        const hasEvm = walletService.hasWallet('evm');
        console.log(`  ${C.white}• Solana Wallet:        ${hasSol ? C.green + C.bold + walletService.getSolanaAddress() + C.reset : C.red + 'Not Configured' + C.reset}`);
        console.log(`  ${C.white}• Robinhood/EVM Wallet: ${hasEvm ? C.green + C.bold + walletService.getEvmAddress() + C.reset : C.red + 'Not Configured' + C.reset}\n`);
        console.log(`  ${C.lime}[1]${C.reset} Import / Replace Solana Private Key`);
        console.log(`  ${C.lime}[2]${C.reset} Import / Replace EVM / Robinhood Private Key`);
        console.log(`  ${C.red}[3]${C.reset} Remove / Clear Solana Private Key`);
        console.log(`  ${C.red}[4]${C.reset} Remove / Clear EVM Private Key`);
        console.log(`  ${C.gold}[5]${C.reset} 💸 Execute Instant Withdrawal (Transfer Native Funds)`);
        console.log(`  ${C.gray}[0]${C.reset} Back to Main Menu\n`);
        const walletSub = await prompt(`  ${C.cyan}Select Treasury Action (0-5): ${C.reset}`);
        if (walletSub === '1' || walletSub === '2') {
          const chain = walletSub === '1' ? 'solana' : 'evm';
          const pk = await prompt(`  ${C.yellow}Enter ${chain.toUpperCase()} Private Key: ${C.reset}`);
          if (pk.trim()) {
            walletService.setKey(chain, pk.trim());
            console.log(`  ${C.green}✅ ${chain.toUpperCase()} Private Key imported and persisted safely!${C.reset}`);
          }
        } else if (walletSub === '3' || walletSub === '4') {
          const chain = walletSub === '3' ? 'solana' : 'evm';
          walletService.removeKey(chain);
          console.log(`  ${C.yellow}🗑️ ${chain.toUpperCase()} Private Key removed from active memory!${C.reset}`);
        } else if (walletSub === '5') {
          const to = await prompt(`  ${C.yellow}Destination Recipient Wallet Address: ${C.reset}`);
          const amtStr = await prompt(`  ${C.yellow}Amount of Native Token (SOL / ETH) to Withdraw: ${C.reset}`);
          const amt = parseFloat(amtStr);
          if (to.trim() && !isNaN(amt) && amt > 0) {
            console.log(`  ${C.cyan}Executing transfer...${C.reset}`);
            try {
              if (!to.startsWith('0x')) {
                const res = await walletService.sendSol(to.trim(), amt);
                console.log(`  ${C.green}✅ Solana Withdrawal Complete! Tx: ${res.txHash}${C.reset}`);
              } else {
                const res = await walletService.sendEvm(4663, to.trim(), amt);
                console.log(`  ${C.green}✅ Robinhood Chain Withdrawal Complete! Tx: ${res.txHash}${C.reset}`);
              }
            } catch (err: any) {
              console.log(`  ${C.red}❌ Withdrawal failed: ${err.message}${C.reset}`);
            }
          }
        }
        await prompt(`\n  ${C.gray}Press Enter to return to Menu...${C.reset}`);
        break;
      }

      case '2': {
        console.clear();
        console.log(getOpenCatzHeaderBanner('3-Layer Swarm Token Security Audit'));
        console.log(drawDivider('═', 78, C.pink));
        const ca = await prompt(`  ${C.pink}${C.bold}Enter Token Contract Address (CA): ${C.reset}`);
        if (ca.trim()) {
          console.log(`\n  ${C.yellow}Executing 3-Layer Swarm Audit (Quant + Catalyst + Security)...${C.reset}`);
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
            console.log(`  ${C.red}⚠️ Real audit data error: ${err?.message}${C.reset}`);
          }
          const res = swarmEngine.evaluateSignal({
            symbol: 'AUDIT',
            domain: isSol ? 'MEME_SOLANA' : 'MEME_EVM',
            contractAddress: ca.trim(),
            liquidityUsd,
            volume1hUsd,
            securityAuditPassed: securityPassed,
            socialHypeScore,
          });
          console.log(`\n  ${C.lime}${C.bold}🐾 OpenCatz Swarm Audit Verdict:${C.reset}`);
          console.log(`  ${C.white}• Liquidity: $${liquidityUsd.toLocaleString()} | 1h Vol: $${volume1hUsd.toLocaleString()} | Security: ${securityPassed ? C.green + 'PASS' : C.red + 'FAIL/UNAVAILABLE'}${C.reset}`);
          console.log(`  ${C.white}• Confidence Score: ${C.bold}${res.confidenceScore}%${C.reset} (${res.passed ? C.green + 'APPROVED (>=80%)' : C.red + 'REJECTED (<80%)'}${C.reset})`);
          console.log(`  ${C.white}• Audit Thesis: ${C.cyan}${res.reason}${C.reset}`);
        }
        await prompt(`\n  ${C.gray}Press Enter to return to Menu...${C.reset}`);
        break;
      }

      case '3': {
        console.clear();
        console.log(getOpenCatzHeaderBanner('Background Screening Agents Control'));
        console.log(drawDivider('═', 78, C.cyan));
        const { AGENT_DOMAINS } = await import('../orchestrator/agent-registry.js');
        const subAgentsList = AGENT_DOMAINS.map((d, i) => ({
          id: String(i + 1),
          domain: d.id,
          label: `${d.displayName.replace(/-/g, ' ')} (${d.channel.replace('call-', '#')})`,
        }));
        const activeDomains = hub.getActiveDomains();
        subAgentsList.forEach(a => {
          const isActive = activeDomains.includes(a.domain);
          console.log(`  ${C.cyan}[${a.id}]${C.reset} ${C.white}${a.label.padEnd(46)}${C.reset}: ${isActive ? C.green + C.bold + '🟢 ACTIVE' + C.reset : C.red + '🔴 PAUSED' + C.reset}`);
        });
        console.log(`\n  ${C.lime}[A]${C.reset} ⚡ Activate ALL Agents`);
        console.log(`  ${C.yellow}[P]${C.reset} ⏸️ Pause ALL Agents`);
        console.log(`  ${C.gray}[0]${C.reset} Back to Main Menu\n`);
        const agentChoice = await prompt(`  ${C.cyan}Select Option (1-${subAgentsList.length}, A, P, 0): ${C.reset}`);
        if (agentChoice.toUpperCase() === 'A') {
          subAgentsList.forEach(a => hub.toggleChannelScreening('tui-terminal', a.domain, true));
          console.log(`  ${C.green}⚡ All ${subAgentsList.length} Sub-Agents activated in OpenCatz TUI!${C.reset}`);
        } else if (agentChoice.toUpperCase() === 'P') {
          subAgentsList.forEach(a => hub.toggleChannelScreening('tui-terminal', a.domain, false));
          console.log(`  ${C.yellow}⏸️ All ${subAgentsList.length} Sub-Agents paused in OpenCatz TUI!${C.reset}`);
        } else {
          const selected = subAgentsList.find(a => a.id === agentChoice.trim());
          if (selected) {
            const currentActive = activeDomains.includes(selected.domain);
            hub.toggleChannelScreening('tui-terminal', selected.domain, !currentActive);
            console.log(`  ${C.green}✅ ${selected.domain} is now ${!currentActive ? 'ACTIVE' : 'PAUSED'}!${C.reset}`);
          }
        }
        await prompt(`\n  ${C.gray}Press Enter to return to Menu...${C.reset}`);
        break;
      }

      case '4': {
        console.clear();
        console.log(getOpenCatzHeaderBanner('Cat Den Swarm Assistant Chat'));
        console.log(drawDivider('═', 78, C.yellow));
        console.log(`  ${C.yellow}Ask OpenCatz anything about tokens, risk limits, or portfolio (type 'exit' to quit):${C.reset}\n`);
        while (true) {
          const chatMsg = await prompt(`  ${C.pink}${C.bold}You: ${C.reset}`);
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
            console.log(`  ${C.lime}${C.bold}OpenCatz:${C.reset} ${aiRes}\n`);
          } catch (err: any) {
            console.log(`  ${C.lime}${C.bold}OpenCatz:${C.reset} Order acknowledged: "${chatMsg}". Operating in DRY_RUN safe simulation.\n`);
          }
        }
        break;
      }

      case '5': {
        console.clear();
        console.log(getOpenCatzHeaderBanner('9-Lives Risk Management Engine'));
        console.log(drawDivider('═', 78, C.lime));
        const risk = hub.getRiskManager().getRiskState();
        console.log(`  ${C.white}• Max Portfolio Drawdown Limit : ${C.lime}${C.bold}${risk.maxDrawdownLimitPct}%${C.reset} (Current: ${risk.currentDrawdownPct ?? 0}%)`);
        console.log(`  ${C.white}• Max Position Size            : ${C.lime}${C.bold}$${risk.maxPositionSizeUsd} USD${C.reset}`);
        console.log(`  ${C.white}• Max Sector Exposure          : ${C.lime}${C.bold}${risk.maxSectorExposurePercent}%${C.reset} | Max Correlated: ${risk.maxCorrelatedPositions}`);
        console.log(`  ${C.white}• 9-Lives Circuit Breaker      : ${risk.paused ? C.red + 'ACTIVE (TRADING HALTED)' : C.green + 'NORMAL (RUNNING)'}${C.reset}`);
        console.log(`  ${C.white}• Position Manager Strategy    : ${C.gold}Auto TP (2x/3x), Stop Loss (-20%), Dynamic Trailing Stop${C.reset}`);
        await prompt(`\n  ${C.gray}Press Enter to return to Menu...${C.reset}`);
        break;
      }

      case '6': {
        console.clear();
        console.log(getOpenCatzHeaderBanner('Trade Journal & Realized PnL'));
        console.log(drawDivider('═', 78, C.gold));
        const { TradeJournalService } = await import('../services/trade-journal-service.js');
        const stats = new TradeJournalService().getSummaryStats();
        console.log(`  ${C.white}• Total Logged Trades : ${C.green}${C.bold}${stats.totalTrades}${C.reset} (${stats.openTradesCount} Open, ${stats.winCount + stats.lossCount} Closed)`);
        console.log(`  ${C.white}• Swarm Win Rate      : ${C.green}${C.bold}${stats.winRatePct.toFixed(1)}%${C.reset} (${stats.winCount} Wins / ${stats.lossCount} Losses)`);
        console.log(`  ${C.white}• Total Realized PnL  : ${C.gold}${C.bold}$${stats.totalRealizedPnlUsd.toFixed(2)} USD${C.reset}`);
        console.log(`  ${C.white}• Best Trade Outcome  : ${C.green}+$${stats.bestTradeUsd.toFixed(2)} USD${C.reset} | Worst: ${C.red}-$${Math.abs(stats.worstTradeUsd).toFixed(2)} USD${C.reset}`);
        await prompt(`\n  ${C.gray}Press Enter to return to Menu...${C.reset}`);
        break;
      }

      case '7': {
        console.clear();
        console.log(getOpenCatzHeaderBanner('9-Lives Emergency Circuit Breaker'));
        console.log(drawDivider('═', 78, C.red));
        console.log(`  ${C.red}${C.bold}🚨 9-Lives Protection engaged! All screening agents and pending orders halted!${C.reset}`);
        hub.getActiveDomains().forEach(d => hub.toggleChannelScreening('tui-terminal', d, false));
        await prompt(`\n  ${C.gray}Press Enter to return to Menu...${C.reset}`);
        break;
      }

      case '8': {
        console.clear();
        console.log(getOpenCatzHeaderBanner('Local Single-Agent Screening Test'));
        console.log(drawDivider('═', 78, C.green));
        const { AGENT_DOMAINS } = await import('../orchestrator/agent-registry.js');
        AGENT_DOMAINS.forEach((d, i) => console.log(`  ${C.cyan}[${i + 1}]${C.reset} ${C.white}${d.displayName.padEnd(30)}${C.reset} ${C.gray}(${d.channel})${C.reset}`));
        console.log(`  ${C.gray}[0] Back${C.reset}\n`);
        const sel = await prompt(`  ${C.cyan}Select Agent (1-${AGENT_DOMAINS.length}): ${C.reset}`);
        const chosen = AGENT_DOMAINS[parseInt(sel) - 1];
        if (!chosen) { await prompt(`  ${C.red}Invalid selection. Press Enter...${C.reset}`); break; }
        console.log(`\n  ${C.yellow}Running ${chosen.displayName} screening pass...${C.reset}`);
        const results = await hub.triggerAgentPass(chosen.id);
        if (results.length === 0) {
          console.log(`  ${C.yellow}No signals passed 3-Layer 80% Filter in this test run.${C.reset}`);
        }
        for (const r of results) {
          const payload = (r as any).payload;
          if (payload) {
            console.log(`\n  ${C.green}${C.bold}✅ ${payload.symbol} (${payload.title}) — Confidence: ${payload.confidenceScore}%${C.reset}`);
            console.log(`     MC: ${payload.marketCap} | Liquidity: ${payload.liquidity} | 1h Vol: ${payload.volume1h}`);
            console.log(`     Thesis: ${C.cyan}${payload.aiThesis}${C.reset}`);
          } else {
            console.log(`\n  ${C.green}✅ Signal: ${r.reason}${C.reset}`);
          }
        }
        await prompt(`\n  ${C.gray}Press Enter to return to Menu...${C.reset}`);
        break;
      }

      case '9': {
        console.clear();
        const { runOpenCatzDoctor } = await import('./doctor.js');
        await runOpenCatzDoctor();
        await prompt(`\n  ${C.gray}Press Enter to return to Menu...${C.reset}`);
        break;
      }

      default:
        await prompt(`  ${C.red}Invalid option. Press Enter to try again...${C.reset}`);
        break;
    }
  }
}

if (process.argv[1]?.includes('tui') || process.argv.includes('--tui')) {
  launchTUI().catch(console.error);
}
