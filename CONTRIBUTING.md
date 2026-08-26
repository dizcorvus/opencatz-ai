# Contributing to OpenCatz AI (Multichain Edition)

Thank you for your interest in contributing to **OpenCatz AI**! We welcome open-source contributions from developers, quants, researchers, and the Web3 community to help build the most intelligent autonomous multi-agent crypto ecosystem.

---

## 🌟 How You Can Contribute

- 🚀 **Add New Sub-Agents & Chains:** Implement new screening scouts for emerging blockchains or protocols.
- 💧 **Build Web3 Adapters:** Integrate new DEX aggregators, AMMs, or liquidity protocols.
- 🛡️ **Improve Risk & Security:** Enhance honeypot detection, rug-check algorithms, and MEV guards.
- 🧠 **Strategy Modules:** Contribute custom strategy filters and indicator models.
- 📖 **Documentation & Tests:** Improve documentation, fix typos, or add unit and integration test coverage.

---

## 🚀 Getting Started

### 1. Fork & Clone
```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork locally
git clone https://github.com/<your-username>/opencatz-ai.git
cd opencatz-ai

# 3. Add upstream remote
git remote add upstream https://github.com/dizcorvus/opencatz-ai.git
```

### 2. Environment Setup
```bash
# 1. Install dependencies
npm install

# 2. Setup your local environment
cp .env.example .env

# Or run the interactive setup wizard:
npm run onboard
```

> [!TIP]
> Keep `DRY_RUN=true` in your `.env` during development so all orders and signals are simulated without spending real funds.

---

## 🛠️ Development Guidelines

### Branching Standard
- `feat/feature-name` — New feature, AI scout, or adapter
- `fix/bug-description` — Bug fix or patch
- `docs/topic-name` — Documentation improvements
- `refactor/area-name` — Code restructuring or performance optimization

### Code Quality & Standards
1. **Strict TypeScript:** Maintain strict typing. Define explicit interfaces for signals, events, and API payloads.
2. **Fail-Closed Security:** External API failures must resolve gracefully to `null` or `[]` — an API timeout must never crash background processes or falsely trigger trading signals.
3. **Token & Cost Efficiency:** Reserve LLM reasoning calls strictly for high-value tasks. Use deterministic code for screening, security checks, and indicator calculations.
4. **English UI Copy:** All user-facing logs, Discord embeds, TUI text, and slash command responses MUST be in clean, professional English.

---

## 🧪 Pre-Submission Checklist

Before creating a Pull Request, verify that your changes build and pass all automated tests:

```bash
# 1. Check script syntax
node --check scripts/wizard.js
node --check scripts/update-core.mjs
node --check scripts/uninstall-core.mjs

# 2. Verify strict TypeScript build
npm run build

# 3. Run automated test suite
npm test
```

---

## 📬 Submitting a Pull Request (PR)

1. Commit your changes with clear, descriptive commit messages.
2. Push your feature branch to your fork:
   ```bash
   git push origin feat/your-feature-name
   ```
3. Open a Pull Request on GitHub targeting the `master` branch.
4. Describe your changes, the motivation behind them, and how they were tested.
5. Our team will review your PR and provide feedback promptly!

---

## 📜 Code of Conduct

All contributors are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md) to ensure a welcoming and inclusive community.
