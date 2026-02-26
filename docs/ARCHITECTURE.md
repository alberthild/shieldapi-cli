# Architecture Document: @vainplex/shieldapi-cli

| Field   | Value                |
|---------|----------------------|
| RFC     | RFC-001              |
| Author  | Atlas (AI Architect) |
| Created | 2026-02-26           |
| Updated | 2026-02-26           |
| Status  | Draft                |

---

## 1. Overview

### 1.1 System Context

```
┌─────────────────────────────────────────────────────────────┐
│                     User's Machine                          │
│                                                             │
│  ┌───────────┐    ┌──────────────────────────────────────┐  │
│  │  Terminal  │───▶│       @vainplex/shieldapi-cli        │  │
│  │  / CI/CD  │◀───│                                      │  │
│  │  / Agent  │    │  ┌─────────┐ ┌────────┐ ┌────────┐  │  │
│  └───────────┘    │  │Commander│ │Formatter│ │ Wallet │  │  │
│                   │  └────┬────┘ └────────┘ └───┬────┘  │  │
│                   │       │                     │        │  │
│                   │  ┌────▼─────────────────────▼─────┐  │  │
│                   │  │         API Client              │  │  │
│                   │  │  (plain fetch / @x402/fetch)    │  │  │
│                   │  └──────────────┬─────────────────┘  │  │
│                   └─────────────────┼────────────────────┘  │
│                                     │                       │
└─────────────────────────────────────┼───────────────────────┘
                                      │ HTTPS
                    ┌─────────────────▼───────────────────────┐
                    │     shield.vainplex.dev (dock5)          │
                    │                                          │
                    │  ┌──────────┐  ┌───────────────────┐    │
                    │  │  Traefik │─▶│  ShieldAPI Server  │    │
                    │  │  (TLS)   │  │  (Express + x402)  │    │
                    │  └──────────┘  └─────────┬─────────┘    │
                    │                          │               │
                    │              ┌────────────┼──────────┐   │
                    │              │            │          │   │
                    │         ┌────▼───┐  ┌────▼───┐  ┌───▼─┐│
                    │         │HIBP DB │  │DNS/SSL │  │ ... ││
                    │         │(SQLite)│  │Checkers│  │     ││
                    │         └────────┘  └────────┘  └─────┘│
                    └──────────────────────────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────┐
                    │     x402 Facilitator (Coinbase)          │
                    │     Base Mainnet — USDC Settlement       │
                    └──────────────────────────────────────────┘
```

### 1.2 Design Principles

1. **Security-first.** Private keys never touch disk. Passwords never leave the process unhashed.
2. **Minimal surface.** Few dependencies, lazy loading, small install footprint.
3. **Agent-friendly.** JSON output, meaningful exit codes, stderr for status, stdout for data.
4. **Progressive disclosure.** Demo mode → paid mode → power-user flags. No setup wall.
5. **Single responsibility.** The CLI is a thin client. All intelligence lives server-side.

---

## 2. Module Design

### 2.1 Module Map

```
@vainplex/shieldapi-cli
├── bin/
│   └── shieldapi.js          # Entry point (shebang + import)
├── src/
│   ├── index.js              # Program definition (Commander setup)
│   ├── commands/             # One file per command
│   │   ├── password.js       # FR-1.1
│   │   ├── email.js          # FR-1.2
│   │   ├── domain.js         # FR-1.3
│   │   ├── ip.js             # FR-1.4
│   │   ├── url.js            # FR-1.5
│   │   ├── scan.js           # FR-1.6
│   │   ├── health.js         # FR-1.7
│   │   └── hash.js           # FR-1.8
│   ├── lib/
│   │   ├── api.js            # API client (fetch + x402)
│   │   ├── wallet.js         # Wallet resolution
│   │   ├── formatter.js      # Human-readable output
│   │   ├── validator.js      # Input validation (NEW)
│   │   ├── cost.js           # Cost confirmation (NEW)
│   │   └── exit.js           # Exit code management (NEW)
│   └── constants.js          # API URL, cost table, exit codes
├── tests/
│   ├── commands/             # Command integration tests
│   ├── lib/                  # Unit tests
│   └── fixtures/             # Mock responses
├── docs/
│   ├── RFC-SHIELDAPI-CLI.md
│   └── ARCHITECTURE.md
├── .github/
│   └── workflows/
│       ├── ci.yml            # Lint + test on push/PR
│       └── publish.yml       # npm publish on tag
├── package.json
├── LICENSE                   # MIT
└── README.md
```

