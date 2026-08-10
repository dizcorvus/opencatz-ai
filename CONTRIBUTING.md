# Contributing Guidelines — Athena AI (Collaborator / Invite-Only)

Thank you for your interest in **Athena AI (Premium Multichain Edition)**!

> [!IMPORTANT]
> **INVITE-ONLY & COLLABORATOR CONTRIBUTION MODEL**  
> Direct contributions, pull requests, and branch merges to this repository are **strictly managed by invitation and collaborator access**. Public unsolicited Pull Requests from unverified accounts will be closed without review to maintain strict security, wallet safety, and codebase integrity.

---

## 👥 How to Become a Contributor / Collaborator

If you wish to contribute features, improve sub-agent adapters, or work on strategy modules:

1. **Request Collaborator Access:** Contact the core maintainer `@dizcorvus` (via Email: `dizcorvus@gmail.com` or Discord/Telegram).
2. **Collaborator Invitation:** Once verified, you will receive an invitation to join as a repository collaborator.
3. **Assigned Tasks:** Invited collaborators will be assigned specific feature branches or GitHub Issues.

---

## 🛠️ Development & Coding Standards for Collaborators

Collaborators working on Athena must adhere to the following standards:

### 1. Environment & Setup
- **Node.js Requirement:** Node.js `>= 22.12` and `npm`.
- **Environment:** Run `npm run wizard` or `athena wizard` to generate a safe local `.env`. Always keep `DRY_RUN=true` during feature development.

### 2. Branch Naming Conventions
Create feature branches from `master`:
- `feat/feature-name` — for new features, agents, or Web3 adapters.
- `fix/bug-description` — for bug fixes and patches.
- `refactor/component-name` — for code restructuring.

### 3. Code Quality & Conventions
- **Strict TypeScript:** Avoid using `any`. Define explicit interfaces for payloads, signals, and API responses.
- **Fail-Closed Security:** External API failures must resolve gracefully to `null` or `[]` — an API timeout must never crash the background process or falsely trigger a trading signal.
- **Token & Cost Efficiency:** Reserve LLM reasoning calls strictly for high-value tasks. Use deterministic code for screening, security checks, and indicator calculations.
- **English UI Copy:** All user-facing logs, Discord embeds, TUI text, and slash command responses MUST be in clean, professional English.

### 4. Verification Before Submitting PR
Before requesting a review or merging code:
```bash
# 1. Check wizard & CLI syntax
node --check scripts/wizard.js

# 2. Verify TypeScript compilation
npm run build

# 3. Run full Vitest suite (all tests MUST pass)
npm test
```

### 5. Pull Request Protocol
- Keep Pull Requests focused on a single issue or feature.
- Ensure all 42+ test suites pass cleanly.
- Tag `@dizcorvus` for final code review and merge approval.

---

Thank you for helping maintain Athena as a state-of-the-art autonomous crypto intelligence ecosystem! 🏛️
