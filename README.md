<div align="center">

<img src="./assets/banner.png?v=3" />

# EasyTrader MCP
### Autonomous AI Trading & Intelligence Engine for Tehran Stock Exchange (TSE)
**Model Context Protocol (MCP) Server for Mofid Securities (`d.easytrader.ir`)**

[![MIT License](https://img.shields.io/badge/License-MIT-10b981.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-3b82f6.svg)](https://nodejs.org/)
[![Model Context Protocol](https://img.shields.io/badge/MCP-Standard%202024--11--05-8b5cf6.svg)](https://modelcontextprotocol.io/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-emerald.svg)](https://github.com/Hesvm/easytrader-mcp/pulls)

[Overview](#-overview) •
[Features](#-core-capabilities) •
[Quickstart](#-quickstart-in-30-seconds) •
[Available Tools](#-available-mcp-tools) •
[Configurations](#-client-configurations) •
[Security Architecture](#-security--privacy-first)

</div>

---

## 💡 Overview

Ever wanted your AI coding agent or copilot to act as your **tireless personal trading desk** on the Tehran Stock Exchange?

**EasyTrader MCP** connects modern agentic AI models (such as Google Antigravity, Claude Desktop, Cursor, Cline, Windsurf) directly to Mofid Securities' EasyTrader platform (`d.easytrader.ir`).

Using the official [Model Context Protocol (MCP)](https://modelcontextprotocol.io/), your AI assistant can:
- **Scan the entire market** and track capital inflows into hot sectors.
- **Inspect your real-time portfolio**, calculate breakeven costs, and evaluate DPS returns.
- **Analyze individual tickers** using Orderbook depth, Institutional vs. Individual flows (حقیقی/حقوقی), and Codal announcements.
- **Safely execute, modify, or cancel orders** on the exchange, or stage them as offline drafts.

---

## ⚡ Core Capabilities

<table style="width: 100%; border: none;">
  <tr>
    <td width="35%" align="center" style="vertical-align: middle; border: none;">
      <img src="./assets/feature-balance.png" alt="Real-Time Purchasing Power & Balances" width="280" style="border-radius: 14px;" />
    </td>
    <td width="65%" style="vertical-align: middle; border: none; padding-left: 20px;">
      <h3>💰 Real-Time Financials & Purchasing Power</h3>
      <p>
        Full visibility into your liquid capital. Instantly query your real-time T0/T1/T2 purchasing power, check your daily interest-bearing Hami fund balance, and view linked bank accounts for instant payout readiness.
      </p>
      <ul>
        <li><code>easytrader_get_account_balance</code>: Instant breakdown of buy power & balances.</li>
        <li><code>easytrader_get_transactions</code>: Detailed ledger history & cash flow statements.</li>
        <li><code>easytrader_get_funds</code>: Holdings across all Mofid mutual & gold funds.</li>
      </ul>
    </td>
  </tr>
</table>

<br/>

<table style="width: 100%; border: none;">
  <tr>
    <td width="65%" style="vertical-align: middle; border: none; padding-right: 20px;">
      <h3>📊 Market Depth & Smart Flow Intelligence</h3>
      <p>
        Deep forensics into market liquidity and ticker dynamics. Inspect top 5 bid/ask queues (Orderbook), monitor capital movements from Institutional vs. Individual investors (حقیقی و حقوقی), and screen stocks with automated EasyFilter scanners.
      </p>
      <ul>
        <li><code>easytrader_get_market_overview</code>: Overall Index, market volume & turnover.</li>
        <li><code>easytrader_get_market_map</code>: Live sector heatmaps & percentage gains.</li>
        <li><code>easytrader_get_symbol_details</code>: Orderbook, limits, base volume & P/E ratio.</li>
        <li><code>easytrader_get_symbol_analysis</code>: Smart money tracking & Codal filings.</li>
      </ul>
    </td>
    <td width="35%" align="center" style="vertical-align: middle; border: none;">
      <img src="./assets/feature-market.png" alt="Market Depth & Live Orderbook" width="280" style="border-radius: 14px;" />
    </td>
  </tr>
</table>

<br/>

<table style="width: 100%; border: none;">
  <tr>
    <td width="35%" align="center" style="vertical-align: middle; border: none;">
      <img src="./assets/feature-orders.png" alt="Safe Automated Order Execution" width="280" style="border-radius: 14px;" />
    </td>
    <td width="65%" style="vertical-align: middle; border: none; padding-left: 20px;">
      <h3>🛒 Safe Order Execution & Staging</h3>
      <p>
        Empower your agent to act with surgical precision. Dispatch live orders directly into the market queue or stage them safely into pre-order drafts for manual one-click confirmation.
      </p>
      <ul>
        <li><code>easytrader_send_order</code>: Direct Buy (0) or Sell (1) order submission.</li>
        <li><code>easytrader_update_order</code>: Instant price or volume adjustments in queue.</li>
        <li><code>easytrader_cancel_order</code>: Rapid order revocation by ID.</li>
        <li><code>easytrader_create_draft</code>: Zero-risk offline draft staging.</li>
      </ul>
    </td>
  </tr>
</table>

---

## 🛠️ Available MCP Tools

| Tool | Type | Description |
|---|---|---|
| `easytrader_auth_status` | `Read` | Validates active session token and fetches trader profile brief. |
| `easytrader_update_session` | `Write` | Dynamically updates session Bearer token from chat without server restart. |
| `easytrader_get_account_balance` | `Read` | Returns real-time purchasing power (T0, T1, T2), Hami fund, and bank balances. |
| `easytrader_get_transactions` | `Read` | Fetches historical accounting transactions, deposits, and cash flows. |
| `easytrader_get_portfolio` | `Read` | Inspects portfolio holdings, shares count, breakeven price, and today's activities. |
| `easytrader_get_funds` | `Read` | Returns mutual fund investments and the full list of available Mofid funds. |
| `easytrader_get_market_overview` | `Read` | Fetches TSE market summary, Overall Index movement, and total daily turnover. |
| `easytrader_get_market_map` | `Read` | Returns the complete market heatmap with sector tickers and price changes. |
| `easytrader_get_easyfilter_data` | `Read` | Retrieves categorized symbol screens and algorithmic filters from EasyFilter. |
| `easytrader_get_symbol_details` | `Read` | Returns closing/last price, EPS, P/E, base volume, and 5-level orderbook. |
| `easytrader_get_symbol_analysis` | `Read` | Deep dive into Technicals, Fundamentals, Institutional vs. Individual flows, and Codal. |
| `easytrader_get_orders` | `Read` | Lists active orders in the exchange book and queries historical order reports. |
| `easytrader_send_order` | `Write` | Submits a new Buy (0) or Sell (1) order to the TSE with validity settings. |
| `easytrader_update_order` | `Write` | Modifies price or volume of an active order in the market book. |
| `easytrader_cancel_order` | `Write` | Cancels an open order in the market book by `orderId`. |
| `easytrader_get_drafts` | `Read` | Lists saved offline pre-order drafts. |
| `easytrader_create_draft` | `Write` | Stages an order as an offline draft for manual verification in the UI. |
| `easytrader_get_notifications` | `Read` | Fetches exchange supervisor alerts (پیام ناظر) and NSC market notifications. |

---

## 🚀 Quickstart in 30 Seconds

### 1. Clone & Install
```bash
git clone https://github.com/Hesvm/easytrader-mcp.git
cd easytrader-mcp
npm install
```

### 2. Grab your Bearer Token (One-time)
1. Open your browser and log into [d.easytrader.ir](https://d.easytrader.ir).
2. Press `F12` (or `Cmd + Option + I`) to open Developer Tools and go to the **Network** tab.
3. Filter by `api-mts` or click on any request.
4. Copy the value of the `Authorization` request header (starts with `Bearer eyJ...`).
5. Save it to your local configuration:
```bash
echo '{"token": "Bearer YOUR_COPIED_TOKEN"}' > ~/.easytrader-session.json
```
*(Tip: Whenever your session expires, simply tell your agent: `"Here is my new EasyTrader token: Bearer eyJ..."` and it will automatically refresh using `easytrader_update_session`!)*

### 3. Verify Connectivity
```bash
npm test
```

---

## 🤖 Client Configurations

<details open>
<summary><b>Google Antigravity</b></summary>

Add to your `~/.gemini/config/mcp_config.json`:
```json
{
  "mcpServers": {
    "easytrader": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/Projects/easytrader-mcp/bin/cli.js"]
    }
  }
}
```
</details>

<details>
<summary><b>Claude Desktop</b></summary>

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "easytrader": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/Projects/easytrader-mcp/bin/cli.js"]
    }
  }
}
```
</details>

<details>
<summary><b>Cursor</b></summary>

Add to `.cursor/mcp.json` in your workspace:
```json
{
  "mcpServers": {
    "easytrader": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/Projects/easytrader-mcp/bin/cli.js"]
    }
  }
}
```
</details>

---

## 🔒 Security & Privacy First

Financial data requires uncompromised security. EasyTrader MCP is engineered with strict safeguards:

1. **Zero Password Storage:** No passwords, national IDs, or 2FA credentials are ever stored or processed. Authentication relies solely on ephemeral browser JWT tokens.
2. **100% Localhost Execution:** The server runs directly on your local machine via stdio. No intermediate proxies, analytics, or third-party cloud servers exist. Communication happens straight from your IP to Mofid's official TLS endpoints.
3. **Native Browser Emulation:** All network requests replicate the exact headers, User-Agent, and client fingerprints of EasyTrader Web (`OrbisDesktop`), ensuring seamless behavior and zero risk of automated WAF flags.
4. **Clean Git Hygiene:** Session tokens, environment files, and local logs are strictly blacklisted in `.gitignore` to prevent any accidental credential leakage.

---

## 📄 Disclaimer & Contribution

- **Disclaimer:** This is an independent, open-source community integration and is not officially affiliated with or endorsed by Mofid Securities. All financial trading carries risk; verify order parameters and strategy execution responsibly.
- **Contributing:** Feature requests, new scanner filters, and PRs are warmly welcomed! Feel free to open an issue or pull request.

---

<div align="center">
Crafted with ❤️ for autonomous trading & agentic workflows.
</div>