### 2.2 Module Responsibilities

#### `bin/shieldapi.js`
- Shebang entry point (`#!/usr/bin/env node`)
- Imports and calls `run(process.argv)` from `src/index.js`
- No logic — just the bridge between npm's `bin` and the program
- Fulfills: UX-4 (npx support)

#### `src/index.js` — Program Definition
- Defines the Commander program with all commands and global options
- Parses `process.argv`, routes to command handlers
- Sets up global error handler for unhandled rejections
- Fulfills: FR-1.*, FR-2.*, UX-1

#### `src/commands/*.js` — Command Handlers
Each command handler follows the same contract:

```typescript
// Pseudocode interface — actual implementation is plain JS
interface CommandHandler {
  (args: string[], opts: CommanderOpts): Promise<void>
}
```

**Lifecycle of every command handler:**
1. Validate input via `validator.js` — exit 2 on failure
2. Transform input if needed (hash passwords, normalize URLs)
3. Show cost confirmation if interactive and not `--yes`/`--quiet`
4. Resolve wallet (if paid endpoint)
5. Call `api.js` with parameters
6. Format output (JSON or human-readable)
7. Set exit code via `exit.js`

**`commands/hash.js`** (NEW — FR-1.8)
- Purely local: `crypto.createHash('sha1').update(input).digest('hex').toUpperCase()`
- No API call, no wallet needed, works offline
- Fulfills: FR-1.8, PR-3

#### `src/lib/api.js` — API Client
- Single `apiRequest(endpoint, params, options)` function
- Two code paths:
  - **Free path:** plain `fetch()` for health and demo endpoints
  - **Paid path:** dynamic `import('@x402/fetch')` for x402 endpoints
- Lazy import of `@x402/fetch` ensures fast startup for free commands (PR-2)
- Custom `ApiError` class with status code and parsed error body
- Fulfills: IR-1, PR-2, SR-7

#### `src/lib/wallet.js` — Wallet Resolution
- Resolution order: `--wallet` flag → `SHIELDAPI_WALLET_KEY` env var → `null`
- Returns `ethers.Wallet` instance or `null`
- Validates key format, throws actionable error on invalid keys
- **Never stores, logs, or displays the key** (SR-1, SR-2, SR-3)
- Fulfills: FR-2.1, FR-2.2, SR-1, SR-2, SR-3, SR-9

#### `src/lib/validator.js` (NEW)
- Input validation before any network request
- Validators:
  - `validateEmail(s)` — basic format check via regex
  - `validateIP(s)` — IPv4 dot-decimal validation
  - `validateDomain(s)` — hostname format, no protocol prefix
  - `validateURL(s)` — starts with `http://` or `https://`
  - `validateHash(s)` — exactly 40 hex characters
- Returns `{ valid: boolean, error?: string }`
- Fulfills: SR-6

#### `src/lib/formatter.js` — Output Formatting
- Functions: `formatPassword`, `formatEmail`, `formatDomain`, `formatIp`, `formatUrl`, `formatScan`, `formatHealth`
- All formatters write to `console.log` (stdout) for data, `console.error` (stderr) for status
- Color coding via `chalk`:
  - Critical: white on red background
  - High: bold red
  - Medium: bold yellow
  - Low: bold green
  - Safe: green
- Fulfills: FR-4.1, FR-4.4

