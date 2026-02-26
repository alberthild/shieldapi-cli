# 🛡️ ShieldAPI CLI

**Security intelligence from your terminal. Pay-per-request with USDC.**

Check passwords, emails, domains, IPs, and URLs against breach databases and threat intelligence — powered by [x402](https://x402.org) micropayments. No API key. No subscription. Just pay per request with USDC on Base.

## Install

```bash
npm install -g @vainplex/shieldapi-cli
```

## Quick Start

### Demo Mode (free, no wallet needed)

```bash
# Check a password
shieldapi password "hunter2" --demo

# Check an email
shieldapi email "test@example.com" --demo

# Check a domain
shieldapi domain "example.com" --demo

# Check an IP
shieldapi ip "8.8.8.8" --demo

# Check a URL
shieldapi url "https://example.com" --demo

# Full security scan
shieldapi scan --email "test@example.com" --password "hunter2" --domain "example.com" --demo

# Check API health
shieldapi health
```

### Paid Mode (real data, USDC micropayments)

```bash
# Set your wallet key (Base network, needs USDC)
export SHIELDAPI_WALLET_KEY="your-private-key-hex"

# Or pass it directly
shieldapi password "mysecretpassword" --wallet "0xabc..."

# Check for real breaches
shieldapi email "albert@company.com"

# Full scan
shieldapi scan --email "me@company.com" --domain "company.com" --ip "203.0.113.1"
```

## Commands

| Command | Description | Cost |
|---------|-------------|------|
| `password <pw>` | Check password against HIBP (hashed locally) | 0.001 USDC |
| `email <email>` | Email breach lookup | 0.005 USDC |
| `domain <domain>` | Domain reputation (DNS, blacklists, SSL, SPF/DMARC) | 0.003 USDC |
| `ip <ip>` | IP reputation (blacklists, Tor, rDNS) | 0.002 USDC |
| `url <url>` | URL safety (phishing, malware, brand impersonation) | 0.003 USDC |
| `scan [options]` | Full scan (combine multiple checks) | 0.01 USDC |
| `health` | Check API status | Free |

## Global Flags

| Flag | Description |
|------|-------------|
| `--demo` | Use demo mode (free, returns realistic fake data) |
| `--wallet <key>` | Private key for x402 payments |
| `--json` | Output raw JSON instead of formatted output |
| `--no-color` | Disable colored output |
| `--help` | Show help |
| `--version` | Show version |

## How Payments Work

ShieldAPI uses the [x402 protocol](https://x402.org) for pay-per-request micropayments:

1. **No account needed** — just a wallet with USDC on Base
2. **Request → 402 → Pay → Data** — automatic payment flow handled by the CLI
3. **Costs are tiny** — from $0.001 to $0.01 per request
4. **Demo mode available** — try everything free with `--demo`

### Setting Up a Wallet

You need a wallet with USDC on [Base](https://base.org) (Coinbase's L2):

```bash
# Set via environment variable (recommended)
export SHIELDAPI_WALLET_KEY="your-hex-private-key"

# Or pass per-command
shieldapi email "test@example.com" --wallet "0x..."
```

> ⚠️ **Security:** Never commit your private key to version control. Use environment variables.

## Output Examples

### Password Check
```
🔍 Checking password...

⚠️  PASSWORD COMPROMISED
   Found in 52,256,179 breaches
   SHA-1: 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8

   🚨 Change this password immediately!
```

### Email Breach Check
```
🔍 Checking email: test@linkedin.com

⚠️  3 breaches found | Risk: HIGH (8.5/10)

   📋 LinkedIn (2012) — 164,000,000 accounts
      Exposed: emails, passwords
   📋 LinkedIn Scrape (2021) — 125,000,000 accounts
      Exposed: emails, names, job titles

   💡 Recommendations:
      • Change passwords on affected services
      • Enable 2FA where possible
```

## JSON Output

Pipe results into other tools with `--json`:

```bash
shieldapi email "test@example.com" --demo --json | jq '.risk_score'
```

## Links

- 🌐 **API:** [shield.vainplex.dev](https://shield.vainplex.dev)
- 📖 **x402 Protocol:** [x402.org](https://x402.org)
- 🐛 **Issues:** [GitHub Issues](https://github.com/vainplex/shieldapi-cli/issues)

## License

MIT © [Albert Hild](https://linkedin.com/in/albert-hild)
