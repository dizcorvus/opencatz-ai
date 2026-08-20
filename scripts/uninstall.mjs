#!/usr/bin/env node

/**
 * OpenCatz AI (Multichain Edition) — Clean Uninstall Script
 * Safely stops background PM2 daemons, unlinks CLI binaries, resets database state,
 * cleans build artifacts, and purges local credentials/environment configuration.
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const args = process.argv.slice(2);

const isForce = args.includes('--force') || args.includes('-f') || args.includes('--purge');
const keepEnv = args.includes('--keep-env');
const keepData = args.includes('--keep-data');
const keepModules = args.includes('--keep-modules');

// OpenCatz ANSI Palette
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  lime: '\x1b[38;2;204;255;0m',
  pink: '\x1b[38;2;255;183;178m',
};

const OPENCATZ_UNINSTALL_ASCII = `
${C.red}${C.bold}       /\\_____/\\
      /  ${C.pink}■${C.red}   ${C.pink}■${C.red}  \\      ${C.red}🐾 OPENCATZ AI — CLEAN UNINSTALLER 🐾${C.reset}
${C.red}     ( ==  ${C.pink}^${C.red}  == )     ${C.yellow}Autonomous Multi-Agent System Reset${C.reset}
${C.red}      )    ~    (      ${C.gray}PM2 Process Stop • Database Purge • Cache Cleanup${C.reset}
${C.red}     (   _____   )     ${C.lime}"Leaving the cat den clean and tidy."${C.reset}
${C.red}    ( (  )   (  ) )
   (__(__)___(__)__)${C.reset}
`;

console.log(OPENCATZ_UNINSTALL_ASCII);

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

function removePath(targetPath, description) {
  const fullPath = path.resolve(rootDir, targetPath);
  if (fs.existsSync(fullPath)) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(` ${C.green}✓${C.reset} Removed ${C.bold}${targetPath}${C.reset} (${description})`);
    } catch (err) {
      console.log(` ${C.red}✗${C.reset} Failed to remove ${targetPath}: ${err.message}`);
    }
  } else {
    console.log(` ${C.gray}•${C.reset} ${targetPath} does not exist (skipped)`);
  }
}

async function main() {
  console.log(` ${C.yellow}⚠ Warning: This operation will uninstall OpenCatz AI services and purge local data.${C.reset}\n`);

  if (!isForce) {
    const confirm = await askQuestion(` ${C.bold}Are you sure you want to proceed with Clean Uninstall? (y/N): ${C.reset}`);
    if (confirm.trim().toLowerCase() !== 'y' && confirm.trim().toLowerCase() !== 'yes') {
      console.log(`\n ${C.yellow}Uninstall canceled by user.${C.reset}\n`);
      process.exit(0);
    }
  }

  console.log(`\n${C.cyan}${C.bold}🧹 STARTING CLEAN UNINSTALLATION...${C.reset}\n`);

  // 1. PM2 Process Stop & Delete (both opencatz-agent and athena-agent)
  console.log(` ${C.bold}[1/6] Stopping & Deleting PM2 Background Daemons...${C.reset}`);
  for (const proc of ['opencatz-agent', 'athena-agent']) {
    try {
      execSync(`npx pm2 delete ${proc}`, { stdio: 'ignore' });
      console.log(` ${C.green}✓${C.reset} PM2 process ${C.bold}${proc}${C.reset} stopped and removed.`);
    } catch (_err) {
      console.log(` ${C.gray}•${C.reset} No active PM2 process named '${proc}' found.`);
    }
  }

  // 2. Global CLI Binary Unlink
  console.log(`\n ${C.bold}[2/6] Unlinking Global CLI Binaries (opencatz / athena)...${C.reset}`);
  try {
    execSync('npm unlink -g opencatz-ai || npm unlink', { cwd: rootDir, stdio: 'ignore' });
    console.log(` ${C.green}✓${C.reset} Global CLI binary unlinked.`);
  } catch (_err) {
    console.log(` ${C.gray}•${C.reset} CLI binary was not linked globally or already removed.`);
  }

  // 3. Local Database & State Persistence Reset
  console.log(`\n ${C.bold}[3/6] Cleaning Local Database & State Store...${C.reset}`);
  if (keepData) {
    console.log(` ${C.yellow}• Keeping database/ directory (--keep-data specified)${C.reset}`);
  } else {
    removePath('database', 'StateStore JSON persistence & trade journal');
    removePath('nft-scanner-test.json', 'NFT scanner test state');
  }

  // 4. Environment File Cleanup (.env)
  console.log(`\n ${C.bold}[4/6] Cleaning Credentials & Environment Configuration...${C.reset}`);
  if (keepEnv) {
    console.log(` ${C.yellow}• Keeping .env file (--keep-env specified)${C.reset}`);
  } else {
    let removeEnv = isForce;
    if (!isForce) {
      const ans = await askQuestion(`   Delete local ${C.bold}.env${C.reset} credentials file? (y/N): `);
      removeEnv = ans.trim().toLowerCase() === 'y' || ans.trim().toLowerCase() === 'yes';
    }
    if (removeEnv) {
      removePath('.env', 'Private keys, Discord tokens & API keys');
      removePath('.env.bak', 'Backup environment file');
    } else {
      console.log(` ${C.gray}• Retained .env configuration file.${C.reset}`);
    }
  }

  // 5. Build Artifacts & Logs Cleanup
  console.log(`\n ${C.bold}[5/6] Cleaning Build Artifacts, Strategies Cache & Logs...${C.reset}`);
  removePath('dist', 'Compiled TypeScript JavaScript output');
  removePath('.tmp', 'Temporary file cache');
  removePath('logs', 'Application log files');
  removePath('opencatz.log', 'Console process log');
  removePath('athena.log', 'Console process log');
  removePath('pm2-error.log', 'PM2 error log');
  removePath('pm2-out.log', 'PM2 output log');
  removePath('pino.log', 'Pino telemetry log');
  removePath('strategies/.active.json', 'Strategy active state map');

  // 6. Node Modules Cleanup (Dependencies)
  console.log(`\n ${C.bold}[6/6] Dependencies Cleanup...${C.reset}`);
  if (keepModules) {
    console.log(` ${C.yellow}• Keeping node_modules/ (--keep-modules specified)${C.reset}`);
  } else {
    let removeDeps = isForce;
    if (!isForce) {
      const ans = await askQuestion(`   Delete ${C.bold}node_modules/${C.reset} folder to free disk space? (y/N): `);
      removeDeps = ans.trim().toLowerCase() === 'y' || ans.trim().toLowerCase() === 'yes';
    }
    if (removeDeps) {
      removePath('node_modules', 'Installed npm packages');
    } else {
      console.log(` ${C.gray}• Retained node_modules/ directory.${C.reset}`);
    }
  }

  console.log(`
${C.green}${C.bold}=======================================================${C.reset}
${C.green}${C.bold}  ✅ OPENCATZ CLEAN UNINSTALL COMPLETED SUCCESSFULLY!  ${C.reset}
${C.green}${C.bold}=======================================================${C.reset}
   OpenCatz background daemons have been stopped, global
   CLI links removed, and cache/state files safely wiped.
`);
}

main().catch((err) => {
  console.error(`\n${C.red}❌ Uninstall process error:${C.reset}`, err);
  process.exit(1);
});