#### `src/lib/cost.js` (NEW)
- Cost table lookup by endpoint name
- `confirmCost(endpoint, opts)` — if interactive + not `--yes`/`--quiet`, prints cost to stderr and prompts for confirmation
- Auto-skips in non-interactive terminals (`!process.stdin.isTTY`)
- Fulfills: FR-4.5, UX-6, UX-7

#### `src/lib/exit.js` (NEW)
- Maps risk levels to exit codes:
  - `safe`, `low`, `none`, no risk → 0
  - `medium`, `high`, `critical` → 1
  - Usage error → 2
  - Network/API error → 3
  - Payment error → 4
- `setExitCode(data)` — inspects response for `risk_level` field
- For `scan` command: highest risk across all sub-results determines the exit code
- Fulfills: FR-5.*

#### `src/constants.js` (NEW)
- `API_BASE_URL = 'https://shield.vainplex.dev/api'`
- `COSTS` — map of endpoint → USDC cost string
- `EXIT_CODES` — named constants for exit codes
- Single source of truth for magic values

---

## 3. Data Flow

### 3.1 Paid Request Lifecycle

```
User Input                     CLI Process                         Network
─────────                     ───────────                         ───────

"shieldapi password hunter2"
        │
        ▼
   ┌──────────┐
   │ Commander │── parse argv
   │  (index)  │
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │ Validator │── validatePassword(input) ✓
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │  Hasher   │── SHA-1("hunter2") = "5BAA61E4..."
   │ (crypto)  │   plaintext discarded
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │  Cost     │── "This will cost $0.001 USDC. Continue?"  ──▶ stderr
   │ Confirm   │◀── "y" (or auto-yes in CI)
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │  Wallet   │── resolve from --wallet or env
   │ Resolver  │   create ethers.Wallet
   └────┬─────┘
        │
        ▼
   ┌──────────┐                                           ┌──────────────┐
   │  API      │── GET /api/check-password?hash=5BAA... ──▶│  ShieldAPI   │
   │  Client   │                                          │  Server      │
   │           │◀── HTTP 402 + PaymentRequirements ────────│              │
   │           │                                          │              │
   │  @x402/   │── GET + X-PAYMENT header ────────────────▶│              │
   │  fetch    │   (auto-signed USDC payment)             │              │
   │           │◀── HTTP 200 + JSON body ──────────────────│              │
   └────┬─────┘                                           └──────────────┘
        │
        ▼
   ┌──────────┐
   │Formatter  │── if --json: JSON.stringify → stdout
   │  / JSON   │   else: formatPassword() → stdout
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │  Exit     │── risk_level → exit code
   │  Code     │   process.exitCode = 1 (compromised)
   └──────────┘
```

### 3.2 Demo Request Lifecycle

Same as above but:
- No wallet resolution step
- No cost confirmation
- Appends `?demo=true` to request URL
- Uses plain `fetch()` instead of `@x402/fetch`
- Exit code still reflects demo response risk level

### 3.3 Offline Hash Lifecycle

```
"shieldapi hash hunter2"
        │
        ▼
   SHA-1("hunter2") → print "5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8"
        │
        ▼
   exit 0
```

No network, no wallet, no dependencies beyond Node.js `crypto`.

---

## 4. Security Architecture

### 4.1 Threat Model

| Threat | Mitigation | RFC Req |
|--------|------------|---------|
| Private key leaks to disk | Never persist keys; env var or flag only | SR-1 |
| Private key appears in logs | Never include in error messages or debug output | SR-2, SR-3 |
| Private key in shell history | Warn on stderr when password passed as arg; recommend `--stdin` | SR-5 |
| Plaintext password sent to API | SHA-1 hash client-side before any network call | SR-4 |
| MITM attack on API requests | HTTPS only; Node.js TLS validation | SR-7 |
| Malicious npm package | Minimal dependencies; lockfile integrity; no postinstall scripts | SR-8 |
| Input injection | Validate all inputs before API call; URL-encode params | SR-6 |

