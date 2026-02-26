# 🛡️ ShieldAPI CLI

**Security intelligence from your terminal. Pay-per-request with USDC.**

The first x402-powered security CLI. Check passwords, emails, domains, IPs, and URLs against breach databases, blacklists, and threat intelligence — no API keys, no subscriptions, just crypto micropayments.

## Install

```bash
npm install -g @vainplex/shieldapi-cli
```

Or use directly with npx:
```bash
npx @vainplex/shieldapi-cli password "test123" --demo
```

## Quick Start

### Demo Mode (free, no wallet needed)

```bash
# Check if a password has been breached
shieldapi password "hunter2" --demo

# Check email for breaches
shieldapi email "test@example.com" --demo

# Check domain reputation
shieldapi domain "example.com" --demo

# Check IP reputation
shieldapi ip "8.8.8.8" --demo

# Check URL safety
shieldapi url "https://suspicious-site.com" --demo

# Full security scan
shieldapi scan --email "test@example.com" --domain "example.com" --demo

# Compute SHA-1 hash locally (offline, free)
shieldapi hash "mypassword"
```

### Paid Mode (real data, USDC on Base)

```bash
# Set your wallet key
export SHIELDAPI_WALLET_KEY="0x..."

# Real breach check — costs $0.001 USDC
shieldapi password "hunter2"

# Or pass wallet inline
shieldapi email "ceo@company.com" --wallet "0x..."
```

## Commands

| Command | Description | Cost (USDC) |
|---------|-------------|-------------|
| `password <pw>` | Check password against 900M+ breach records | $0.001 |
| `email <addr>` | Email breach lookup with risk scoring | $0.005 |
| `domain <name>` | DNS, blacklists, SSL, SPF/DMARC analysis | $0.003 |
| `ip <addr>` | Blacklists, Tor exit node, reverse DNS | $0.002 |
| `url <url>` | Phishing, malware, brand impersonation | $0.003 |
| `scan` | Full scan (combine any targets) | $0.01 |
| `health` | API status and pricing | Free |
| `hash <pw>` | SHA-1 hash (offline, no API call) | Free |

## Global Options

| Flag | Description |
|------|-------------|
| `--wallet <key>` | Private key for x402 payments |
| `--demo` | Use demo mode (free, fake data) |
| `--json` | Output raw JSON (for CI/CD and agents) |
| `--yes, -y` | Skip payment confirmation prompts |
| `--quiet, -q` | Suppress spinners and warnings |
| `--no-color` | Disable ANSI colors |
| `--version, -V` | Show version |
| `--help, -h` | Show help |

### Password-specific Options

| Flag | Description |
|------|-------------|
| `--stdin` | Read password from stdin (avoids shell history) |
| `--hash` | Treat input as pre-computed SHA-1 hash |

## Exit Codes

Designed for CI/CD pipelines and AI agents:

| Code | Meaning |
|------|---------|
| `0` | Safe — no risk found |
| `1` | Risk — breaches, threats, or high risk detected |
| `2` | Usage error — invalid arguments |
| `3` | Network error — API unreachable |
| `4` | Payment error — insufficient USDC or wallet issue |

```bash
# Use in CI/CD
shieldapi password "$DB_PASSWORD" --json --quiet --yes
if [ $? -eq 1 ]; then
  echo "COMPROMISED PASSWORD DETECTED"
  exit 1
fi
```

## Security

- **Passwords are hashed locally** with SHA-1 before any network request. Plaintext never leaves your machine.
- **Private keys are never persisted** to disk, logs, or displayed in output.
- **No telemetry** — zero phone-home, zero analytics.
- **Shell history warning** — the CLI warns when passwords are passed as arguments (use `--stdin` for sensitive passwords).

```bash
# Secure password checking (avoids shell history)
echo "mysecretpassword" | shieldapi password dummy --stdin
```

## How x402 Works

[x402](https://x402.org) is an open protocol for HTTP payments. Instead of API keys:

1. You make a request → server returns `HTTP 402` with payment requirements
2. Your wallet signs a USDC payment authorization
3. Request is retried with payment proof in headers
4. Server verifies payment and returns data

All of this happens automatically. You just need a wallet with USDC on Base.

## For AI Agents

ShieldAPI CLI is designed for autonomous agent usage:

```bash
# JSON output for structured parsing
shieldapi password "test" --demo --json

# Quiet mode suppresses all stderr
shieldapi domain "example.com" --demo --json --quiet

# Exit codes for decision making
shieldapi ip "1.2.3.4" --demo --quiet
echo $?  # 0 = safe, 1 = risk
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SHIELDAPI_WALLET_KEY` | Private key (hex, with or without 0x prefix) |
| `NO_COLOR` | Disable colors (standard) |

## Links

- **API**: https://shield.vainplex.dev
- **x402 Protocol**: https://x402.org
- **GitHub**: https://github.com/vainplex/shieldapi-cli

## License

MIT © Albert Hild
