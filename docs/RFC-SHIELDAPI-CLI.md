# RFC-001: ShieldAPI CLI

| Field    | Value                          |
|----------|--------------------------------|
| Status   | **Draft**                      |
| Author   | Atlas (AI Architect)           |
| Created  | 2026-02-26                     |
| Updated  | 2026-02-26                     |
| Requires | Node.js ≥18, Base Mainnet USDC |

---

## Summary

This RFC specifies `@vainplex/shieldapi-cli` — a Node.js command-line tool that exposes the ShieldAPI x402 Security Intelligence Service to terminals, scripts, and AI agents. The CLI accepts human-readable inputs (passwords, emails, domains, IPs, URLs), handles SHA-1 hashing client-side, manages x402 USDC micropayments transparently, and produces both human-readable and machine-parseable output. It is the first public x402-powered CLI tool and serves as the reference implementation for CLI-based x402 consumption.

---

## Motivation

### Problem

Security intelligence checks (breach lookups, domain reputation, IP reputation, URL safety) are fragmented across dozens of services, each with its own API key, subscription, and SDK. AI agents operating autonomously need a single, predictable interface that works without accounts, API keys, or subscriptions — just a wallet with USDC.

### Why now

1. **ShieldAPI is live.** The server at `https://shield.vainplex.dev` is deployed and accepting real USDC payments on Base Mainnet via x402.
2. **x402 has no CLI tooling.** Every x402 demo so far is a library or web app. A CLI proves x402 works end-to-end in the most constrained interface: a terminal.
3. **AI agents need CLIs.** LLMs with tool-use (OpenAI function calling, Claude tool use, MCP) prefer structured CLI output over web scraping. A well-designed CLI with JSON output and meaningful exit codes becomes an agent tool automatically.

### What this enables

- `npx @vainplex/shieldapi-cli password hunter2` — instant breach check, no signup
- CI/CD pipelines that fail on compromised credentials
- AI agents that autonomously check security posture
- The first "npm install, run, pay with crypto" developer experience

---

## Terminology

Key words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are used per [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt).

---

## Requirements

### FR — Functional Requirements

#### FR-1: Commands

| ID     | Requirement | Priority |
|--------|-------------|----------|
| FR-1.1 | The CLI MUST provide a `password <password>` command that SHA-1 hashes the input client-side and sends the hash to `/api/check-password`. | MUST |
| FR-1.2 | The CLI MUST provide an `email <address>` command that queries `/api/check-email`. | MUST |
| FR-1.3 | The CLI MUST provide a `domain <domain>` command that queries `/api/check-domain`. | MUST |
| FR-1.4 | The CLI MUST provide an `ip <address>` command that queries `/api/check-ip`. | MUST |
| FR-1.5 | The CLI MUST provide a `url <url>` command that queries `/api/check-url`. | MUST |
| FR-1.6 | The CLI MUST provide a `scan` command that queries `/api/full-scan` with any combination of `--email`, `--password`, `--domain`, `--ip`, `--url`. | MUST |
| FR-1.7 | The CLI MUST provide a `health` command that queries `/api/health` (free, no wallet). | MUST |
| FR-1.8 | The CLI SHOULD provide a `hash <password>` command that computes and prints the SHA-1 hash locally without any API call. | SHOULD |
| FR-1.9 | The CLI MAY provide a `wallet` command group for wallet-related utilities (balance check, address display). | MAY |

#### FR-2: Global Flags

| ID     | Requirement | Priority |
|--------|-------------|----------|
| FR-2.1 | The CLI MUST accept `--wallet <private-key>` to specify the payment wallet. | MUST |
| FR-2.2 | The CLI MUST accept `SHIELDAPI_WALLET_KEY` environment variable as an alternative to `--wallet`. | MUST |
| FR-2.3 | The CLI MUST accept `--json` to output raw JSON instead of formatted output. | MUST |
| FR-2.4 | The CLI MUST accept `--no-color` to disable ANSI color codes. | MUST |
| FR-2.5 | Every paid command MUST accept `--demo` to use demo mode (free, no wallet required). | MUST |
| FR-2.6 | The CLI SHOULD accept `--api-url <url>` to override the default API base URL. | SHOULD |
| FR-2.7 | The CLI SHOULD accept `--yes` / `-y` to skip payment confirmation prompts. | SHOULD |
| FR-2.8 | The CLI SHOULD accept `--quiet` / `-q` to suppress all output except the result (no spinners, no cost warnings). | SHOULD |

#### FR-3: Input Handling

| ID     | Requirement | Priority |
|--------|-------------|----------|
| FR-3.1 | The `password` command MUST accept the password as a positional argument. | MUST |
| FR-3.2 | The `password` command SHOULD accept `--stdin` to read the password from stdin (for piping, avoiding shell history). | SHOULD |
| FR-3.3 | The `password` command SHOULD accept `--hash` to pass a pre-computed SHA-1 hash instead of a plaintext password. | SHOULD |
| FR-3.4 | The `scan` command SHOULD accept `--file <path>` to read targets from a JSON or newline-delimited file. | SHOULD |
| FR-3.5 | The `scan` command SHOULD accept stdin pipe for targets (one per line, auto-detected type). | SHOULD |