### 4.2 Key Handling Flow

```
                    ┌─────────────────────────────────┐
                    │   Key Input                     │
                    │   (--wallet or env var)          │
                    └────────────┬────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────────────┐
                    │   ethers.Wallet(key)             │
                    │   In-memory only                 │
                    │   No serialization               │
                    └────────────┬────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────────────┐
                    │   @x402/fetch signs payment      │
                    │   Wallet ref passed, not key     │
                    └────────────┬────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────────────┐
                    │   Process exits                  │
                    │   Wallet GC'd from memory        │
                    └─────────────────────────────────┘

    Never on disk ──────────────────────── Never in output
    Never in error messages ────────────── Never in telemetry (none exists)
```

### 4.3 Password Handling

```
User: "hunter2"
        │
        ▼ (stays in local process memory only)
   SHA-1("hunter2") = "5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8"
        │
        ▼ (plaintext reference dropped)
   API request: ?hash=5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
```

The plaintext password exists only in the local process, for the duration of the hash computation. It is never stored, transmitted, or logged.

---

## 5. Error Handling Strategy

### 5.1 Error Categories

| Category | Detection | User Message | Exit Code |
|----------|-----------|-------------|-----------|
| **Input validation** | `validator.js` rejects input | "Invalid email format. Expected: user@domain.tld" | 2 |
| **Missing wallet** | `wallet.js` returns null for paid endpoint | "No wallet configured. Use --wallet <key> or set SHIELDAPI_WALLET_KEY." | 4 |
| **Invalid wallet key** | `ethers.Wallet` throws | "Invalid private key format. Expected: 64 hex characters (with or without 0x prefix)." | 4 |
| **Network error** | `fetch` throws (ECONNREFUSED, timeout) | "Cannot reach ShieldAPI at shield.vainplex.dev. Check your connection." | 3 |
| **API 4xx** (not 402) | Response status 400-499 | "API error: {parsed error message}" | 3 |
| **API 5xx** | Response status 500+ | "ShieldAPI server error. Try again in a moment." | 3 |
| **x402 payment failure** | `@x402/fetch` throws or returns 402 after payment attempt | "Payment failed: {reason}. Check your USDC balance on Base." | 4 |
| **Rate limited** | Response 429 | "Rate limited. Retry after {retry-after} seconds." | 3 |
| **Unknown** | Unhandled exception | "Unexpected error: {message}. Report at github.com/vainplex/shieldapi-cli/issues" | 3 |

### 5.2 Error Rendering

```
# Human mode (default):
✗ Invalid email format. Expected: user@domain.tld

# JSON mode (--json):
{ "error": "Invalid email format", "code": 2 }
```

All errors go to **stderr**. In `--json` mode, error JSON also goes to stderr (stdout remains clean for piping).

---

## 6. Output Design

### 6.1 Stdout vs Stderr Separation

| Content | Stream | Rationale |
|---------|--------|-----------|
| Result data (formatted or JSON) | stdout | Pipeable: `shieldapi email foo@bar.com --json \| jq .risk_score` |
| Spinners / progress | stderr | Don't pollute piped output |
| Cost confirmation prompt | stderr | Interactive, not data |
| Error messages | stderr | Unix convention |
| Shell history warning | stderr | Informational |

This is critical for CI/CD and agent usage. An AI agent calling `shieldapi email foo@bar.com --json` will only see clean JSON on stdout. (FR-4.2, FR-4.3)

### 6.2 Color Scheme

```
Risk Critical   →  chalk.bgRed.white.bold    ██ CRITICAL (9/10) ██
Risk High       →  chalk.red.bold            HIGH (7/10)
Risk Medium     →  chalk.yellow.bold         MEDIUM (5/10)
Risk Low        →  chalk.green.bold          LOW (2/10)
Risk Safe/None  →  chalk.green               SAFE (0/10)

Section headers →  chalk.bold.underline
Keys/labels     →  chalk.gray
Values          →  default (white)
Success         →  chalk.green               ✅
Failure/warning →  chalk.red                 ⚠️
URLs/domains    →  chalk.cyan
Costs           →  chalk.yellow
```

