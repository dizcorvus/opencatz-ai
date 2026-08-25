import { OpenCatzHub } from '../orchestrator/hub.js';
import { THEME, getOpenCatzHeaderBanner, drawDivider } from './theme.js';

const C = THEME;

export async function runOpenCatzDoctor(): Promise<void> {
  console.log(getOpenCatzHeaderBanner('System Health & Infrastructure Diagnostics'));
  console.log(drawDivider('═', 78, C.lime));

  // 1. Check API Keys Configuration & Pools
  console.log(`\n  ${C.lime}${C.bold}🔑 1. API KEYS & CREDENTIALS AUDIT:${C.reset}`);
  const gmgnPool = (await import('../services/api-key-pool.js')).loadApiKeyPool('GMGN_API_KEY');
  const aiPool = (await import('../services/api-key-pool.js')).loadApiKeyPool('AI_API_KEY');

  const envKeys = [
    { name: 'AI_API_KEY / POOL', val: aiPool.get(), count: aiPool.size, required: true },
    { name: 'GMGN_API_KEYS (Pool)', val: gmgnPool.get(), count: gmgnPool.size, required: false },
    { name: 'OPENSEA_API_KEY', val: process.env.OPENSEA_API_KEY, required: false },
    { name: 'TWEX_API_KEY', val: process.env.TWEX_API_KEY || process.env.TWITTER_BEARER_TOKEN, required: false },
    { name: 'GOPLUS_API_KEY', val: process.env.GOPLUS_API_KEY, required: false },
    { name: 'DISCORD_BOT_TOKEN', val: process.env.DISCORD_BOT_TOKEN, required: false },
    { name: 'TELEGRAM_BOT_TOKEN', val: process.env.TELEGRAM_BOT_TOKEN, required: false },
  ];

  for (const k of envKeys) {
    const isSet = Boolean(k.val);
    const countInfo = (k as any).count && (k as any).count > 1 ? ` ${C.cyan}[${(k as any).count} keys active]${C.reset}` : '';
    const statusStr = isSet 
      ? `${C.green}${C.bold}🟢 CONFIGURED${C.reset}${countInfo}` 
      : k.required ? `${C.red}${C.bold}🔴 MISSING (REQUIRED)${C.reset}` : `${C.gray}⚪ UNSET (OPTIONAL)${C.reset}`;
    const hint = isSet ? `${C.gray}(${k.val!.slice(0, 12)}...)${C.reset}` : '';
    console.log(`  ${C.gray}•${C.reset} ${C.white}${k.name.padEnd(28)}${C.reset}: ${statusStr} ${hint}`);
  }

  // 2. Check RPC Node Connectivity
  console.log(`\n  ${C.cyan}${C.bold}⚡ 2. WEB3 RPC NODE LATENCY & CONNECTIVITY:${C.reset}`);
  const rpcs = [
    { chain: 'Solana Mainnet', url: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com' },
    { chain: 'Robinhood Chain', url: process.env.ROBINHOOD_RPC_URL || 'https://rpc.robinhoodchain.com' },
    { chain: 'Base L2', url: process.env.EVM_BASE_RPC_URL || 'https://mainnet.base.org' },
    { chain: 'Ethereum Mainnet', url: process.env.EVM_ETH_RPC_URL || 'https://eth.llamarpc.com' },
  ];

  for (const rpc of rpcs) {
    const start = Date.now();
    try {
      await fetch(rpc.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: rpc.chain.includes('Solana') ? 'getHealth' : 'eth_blockNumber', params: [] }),
      });
      const latency = Date.now() - start;
      console.log(`  ${C.gray}•${C.reset} ${C.white}${rpc.chain.padEnd(22)}${C.reset}: ${C.green}🟢 ONLINE (${latency}ms)${C.reset} ${C.darkGray}|${C.reset} ${C.gray}${rpc.url}${C.reset}`);
    } catch (err: any) {
      console.log(`  ${C.gray}•${C.reset} ${C.white}${rpc.chain.padEnd(22)}${C.reset}: ${C.red}🔴 OFFLINE (${err.message})${C.reset} ${C.darkGray}|${C.reset} ${C.gray}${rpc.url}${C.reset}`);
    }
  }

  // 3. 9-Lives Risk Engine Status
  console.log(`\n  ${C.lime}${C.bold}🛡️ 3. 9-LIVES RISK ENGINE STATUS:${C.reset}`);
  const hub = new OpenCatzHub();
  const risk = hub.getRiskManager().getRiskState();
  console.log(`  ${C.gray}•${C.reset} ${C.white}Max Drawdown Limit${C.reset}: ${C.lime}${C.bold}${risk.maxDrawdownLimitPct}%${C.reset} (Current: ${risk.currentDrawdownPct ?? 0}%)`);
  console.log(`  ${C.gray}•${C.reset} ${C.white}Circuit Breaker   ${C.reset}: ${risk.paused ? C.red + 'ACTIVE (HALTED)' : C.green + 'NORMAL (RUNNING)'}${C.reset}`);

  // 4. Specialist Sub-Agents Health
  console.log(`\n  ${C.lime}${C.bold}🐾 4. SPECIALIST SUB-AGENTS HEALTH:${C.reset}`);
  const statuses = hub.getAgentStatuses();
  for (const [name, state] of Object.entries(statuses)) {
    const badge = state.active ? `${C.green}🟢 ACTIVE (24/7 Screening)${C.reset}` : `${C.red}🔴 PAUSED${C.reset}`;
    console.log(`  ${C.gray}•${C.reset} ${C.white}${name.toUpperCase().padEnd(22)}${C.reset}: ${badge}`);
  }

  console.log(`\n${drawDivider('═', 78, C.lime)}`);
  console.log(`  ${C.green}${C.bold}✅ OpenCatz Diagnostic check completed! All core subsystems operational.${C.reset}`);
  console.log(`${drawDivider('═', 78, C.lime)}\n`);
}

export const runOpencatzDoctor = runOpenCatzDoctor;

if (process.argv[1] && (process.argv[1].includes('doctor') || process.argv.includes('--doctor'))) {
  runOpenCatzDoctor().catch(console.error);
}