#### FR-4: Output

| ID     | Requirement | Priority |
|--------|-------------|----------|
| FR-4.1 | Default output MUST be human-readable with color-coded risk levels. | MUST |
| FR-4.2 | `--json` MUST output valid JSON to stdout with no other content on stdout. | MUST |
| FR-4.3 | Spinners, progress indicators, and informational messages MUST be written to stderr, not stdout. | MUST |
| FR-4.4 | Risk levels MUST be visualized with consistent color coding: critical=red bg, high=red, medium=yellow, low=green, safe=green dim. | MUST |
| FR-4.5 | The CLI SHOULD show the cost of a request before executing it (on stderr), unless `--yes` or `--quiet` is set. | SHOULD |
| FR-4.6 | The CLI MAY support `--csv` output format for tabular data. | MAY |

#### FR-5: Exit Codes

| ID     | Requirement | Priority |
|--------|-------------|----------|
| FR-5.1 | Exit code 0 MUST indicate the check completed and no risk was found (safe / low). | MUST |
| FR-5.2 | Exit code 1 MUST indicate the check completed and risk was found (medium / high / critical). | MUST |
| FR-5.3 | Exit code 2 MUST indicate a CLI usage error (invalid arguments, missing required flags). | MUST |
| FR-5.4 | Exit code 3 MUST indicate a network or API error (unreachable, timeout, 5xx). | MUST |
| FR-5.5 | Exit code 4 MUST indicate a payment error (insufficient balance, wallet error, x402 failure). | MUST |

### SR — Security Requirements

| ID     | Requirement | Priority |
|--------|-------------|----------|
| SR-1   | The CLI MUST NEVER persist private keys to disk (no config files, no logs, no temp files). | MUST |
| SR-2   | The CLI MUST NEVER display private keys in output, error messages, or debug logs. | MUST |
| SR-3   | The CLI MUST NEVER log private keys or wallet mnemonics to any log file or telemetry. | MUST |
| SR-4   | Passwords MUST be SHA-1 hashed client-side before any network request is made. Plaintext passwords MUST NEVER leave the local process. | MUST |
| SR-5   | When a password is passed as a CLI argument, the CLI SHOULD warn on stderr that it may appear in shell history, and recommend `--stdin` mode. | SHOULD |
| SR-6   | The CLI MUST validate all user input before making API requests (email format, IP format, URL format, domain format, hash length). | MUST |
| SR-7   | The CLI MUST use HTTPS exclusively for all API communication. | MUST |
| SR-8   | The CLI MUST NOT include any telemetry, analytics, or phone-home functionality. | MUST |
| SR-9   | The `--wallet` flag value SHOULD be redacted in any error context or stack trace. | SHOULD |

### UX — User Experience Requirements

| ID     | Requirement | Priority |
|--------|-------------|----------|
| UX-1   | First run without arguments MUST display help text with usage examples. | MUST |
| UX-2   | The CLI MUST show a spinner during API requests (on stderr). | MUST |
| UX-3   | Error messages MUST be actionable: tell the user what went wrong and what to do about it. | MUST |
| UX-4   | The CLI MUST work via `npx @vainplex/shieldapi-cli` without prior installation. | MUST |
| UX-5   | Demo mode MUST work without any wallet configuration (zero-setup first experience). | MUST |
| UX-6   | The CLI SHOULD display a cost summary before the first paid request in a session, unless `--yes` is set. | SHOULD |
| UX-7   | The CLI SHOULD detect when running in a non-interactive terminal (CI) and automatically suppress prompts and spinners. | SHOULD |
| UX-8   | The CLI SHOULD include a concise `--help` for each subcommand with at least one example. | SHOULD |

### IR — Integration Requirements

| ID     | Requirement | Priority |
|--------|-------------|----------|
| IR-1   | The CLI MUST use `@x402/fetch` for all paid API requests. | MUST |
| IR-2   | The CLI MUST be published to npm as `@vainplex/shieldapi-cli` with the `shieldapi` binary name. | MUST |
| IR-3   | The CLI MUST support Node.js ≥18 (matching npm `engines` field). | MUST |
| IR-4   | The CLI SHOULD include a GitHub Actions workflow for automated npm publishing on tagged releases. | SHOULD |
| IR-5   | The CLI SHOULD include a GitHub Actions workflow for CI (lint + test) on every push and PR. | SHOULD |
| IR-6   | The CLI MAY support being imported as a library (`import { checkPassword } from '@vainplex/shieldapi-cli'`) for programmatic use. | MAY |

### PR — Performance Requirements