### 6.3 JSON Output Contract

When `--json` is passed:
- stdout contains exactly one JSON object (or array for batch)
- No ANSI codes, no prefix text, no trailing newline after JSON
- The JSON is the raw API response, unmodified
- Errors are `{ "error": "message", "code": <exit-code> }` on stderr

This makes `shieldapi ... --json | jq .risk_score` reliable.

### 6.4 Risk Visualization (Human Mode)

```
Password check:
  ⚠️  PASSWORD COMPROMISED
     Found in 52,256,179 breaches
     SHA-1: 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
     🚨 Change this password immediately!

Email check:
  ⚠️  3 breaches found | Risk: ██ HIGH (7/10) ██

  📋 LinkedIn (2012) — 164,611,595 accounts
     Exposed: emails, passwords
  📋 Dropbox (2012) — 68,648,009 accounts
     Exposed: emails, passwords
  📋 Adobe (2013) — 152,445,165 accounts
     Exposed: emails, passwords, usernames

  💡 Recommendations:
     • Change passwords on all affected services
     • Enable 2FA where possible
```

---

## 7. Dependency Rationale

| Dependency | Purpose | Why This One | Alternatives Considered |
|-----------|---------|-------------|------------------------|
| `commander` ^12 | CLI framework | Industry standard, excellent TypeScript/JSDoc, small footprint, supports subcommands natively | `yargs` (heavier), `meow` (less structured), `clipanion` (less adoption) |
| `chalk` ^5 | Terminal colors | ESM-native since v5, zero-dep, battle-tested | `kleur` (slightly smaller but less API), `picocolors` (too minimal — no bg colors) |
| `ora` ^8 | Spinners | ESM-native, writes to stderr by default, graceful non-TTY fallback | `nanospinner` (less configurable), `cli-spinners` (raw data, no renderer) |
| `ethers` ^6 | Wallet creation | Required by `@x402/fetch` peer dependency, only used for `new Wallet(key)` | `viem` (possible but x402 SDK uses ethers) |
| `@x402/fetch` ^0.1 | x402 payment handling | Official x402 client — no alternative exists | n/a (x402 is the protocol) |

**Total production dependencies: 5**

No `postinstall` scripts. No native modules. No `node-gyp`. Pure JS ESM.

### Lazy Loading Strategy

`ethers` and `@x402/fetch` are the heaviest dependencies (~2MB+ combined). They are loaded **only** when a paid request is made:

```javascript
// In api.js — NOT at module top level
const { fetchWithPayment } = await import('@x402/fetch');
```

This ensures:
- `shieldapi --help` → fast (no ethers loaded) ✓ PR-1
- `shieldapi health` → fast (no ethers loaded) ✓ PR-1
- `shieldapi hash password` → instant (no network, no ethers) ✓ PR-3
- `shieldapi password hunter2 --demo` → fast (no ethers loaded) ✓ PR-2

---

## 8. Testing Strategy

### 8.1 Test Pyramid

```
     ╱╲
    ╱ E2E ╲         2-3 tests: npx smoke test, demo mode e2e
   ╱────────╲
  ╱Integration╲     8-10 tests: each command with mocked API
 ╱──────────────╲
╱    Unit Tests   ╲  20+ tests: validators, formatter, cost, exit codes, wallet
╱──────────────────╲
```

### 8.2 Test Matrix

