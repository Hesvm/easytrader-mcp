<div align="center">

<img src="./assets/banner.png" alt="EasyTrader MCP Header Banner" width="100%" style="border-radius: 14px; margin-bottom: 24px;" />

# EasyTrader MCP
### Autonomous AI Trading & Intelligence Engine for Tehran Stock Exchange (TSE)
**Model Context Protocol (MCP) Server for Mofid Securities (`d.easytrader.ir`)**

[![MIT License](https://img.shields.io/badge/License-MIT-10b981.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-3b82f6.svg)](https://nodejs.org/)
[![Model Context Protocol](https://img.shields.io/badge/MCP-Standard%202024--11--05-8b5cf6.svg)](https://modelcontextprotocol.io/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-emerald.svg)](https://github.com/Hesvm/easytrader-mcp/pulls)

[Overview](#-overview) •
[Features](#-key-features) •
[Quickstart](#-quickstart-in-30-seconds) •
[Available Tools](#-available-mcp-tools) •
[Client Configurations](#-client-configurations) •
[Security Architecture](#-security--privacy-first)

</div>

---

## 💡 Overview

Ever wanted your AI coding agent or copilot to act as your **tireless personal trading desk** on the Tehran Stock Exchange?

**EasyTrader MCP** connects modern agentic AI models (such as Antigravity, Claude Desktop, Cursor, Cline, Windsurf) directly to Mofid Securities' EasyTrader platform (`d.easytrader.ir`).

Using the official [Model Context Protocol (MCP)](https://modelcontextprotocol.io/), your AI assistant can:
- **Scan the entire market** and track capital inflows into hot sectors.
- **Inspect your real-time portfolio**, calculate breakeven costs, and evaluate DPS returns.
- **Analyze individual tickers** using Orderbook depth, Institutional vs. Individual flows (حقیقی/حقوقی), and Codal announcements.
- **Safely execute, modify, or cancel orders** on the exchange, or stage them as offline drafts.

---

## ⚡ Key Features

- **💼 Real-Time Financials:** Instantly query T0/T1/T2 purchasing power, Hami money market fund balances, and linked bank accounts.
- **📊 Portfolio & Asset Breakdown:** Real-time holdings valuation, average purchase prices, breakeven points, and today's intraday trading status.
- **🔍 Market Live & Heatmap:** Comprehensive Tehran Stock Exchange overview, Overall Index status, market trade volume/value, and sector heatmaps.
- **🔬 Deep Symbol Analytics:** Live orderbook depth (top 5 bids/asks), P/E ratios, base volume, historical returns, technical/fundamental metrics, and Codal notifications.
- **🛒 Safe Order Execution (Read & Write):** Full OMS lifecycle support — send buy/sell orders, modify price/quantity in the orderbook, cancel active orders, and stage offline drafts.
- **🔔 Market Supervisor Alerts:** Monitor exchange supervisor messages (پیام ناظر), trading halts, and reopening announcements.
- **🔐 Frictionless Authentication:** Dynamic in-chat session refresh (`easytrader_update_session`) without needing server restarts.

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