| ID     | Requirement | Priority |
|--------|-------------|----------|
| PR-1   | CLI startup time (to first output) MUST be under 500ms for help/version commands. | MUST |
| PR-2   | Paid dependencies (`@x402/fetch`, `ethers`) MUST be dynamically imported only when a paid request is made (lazy loading). | MUST |
| PR-3   | The `hash` command (if implemented) MUST complete in under 10ms for any input. | MUST |
| PR-4   | The CLI SHOULD display output within 100ms of receiving the API response. | SHOULD |

---

## Non-Goals

This RFC explicitly excludes the following:

1. **Wallet creation or management.** The CLI does not generate wallets, manage seed phrases, or handle USDC procurement. Users bring their own wallet. Documentation will link to wallet setup guides.
2. **Persistent configuration files.** No `~/.shieldapirc` or XDG config. All configuration is via flags or environment variables. This avoids accidentally persisting private keys. (Revisitable in a future RFC if demand exists for non-sensitive config like `--api-url`.)
3. **Plugin or extension architecture.** No third-party command registration. The CLI ships as a single coherent tool. Extension happens at the API level (new server endpoints), not the CLI level.
4. **Caching of API responses.** Every request hits the API fresh. Caching introduces staleness for security data, which is unacceptable.
5. **Multi-wallet or wallet switching.** One wallet per invocation. Use different env vars or flags for different wallets.
6. **Interactive TUI.** No menus, no cursor-based navigation. Strictly command → output.
7. **Batch processing with parallelism.** File/stdin input is processed sequentially. Parallelism adds complexity without matching the cost model (each request costs money; users should see each cost).

---

## Open Questions

| #  | Question | Proposed Answer | Status |
|----|----------|-----------------|--------|
| Q1 | Should `--yes` be the default in non-interactive terminals (CI)? | Yes — detect `!process.stdout.isTTY` and skip prompts automatically. `--yes` exists for explicit override in interactive mode. | Proposed |
| Q2 | Should the CLI support reading private keys from a file (e.g., `--wallet-file ./key.txt`)? | No — this encourages storing keys in files. Keep to env var or flag. | Proposed |
| Q3 | Should `shieldapi wallet balance` exist to check USDC balance? | Defer to v2. Low effort but expands scope. Document manual etherscan check. | Proposed |
| Q4 | Should there be a `--cost` flag that shows cost without executing? | Nice-to-have but the health endpoint already shows costs. Defer. | Proposed |
| Q5 | Should rate limit headers from the server be exposed to the user? | Yes, on 429 errors: show retry-after value in error message. | Proposed |
| Q6 | Should `scan --file` auto-detect target types (email vs domain vs IP)? | Yes — regex-based detection: email has `@`, IP matches `\d+\.\d+\.\d+\.\d+`, URL starts with `http`, else domain. | Proposed |

---

## Appendix A: Command Reference (Normative)

```
shieldapi <command> [options]

Commands:
  password <password>   Check password against breach databases
  email <address>       Check email for known breaches
  domain <domain>       Check domain reputation
  ip <address>          Check IP reputation
  url <url>             Check URL safety
  scan [options]        Full security scan (multiple targets)
  health                Check API health and pricing
  hash <password>       Compute SHA-1 hash locally (offline)

Global Options:
  --wallet <key>        Private key for x402 payments (or SHIELDAPI_WALLET_KEY env)
  --json                Output raw JSON
  --no-color            Disable ANSI colors
  --yes, -y             Skip payment confirmation
  --quiet, -q           Suppress non-essential output
  --api-url <url>       Override API base URL
  --version, -V         Show version
  --help, -h            Show help

Password Options:
  --stdin               Read password from stdin
  --hash                Treat input as pre-computed SHA-1 hash

Scan Options:
  --email <email>       Email to include
  --password <pass>     Password to include (hashed locally)
  --domain <domain>     Domain to include
  --ip <ip>             IP to include
  --url <url>           URL to include
  --file <path>         Read targets from file
  --demo                Use demo mode (free)
```

## Appendix B: Exit Code Reference (Normative)

| Code | Meaning | Example |
|------|---------|---------|
| 0    | Check completed, safe / low risk | Password not found in breaches |
| 1    | Check completed, risk found (medium/high/critical) | Password found in 10M+ breaches |
| 2    | Usage error | Missing required argument |
| 3    | Network / API error | API unreachable, 500, timeout |
| 4    | Payment error | Insufficient USDC, invalid key, x402 failure |

## Appendix C: Cost Table (Informative)

| Command | Endpoint | Cost (USDC) |
|---------|----------|-------------|
| `password` | `check-password` | $0.001 |
| `email` | `check-email` | $0.005 |
| `domain` | `check-domain` | $0.003 |
| `ip` | `check-ip` | $0.002 |
| `url` | `check-url` | $0.003 |
| `scan` | `full-scan` | $0.01 |
| `health` | `health` | Free |
| `hash` | (local) | Free |

---

*End of RFC-001.*