| Module | Test Type | What | How |
|--------|-----------|------|-----|
| `validator.js` | Unit | Valid + invalid inputs for each type | Pure function tests |
| `wallet.js` | Unit | Valid keys, invalid keys, missing keys, env var fallback | Mock `process.env` |
| `formatter.js` | Unit | Each formatter with fixture data | Snapshot or string-match on output |
| `exit.js` | Unit | Risk level → exit code mapping | Pure function tests |
| `cost.js` | Unit | Cost lookup, TTY detection, `--yes` bypass | Mock `process.stdin.isTTY` |
| `api.js` | Integration | Free path, paid path, error handling | Mock `fetch` and `@x402/fetch` |
| `commands/*.js` | Integration | Full command flow with mocked API | Mock `api.js`, assert output + exit code |
| `bin/shieldapi.js` | E2E | `npx` invocation, `--help`, `--version` | Child process spawn |
| Demo mode | E2E | Real `--demo` calls against live API | Network test (skippable in CI) |

### 8.3 Test Runner

Node.js built-in test runner (`node --test`). Zero additional test dependencies.

```bash
npm test                    # All tests
node --test tests/lib/      # Unit tests only
node --test tests/commands/ # Integration tests only
```

### 8.4 CI Configuration

```yaml
# .github/workflows/ci.yml
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: ${{ matrix.node }} }
      - run: npm ci
      - run: npm test
```

---

## 9. Extension Points

### 9.1 Adding a New Endpoint

When the ShieldAPI server adds a new endpoint (e.g., `check-certificate`):

1. **Add constant** in `constants.js`: endpoint name, cost
2. **Create command** in `src/commands/certificate.js` following the existing pattern
3. **Create formatter** function in `formatter.js`
4. **Create validator** function in `validator.js`
5. **Register command** in `src/index.js` (one `program.command(...)` block)
6. **Add tests** in `tests/commands/certificate.test.js`

Estimated effort per new endpoint: **30-60 minutes** of focused work.

### 9.2 Endpoint Pattern

Every command follows the same template:

```javascript
import { apiRequest } from '../lib/api.js';
import { resolveWallet } from '../lib/wallet.js';
import { validateX } from '../lib/validator.js';
import { confirmCost } from '../lib/cost.js';
import { formatX } from '../lib/formatter.js';
import { setExitFromRisk } from '../lib/exit.js';

export async function xCommand(input, opts) {
  // 1. Validate
  const check = validateX(input);
  if (!check.valid) { /* exit 2 */ }

  // 2. Confirm cost
  await confirmCost('check-x', opts);

  // 3. Resolve wallet
  const wallet = resolveWallet(opts);

  // 4. Call API
  const data = await apiRequest('check-x', { x: input }, { demo: opts.demo, wallet });

  // 5. Output
  if (opts.json) {
    process.stdout.write(JSON.stringify(data, null, 2));
  } else {
    formatX(data);
  }

  // 6. Exit code
  setExitFromRisk(data);
}
```

This mechanical pattern means even AI agents can add new endpoints by following the template.

### 9.3 API URL Override

The `--api-url` flag (FR-2.6) enables:
- Testing against localhost during development
- Pointing to self-hosted ShieldAPI instances
- Future multi-region support

---

## 10. Traceability Matrix

Every architecture decision traced to RFC requirements.

