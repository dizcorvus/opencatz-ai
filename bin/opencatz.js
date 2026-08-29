#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const args = process.argv.slice(2);
const subCommand = (args[0] || 'help').toLowerCase();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// TrueColor 24-bit RGB Color Tokens matching DESIGN.md
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  lime: '\x1b[38;2;204;255;0m',      // #CCFF00 Robinhood Green (Hero Brand)
  pink: '\x1b[38;2;255;183;178m',    // #FFB7B2 Pastel Pink
  lavender: '\x1b[38;2;214;199;255m',// #D6C7FF Lavender Purple
  cyan: '\x1b[38;2;128;222;234m',    // #80DEEA Retro Cyan
  yellow: '\x1b[38;2;255;245;157m',  // #FFF59D Pastel Yellow
  gold: '\x1b[38;2;255;215;0m',      // #FFD700 Golden Fortune 24K
  green: '\x1b[38;2;0;230;118m',     // #00E676 Jade Spirit Green
  red: '\x1b[38;2;229;57;53m',       // #E53935 Maneki-Neko Red
  blue: '\x1b[38;2;2;119;189m',      // #0277BD Denim Blue
  white: '\x1b[38;2;240;244;248m',   // #F0F4F8 Soft Crisp White
  gray: '\x1b[38;2;120;144;156m',    // #78909C Slate Gray
  darkGray: '\x1b[38;2;60;72;88m',   // #3C4858 Dark Border Gray
};

console.log(`
${C.lime}${C.bold}   ▄▀▄    ▄▀▄                                              ${C.reset}
${C.lime}${C.bold}  █   ▀▀▀▀   █    ${C.white}▄▄▄▄  ▄▄▄▄▄ ▄   ▄  ▄▄▄▄  ▄▄▄  ▄▄▄▄▄ ▄▄▄▄▄${C.reset}
${C.lime}${C.bold}  █  ▄▄  ▄▄  █    ${C.white}█▄▄▄▀ █▄▄▄  █▀▄ █ █     █▄▄▄█   █     ▄▀ ${C.reset}
${C.lime}${C.bold}▄█    ▀   ▀   █▄  ${C.white}█     █▄▄▄▄ █  ▀█ ▀▄▄▄▄ █   █   █   ▄█▄▄▄${C.reset}

${C.lime}${C.bold}🐾 OPENCATZ AI · MULTICHAIN MASTER CLI (7 CHAINS) 🐾${C.reset}
${C.cyan}Autonomous Agentic AI Crypto Intelligence (15 Specialist Scouts)${C.reset}
${C.lavender}Solana • Robinhood #4663 • Base • Ethereum • Ink • Hyperliquid • Polymarket${C.reset}
${C.green}● 24/7 Agentic AI Active${C.reset} ${C.gray}·${C.reset} ${C.gold}👑 15 Specialist AI Scouts Online${C.reset}
`);

function runCommand(command, cmdArgs) {
  const child = spawn(command, cmdArgs, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

switch (subCommand) {
  case 'run':
  case 'dev':
  case 'start':
    console.log(`${C.lime}🚀 Launching OpenCatz Multi-Agent Engine in Development Mode...${C.reset}\n`);
    runCommand('npx', ['tsx', 'watch', 'src/index.ts']);
    break;

  case 'onboard':
  case 'wizard':
  case 'setup':
  case 'config':
    console.log(`${C.pink}🧙‍♂️ Launching OpenCatz Interactive Onboarding Wizard...${C.reset}\n`);
    runCommand('node', ['scripts/wizard.js']);
    break;

  case 'terminal':
  case 'tui':
    console.log(`${C.cyan}🐾 Launching OpenCatz Interactive Command Center TUI...${C.reset}\n`);
    runCommand('npx', ['tsx', 'src/cli/tui.ts']);
    break;

  case 'deploy':
  case 'pm2':
    console.log(`${C.lime}🌐 Deploying OpenCatz 24/7 Background Process via PM2...${C.reset}\n`);
    runCommand('npm', ['run', 'deploy']);
    break;

  case 'test':
    console.log(`${C.lavender}🧪 Running OpenCatz Automated Test Suite...${C.reset}\n`);
    runCommand('npx', ['vitest', 'run']);
    break;

  case 'build':
    console.log(`${C.yellow}⚙️ Compiling OpenCatz TypeScript Codebase...${C.reset}\n`);
    runCommand('npx', ['tsc']);
    break;

  case 'update':
    console.log(`${C.cyan}🔄 Pulling latest updates from Git & re-building...${C.reset}\n`);
    runCommand('npm', ['run', 'update']);
    break;

  case 'doctor':
  case 'check':
    console.log(`${C.green}🩺 Running OpenCatz Diagnostic Doctor...${C.reset}\n`);
    runCommand('npx', ['tsx', 'src/cli/doctor.ts']);
    break;

  case 'uninstall':
  case 'purge':
  case 'clean-all':
    console.log(`${C.red}🧹 Launching OpenCatz Clean Uninstaller...${C.reset}\n`);
    runCommand('node', ['scripts/uninstall.mjs', ...args.slice(1)]);
    break;

  case 'help':
  case '--help':
  case '-h':
  default:
    console.log(`
🐾 ${C.lime}${C.bold}OPENCATZ AI CLI — COMMAND CHEATSHEET:${C.reset}

  ${C.cyan}${C.bold}opencatz run${C.reset}          🚀 Start bot in live development mode (tsx watch)
  ${C.pink}${C.bold}opencatz onboard${C.reset}      🧙‍♂️ Launch interactive setup wizard (.env & keys)
  ${C.cyan}${C.bold}opencatz terminal${C.reset}     🐾 Open standalone Terminal TUI dashboard
  ${C.lime}${C.bold}opencatz deploy${C.reset}       🌐 Deploy 24/7 background process via PM2
  ${C.lavender}${C.bold}opencatz test${C.reset}         🧪 Run Vitest automated test suite
  ${C.yellow}${C.bold}opencatz build${C.reset}        ⚙️ Compile TypeScript to /dist
  ${C.cyan}${C.bold}opencatz update${C.reset}       🔄 Git pull, rebuild, and hot-restart daemon
  ${C.green}${C.bold}opencatz doctor${C.reset}       🩺 Check API keys, network RPCs, and diagnostics
  ${C.red}${C.bold}opencatz uninstall${C.reset}    🧹 Cleanly remove PM2 process, build artifacts, & DB

For complete documentation, visit: ${C.gold}https://opencatz.xyz/docs${C.reset}
`);
    process.exit(0);
}
