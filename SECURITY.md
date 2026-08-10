# Security Policy & Vulnerability Reporting — Athena AI

The **Athena AI** team takes code integrity, wallet security, and API credential safety very seriously. This document outlines our security policies, supported versions, and private vulnerability reporting procedures.

---

## Supported Versions

Only the latest release on the `master` branch is actively supported with security updates and bug fixes.

| Version / Branch | Supported          | Security Maintenance |
| ---------------- | ------------------ | -------------------- |
| `master` (v1.0+) | :white_check_mark: | Active               |
| `< 1.0`          :x:                 | End of Life          |

---

## Core Security Architectural Guarantees

1. **Dry-Run by Default (`DRY_RUN=true`)**:
   Athena defaults to realistic simulation mode. Live transactions are never broadcast to any blockchain unless `DRY_RUN=false` and `AUTO_EXECUTE_ENABLED=true` are explicitly set.

2. **Isolated Burner Wallets**:
   Live trading agents MUST use dedicated burner wallets with capped funds. Never connect your primary treasury or cold storage wallets to autonomous execution agents.

3. **Sandboxed Strategy Execution**:
   User and LLM-authored strategy `.mjs` modules run within a sanitized context (`process.env` scrubbed) to prevent untrusted code from reading wallet private keys or API tokens.

4. **Sanitized Input & Injection Hardening**:
   All dynamic token names, symbols, and tweets are sanitized before rendering in Discord/Telegram embeds. Administrative tools like `set_api_key` operate on strict allowlists.

5. **Automated Dependabot Security**:
   Dependencies are continuously audited for vulnerabilities. Overrides are enforced in `package.json` to ensure zero vulnerable packages in production builds.

---

## Reporting a Vulnerability

If you discover a potential security vulnerability or credential leak in this codebase, **DO NOT** open a public GitHub issue.

Please report the vulnerability privately directly to the project maintainer:

- **Email:** `dizcorvus@gmail.com`
- **Telegram / Discord Direct Message:** Contact `@dizcorvus` directly in the Parthenon Control Room.

### What to Include in Your Report:
- Detailed description of the vulnerability and potential impact.
- Step-by-step proof-of-concept (PoC) to reproduce the issue safely.
- Affected components or files (e.g., wallet adapters, strategy sandbox, RPC failover).

### Response Timeline:
- **Acknowledgement:** Within 24–48 hours.
- **Triage & Patch:** Critical vulnerabilities will be patched within 72 hours via private hotfix.