| Architecture Decision | RFC Requirement(s) | Section |
|-----------------------|-------------------|---------|
| Commander.js for CLI framework | FR-1.*, FR-2.*, UX-1, UX-8 | §2.2, §7 |
| One file per command in `commands/` | FR-1.1–FR-1.8 | §2.1 |
| `--wallet` flag + env var resolution | FR-2.1, FR-2.2, SR-1, SR-2, SR-3 | §2.2, §4.2 |
| `--json` outputs to stdout only | FR-2.3, FR-4.2, FR-4.3 | §6.1, §6.3 |
| `--no-color` support via chalk | FR-2.4 | §7 |
| `--demo` flag on every paid command | FR-2.5, UX-5 | §2.2 |
| `--api-url` flag | FR-2.6 | §9.3 |
| `--yes` skips cost confirmation | FR-2.7, UX-6, UX-7 | §2.2, §5 |
| `--quiet` suppresses non-essential output | FR-2.8 | §2.2 |
| `--stdin` for password input | FR-3.2, SR-5 | §2.2 |
| `--hash` flag for pre-computed hashes | FR-3.3 | §2.2 |
| `--file` for batch scan targets | FR-3.4, FR-3.5 | §2.2 |
| Color-coded risk levels | FR-4.1, FR-4.4 | §6.2 |
| Spinners on stderr | FR-4.3, UX-2 | §6.1 |
| Cost display before request | FR-4.5, UX-6 | §2.2 (cost.js) |
| Exit code 0 = safe | FR-5.1 | §2.2 (exit.js) |
| Exit code 1 = risk found | FR-5.2 | §2.2 (exit.js) |
| Exit code 2 = usage error | FR-5.3 | §2.2 (exit.js) |
| Exit code 3 = network/API error | FR-5.4 | §2.2 (exit.js) |
| Exit code 4 = payment error | FR-5.5 | §2.2 (exit.js) |
| Keys never on disk | SR-1 | §4.1, §4.2 |
| Keys never in output | SR-2, SR-9 | §4.1, §4.2 |
| Keys never logged | SR-3 | §4.1 |
| Client-side SHA-1 hashing | SR-4 | §4.3 |
| Shell history warning | SR-5 | §5 |
| Input validation before requests | SR-6 | §2.2 (validator.js) |
| HTTPS only | SR-7 | §4.1 |
| No telemetry | SR-8 | §7 |
| Help on no-arg invocation | UX-1 | §2.2 |
| Spinner during requests | UX-2 | §2.2, §6.1 |
| Actionable error messages | UX-3 | §5 |
| npx support | UX-4 | §2.2 |
| Demo without wallet | UX-5 | §3.2 |
| Non-interactive detection | UX-7 | §2.2 (cost.js) |
| Per-command help with examples | UX-8 | §2.2 |
| @x402/fetch for paid requests | IR-1 | §2.2, §7 |
| npm as @vainplex/shieldapi-cli | IR-2 | §2.1 |
| Node.js ≥18 | IR-3 | §7 |
| CI workflow | IR-5 | §8.4 |
| Publish workflow | IR-4 | §2.1 |
| Startup under 500ms | PR-1 | §7 (lazy loading) |
| Lazy import of heavy deps | PR-2 | §7 |
| Hash under 10ms | PR-3 | §2.2 (hash.js) |
| Output within 100ms of response | PR-4 | §2.2 |

**Coverage: All 45 RFC requirements are addressed in the architecture.**

---

## 11. Implementation Priorities

### Phase 1: Core (v1.0.0)
Estimated effort: 4-6 hours

- [ ] `constants.js` — API URL, costs, exit codes
- [ ] `validator.js` — all input validators
- [ ] `exit.js` — exit code management
- [ ] `cost.js` — cost confirmation
- [ ] `hash` command (offline, FR-1.8)
- [ ] Refactor existing commands to use validator + exit code
- [ ] Move spinner writes to stderr
- [ ] `--yes`, `--quiet` flags
- [ ] Shell history warning for password command
- [ ] Unit tests for all new modules
- [ ] Integration tests for all commands
- [ ] README with examples

### Phase 2: Polish (v1.1.0)
Estimated effort: 2-3 hours

- [ ] `--stdin` for password command
- [ ] `--hash` flag for pre-computed hashes
- [ ] `--api-url` flag
- [ ] `--file` for scan command
- [ ] Non-interactive terminal detection
- [ ] CI workflow (.github/workflows/ci.yml)
- [ ] Publish workflow (.github/workflows/publish.yml)

### Phase 3: Nice-to-haves (v1.2.0+)
- [ ] `wallet` command group (balance, address)
- [ ] `--csv` output format
- [ ] Programmatic API export (IR-6)

---

*End of Architecture Document.*
