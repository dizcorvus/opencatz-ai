/**
 * OpenCatz AI — Clean Uninstall Core Engine
 * 
 * Safely stops background PM2 daemons, unlinks CLI binaries, resets database state,
 * cleans build artifacts, and purges local credentials/environment configuration.
 *
 * Designed with:
 * - Single-instance readline lifecycle (prevents Node.js stdin pause/hang bug on multi-prompts)
 * - Strict execution timeouts (prevents hanging on unresponsive PM2/npm child processes)
 * - Retried filesystem deletion with Windows file-lock resilience
 * - Full unit testability and non-interactive (-y / --force / non-TTY) support
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_ROOT = path.resolve(__dirname, '..');

// OpenCatz ANSI Color Palette
export const C = {
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

export const OPENCATZ_UNINSTALL_ASCII = `
${C.red}${C.bold}       /\\_____/\\
      /  ${C.pink}■${C.red}   ${C.pink}■${C.red}  \\      ${C.red}🐾 OPENCATZ AI — CLEAN UNINSTALLER 🐾${C.reset}
${C.red}     ( ==  ${C.pink}^${C.red}  == )     ${C.yellow}Autonomous Multi-Agent System Reset${C.reset}
${C.red}      )    ~    (      ${C.gray}PM2 Process Stop • Database Purge • Cache Cleanup${C.reset}
${C.red}     (   _____   )     ${C.lime}"Leaving the cat den clean and tidy."${C.reset}
${C.red}    ( (  )   (  ) )
   (__(__)___(__)__)${C.reset}
`;

/**
 * Creates a reusable prompt session so stdin is not paused prematurely.
 */
export function createPromptSession() {
  let rl = null;

  const ask = (query) => {
    if (!process.stdin.isTTY) {
      // Non-interactive fallback: auto-decline dangerous prompts unless forced
      return Promise.resolve('n');
    }
    if (!rl) {
      rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
    }
    return new Promise((resolve) => {
      rl.question(query, (answer) => {
        resolve(answer.trim());
      });
    });
  };

  const close = () => {
    if (rl) {
      rl.close();
      rl = null;
    }
  };

  return { ask, close };
}

/**
 * Safely executes a command with a strict timeout to prevent hangs.
 */
export function safeExec(command, { cwd = DEFAULT_ROOT, timeout = 5000 } = {}) {
  try {
    execSync(command, {
      cwd,
      stdio: 'ignore',
      timeout,
      windowsHide: true,
    });
    return true;
  } catch (_err) {
    return false;
  }
}

/**
 * Safely removes a file or directory with retries for Windows file locks.
 */
export function removePath(targetPath, description, { cwd = DEFAULT_ROOT, logFn = console.log } = {}) {
  const fullPath = path.isAbsolute(targetPath) ? targetPath : path.resolve(cwd, targetPath);
  if (fs.existsSync(fullPath)) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      logFn(` ${C.green}✓${C.reset} Removed ${C.bold}${targetPath}${C.reset} (${description})`);
      return true;
    } catch (err) {
      logFn(` ${C.red}✗${C.reset} Failed to remove ${targetPath}: ${err.message}`);
      return false;
    }
  } else {
    logFn(` ${C.gray}•${C.reset} ${targetPath} does not exist (skipped)`);
    return true;
  }
}

/**
 * Executes the complete clean uninstallation sequence.
 */
