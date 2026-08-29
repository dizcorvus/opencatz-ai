/**
 * OpenCatz AI - Precision TrueColor (24-bit RGB) ANSI Terminal Design System
 * 1:1 Alignment with OpenCatz Web and Discord Brand Aesthetic (DESIGN.md)
 */

export const THEME = {
  // Text Styles
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',

  // Master 24-bit RGB Palette from DESIGN.md
  heroLime: '\x1b[38;2;204;255;0m',      // #CCFF00 Robinhood Green (Hero Brand)
  lime: '\x1b[38;2;204;255;0m',          // #CCFF00
  pastelPink: '\x1b[38;2;255;183;178m',  // #FFB7B2 Pastel Pink (Meme / Cute)
  pink: '\x1b[38;2;255;183;178m',        // #FFB7B2
  lavender: '\x1b[38;2;214;199;255m',    // #D6C7FF Lavender Purple (NFT / VIP)
  retroCyan: '\x1b[38;2;128;222;234m',   // #80DEEA Retro Cyan (LP / Dex)
  cyan: '\x1b[38;2;128;222;234m',        // #80DEEA
  pastelYellow: '\x1b[38;2;255;245;157m',// #FFF59D Pastel Yellow (CT Alpha)
  yellow: '\x1b[38;2;255;245;157m',      // #FFF59D
  gold: '\x1b[38;2;255;215;0m',          // #FFD700 Golden Fortune 24K (VIP / PnL)
  jadeGreen: '\x1b[38;2;0;230;118m',     // #00E676 Jade Spirit Green (Solana / Win)
  green: '\x1b[38;2;0;230;118m',         // #00E676
  manekiRed: '\x1b[38;2;229;57;53m',     // #E53935 Maneki-Neko Red (Alert / 9-Lives)
  red: '\x1b[38;2;229;57;53m',           // #E53935
  denimBlue: '\x1b[38;2;2;119;189m',     // #0277BD Denim Blue (Whales / Base)
  blue: '\x1b[38;2;2;119;189m',          // #0277BD
  polyCyan: '\x1b[38;2;0;229;255m',      // #00E5FF Prediction Cyan (Polymarket)
  royalViolet: '\x1b[38;2;123;31;162m',  // #7B1FA2 Royal Violet (Strategy)

  // Grays & Neutrals
  white: '\x1b[38;2;240;244;248m',       // #F0F4F8 Soft Crisp White
  gray: '\x1b[38;2;120;144;156m',        // #78909C Slate Gray
  darkGray: '\x1b[38;2;60;72;88m',       // #3C4858 Dark Border Gray
  obsidian: '\x1b[38;2;11;14;20m',       // #0B0E14 Obsidian Base
};

// Aliases for quick access
export const C = THEME;

/**
 * Returns a pixel-precise, perfectly aligned OpenCatz Mascot Banner with TrueColor RGB styling.
 */
export function getOpenCatzHeaderBanner(tagline = 'Autonomous Agentic AI Crypto Intelligence (7 Chains)'): string {
  const { lime, white, lavender, cyan, gold, green, gray, bold, reset } = THEME;

  const lines = [
    `${lime}${bold}   ▄▀▄    ▄▀▄                                              ${reset}`,
    `${lime}${bold}  █   ▀▀▀▀   █    ${white}▄▄▄▄  ▄▄▄▄▄ ▄   ▄  ▄▄▄▄  ▄▄▄  ▄▄▄▄▄ ▄▄▄▄▄${reset}`,
    `${lime}${bold}  █  ▄▄  ▄▄  █    ${white}█▄▄▄▀ █▄▄▄  █▀▄ █ █     █▄▄▄█   █     ▄▀ ${reset}`,
    `${lime}${bold}▄█    ▀   ▀   █▄  ${white}█     █▄▄▄▄ █  ▀█ ▀▄▄▄▄ █   █   █   ▄█▄▄▄${reset}`,
    ``,
    `${lime}${bold}🐾 OPENCATZ AI · MULTICHAIN COMMAND CENTER (7 CHAINS) 🐾${reset}`,
    `${cyan}${tagline}${reset}`,
    `${lavender}Solana • Robinhood #4663 • Base • Ethereum • Ink • Hyperliquid • Polymarket${reset}`,
    `${green}● 24/7 Agentic AI Active${reset} ${gray}·${reset} ${gold}👑 15 Specialist AI Scouts Online${reset}`,
  ];

  return lines.join('\n');
}

/**
 * Compact standalone precision Cat Mascot (Single Box or Banner footer)
 */
export function getPrecisionCatAscii(): string {
  const { lime, bold, reset } = THEME;
  return [
    `${lime}${bold}   ▄▀▄    ▄▀▄   ${reset}`,
    `${lime}${bold}  █   ▀▀▀▀   █  ${reset}`,
    `${lime}${bold}  █  ▄▄  ▄▄  █  ${reset}`,
    `${lime}${bold}▄█    ▀   ▀   █▄${reset}`,
  ].join('\n');
}

/**
 * Formats a decorative status divider in OpenCatz retro RGB style
 */
export function drawDivider(char = '─', length = 78, color = THEME.cyan): string {
  return `${color}${char.repeat(length)}${THEME.reset}`;
}

/**
 * Formats a key-value metric item with OpenCatz RGB styling
 */
export function formatMetric(label: string, value: string, badgeColor = THEME.lime): string {
  return `  ${THEME.gray}•${THEME.reset} ${THEME.white}${label.padEnd(26)}${THEME.reset}: ${badgeColor}${THEME.bold}${value}${THEME.reset}`;
}
