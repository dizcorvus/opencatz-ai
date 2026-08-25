#!/usr/bin/env node

/**
 * OpenCatz AI (Multichain Edition) — Clean Uninstall CLI Entry
 * Safely stops background PM2 daemons, unlinks CLI binaries, resets database state,
 * cleans build artifacts, and purges local credentials/environment configuration.
 */

import { runCleanUninstall } from './uninstall-core.mjs';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🐾 OpenCatz AI — Clean Uninstall Options:
  --force, -f, -y, --yes   Skip all confirmation prompts & purge all
  --keep-env               Retain .env credentials configuration
  --keep-data              Retain database/ persistence directory
  --keep-modules           Retain node_modules/ dependencies folder
  --help, -h               Show this help message
`);
  process.exit(0);
}

const isForce = args.includes('--force') || args.includes('-f') || args.includes('--purge') || args.includes('-y') || args.includes('--yes') || args.includes('--all');
const keepEnv = args.includes('--keep-env');
const keepData = args.includes('--keep-data');
const keepModules = args.includes('--keep-modules');

runCleanUninstall({
  isForce,
  keepEnv,
  keepData,
  keepModules,
})
  .then((result) => {
    process.exit(result.ok || result.canceled ? 0 : 1);
  })
  .catch((err) => {
    console.error('\n❌ Fatal uninstaller error:', err);
    process.exit(1);
  });