export async function runCleanUninstall(options = {}) {
  const {
    isForce = false,
    keepEnv = false,
    keepData = false,
    keepModules = false,
    cwd = DEFAULT_ROOT,
    promptFn = null,
    logFn = console.log,
    printBanner = true,
  } = options;

  if (printBanner) {
    logFn(OPENCATZ_UNINSTALL_ASCII);
  }

  const promptSession = promptFn ? null : createPromptSession();
  const ask = promptFn || promptSession.ask;

  try {
    logFn(` ${C.yellow}⚠ Warning: This operation will uninstall OpenCatz AI services and purge local data.${C.reset}\n`);

    // Master Confirmation
    if (!isForce) {
      const confirm = await ask(` ${C.bold}Are you sure you want to proceed with Clean Uninstall? (y/N): ${C.reset}`);
      if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
        logFn(`\n ${C.yellow}Uninstall canceled by user.${C.reset}\n`);
        return { ok: false, canceled: true };
      }
    }

    logFn(`\n${C.cyan}${C.bold}🧹 STARTING CLEAN UNINSTALLATION...${C.reset}\n`);

    // 1. PM2 Process Stop & Delete
    logFn(` ${C.bold}[1/6] Stopping & Deleting PM2 Background Daemons...${C.reset}`);
    for (const proc of ['opencatz-agent']) {
      // Attempt direct pm2 first, then npx pm2 without downloading new packages
      const stopped = safeExec(`pm2 delete ${proc}`, { cwd, timeout: 5000 }) ||
                      safeExec(`npx --no-install pm2 delete ${proc}`, { cwd, timeout: 5000 });
      if (stopped) {
        logFn(` ${C.green}✓${C.reset} PM2 process ${C.bold}${proc}${C.reset} stopped and removed.`);
      } else {
        logFn(` ${C.gray}•${C.reset} No active PM2 process named '${proc}' found.`);
      }
    }

    // 2. Global CLI Binary Unlink
    logFn(`\n ${C.bold}[2/6] Unlinking Global CLI Binaries (opencatz)...${C.reset}`);
    const unlinked = safeExec('npm unlink -g opencatz-ai opencatz', { cwd, timeout: 8000 }) ||
                     safeExec('npm unlink', { cwd, timeout: 8000 });
    if (unlinked) {
      logFn(` ${C.green}✓${C.reset} Global CLI binary unlinked.`);
    } else {
      logFn(` ${C.gray}•${C.reset} CLI binary was not linked globally or already removed.`);
    }

    // 3. Local Database & State Persistence Reset
    logFn(`\n ${C.bold}[3/6] Cleaning Local Database & State Store...${C.reset}`);
    if (keepData) {
      logFn(` ${C.yellow}• Keeping database/ directory (--keep-data specified)${C.reset}`);
    } else {
      removePath('database', 'StateStore JSON persistence & trade journal', { cwd, logFn });
      removePath('nft-scanner-test.json', 'NFT scanner test state', { cwd, logFn });
    }

    // 4. Environment File Cleanup (.env)
    logFn(`\n ${C.bold}[4/6] Cleaning Credentials & Environment Configuration...${C.reset}`);
    if (keepEnv) {
      logFn(` ${C.yellow}• Keeping .env file (--keep-env specified)${C.reset}`);
    } else {
      let removeEnv = isForce;
      if (!isForce) {
        const ans = await ask(`   Delete local ${C.bold}.env${C.reset} credentials file? (y/N): `);
        removeEnv = ans.toLowerCase() === 'y' || ans.toLowerCase() === 'yes';
      }
      if (removeEnv) {
        removePath('.env', 'Private keys, Discord tokens & API keys', { cwd, logFn });
        removePath('.env.bak', 'Backup environment file', { cwd, logFn });
        removePath('.gmgn_rsa_private.pem', 'GMGN RSA private key', { cwd, logFn });
      } else {
        logFn(` ${C.gray}• Retained .env configuration file.${C.reset}`);
      }
    }

    // 5. Build Artifacts & Logs Cleanup
    logFn(`\n ${C.bold}[5/6] Cleaning Build Artifacts, Strategies Cache & Logs...${C.reset}`);
    removePath('dist', 'Compiled TypeScript JavaScript output', { cwd, logFn });
    removePath('.tmp', 'Temporary file cache', { cwd, logFn });
    removePath('logs', 'Application log files', { cwd, logFn });
    removePath('opencatz.log', 'Console process log', { cwd, logFn });
    removePath('pm2-error.log', 'PM2 error log', { cwd, logFn });
    removePath('pm2-out.log', 'PM2 output log', { cwd, logFn });
    removePath('pino.log', 'Pino telemetry log', { cwd, logFn });
    removePath('strategies/.active.json', 'Strategy active state map', { cwd, logFn });

    // 6. Node Modules Cleanup (Dependencies)
    logFn(`\n ${C.bold}[6/6] Dependencies Cleanup...${C.reset}`);
    if (keepModules) {
      logFn(` ${C.yellow}• Keeping node_modules/ (--keep-modules specified)${C.reset}`);
    } else {
      let removeDeps = isForce;
      if (!isForce) {
        const ans = await ask(`   Delete ${C.bold}node_modules/${C.reset} folder to free disk space? (y/N): `);
        removeDeps = ans.toLowerCase() === 'y' || ans.toLowerCase() === 'yes';
      }
      if (removeDeps) {
        removePath('node_modules', 'Installed npm packages', { cwd, logFn });
      } else {
        logFn(` ${C.gray}• Retained node_modules/ directory.${C.reset}`);
      }
    }

    logFn(`
${C.green}${C.bold}=======================================================${C.reset}
${C.green}${C.bold}  ✅ OPENCATZ CLEAN UNINSTALL COMPLETED SUCCESSFULLY!  ${C.reset}
${C.green}${C.bold}=======================================================${C.reset}
   OpenCatz background daemons have been stopped, global
   CLI links removed, and cache/state files safely wiped.
`);

    return { ok: true, canceled: false };
  } finally {
    if (promptSession) {
      promptSession.close();
    }
  }
}
