# 📈 EasyTrader MCP Server (کارگزاری مفید / ایزی‌تریدر)

A production-ready, fully-typed **Model Context Protocol (MCP)** server for **EasyTrader (کارگزاری مفید - d.easytrader.ir)**. This server reverse-engineers EasyTrader's entire modern MTS API surface, enabling any AI Agent (Antigravity, Claude Desktop, Cursor, Windsurf) to inspect accounts, analyze stocks, scan market live data, and safely execute/manage trades.

---

## ✨ Features

- 🔐 **Zero-Friction Auth**: Automatic token management with dynamic hot-reload tool (`easytrader_update_session`).
- 💼 **Account & Finance**: Live cash balance, buying power (T0, T1, T2), Hami money market fund balance, and transaction history.
- 📊 **Portfolio Management**: Complete portfolio valuation, breakeven purchase price, DPS, and real-time intraday activities.
- ⚡ **Market Depth & Scanning**: Live Tehran Stock Exchange (TSE) market overview, total value/volume, Sector Heatmap, and EasyFilter data.
- 🔍 **Symbol Deep Analysis**: Fundamental analysis, technical indicators, individual vs. institutional flow (حقیقی/حقوقی), and Codal announcements.
- 🛒 **Order Execution (Read & Write)**: Full order lifecycle support — send buy/sell orders, modify price/quantity, cancel orders, batch cancel, and draft order management.
- 🔔 **Supervisor & Notifications**: Real-time TSE market supervisor messages (پیام ناظر بازار) and NSC notifications.

---

## 🛠️ MCP Tools Overview

| Tool Name | Type | Description |
|---|---|---|
| `easytrader_auth_status` | **Read** | Checks session token validity and returns active customer profile brief. |
| `easytrader_update_session` | **Write** | Updates the session Bearer token dynamically without restarting the server. |
| `easytrader_get_account_balance` | **Read** | Returns buying power (T0/T1/T2), Hami fund balance, and bank balances. |
| `easytrader_get_transactions` | **Read** | Retrieves historical financial transactions, deposits, and cash flows. |
| `easytrader_get_portfolio` | **Read** | Returns holdings, quantity, breakeven price, and today's intraday trading status. |
| `easytrader_get_funds` | **Read** | Returns user mutual fund holdings and list of all Mofid investment funds. |
| `easytrader_get_market_overview` | **Read** | Returns live market overview, overall index status, and total market value. |
| `easytrader_get_market_map` | **Read** | Returns the full market heatmap of sectors and ticker price changes. |
| `easytrader_get_easyfilter_data` | **Read** | Scans and returns all symbols categorized by industries via EasyFilter. |
| `easytrader_get_symbol_details` | **Read** | Returns detailed ticker metrics (EPS, P/E, volume, price limits, orderbook). |
| `easytrader_get_symbol_analysis` | **Read** | Fetches Technical, Fundamental, and Real/Legal (حقیقی-حقوقی) trade trend data. |
| `easytrader_get_orders` | **Read** | Returns active/open orders in the market book and historical order reports. |
| `easytrader_send_order` | **Write** | Submits a new Buy (0) or Sell (1) order to the exchange with validity options. |
| `easytrader_update_order` | **Write** | Modifies price or quantity of an open order in the market orderbook. |
| `easytrader_cancel_order` | **Write** | Cancels an existing open order by `orderId`. |
| `easytrader_get_drafts` | **Read** | Lists saved pre-order drafts from EasyTrader offline staging. |
| `easytrader_create_draft` | **Write** | Creates a staged draft order for later execution. |
| `easytrader_get_notifications` | **Read** | Fetches market supervisor announcements (پیام‌های ناظر) and NSC events. |

---

## 🔑 Authentication Guide (10 Seconds)

1. Open Firefox or Chrome and log in to [https://d.easytrader.ir](https://d.easytrader.ir).
2. Press **F12** (or `Cmd + Option + I`) to open Developer Tools.
3. Switch to the **Network** tab.
4. Filter by `api-mts` or click on any request.
5. In Request Headers, copy the value of `Authorization` (starts with `Bearer eyJ...`).
6. Update your session:
   - Either run:
     ```bash
     echo '{"token": "Bearer YOUR_TOKEN_HERE"}' > ~/.easytrader-session.json
     ```
   - Or simply ask your AI agent:
     > *"Please update my EasyTrader token to: Bearer eyJ..."* (using `easytrader_update_session`).

---

## 🤖 Client Configurations

### 1. Antigravity (`~/.gemini/config/mcp_config.json`)
```json
{
  "mcpServers": {
    "easytrader": {
      "command": "node",
      "args": ["/Users/hesam/Projects/easytrader-mcp/bin/cli.js"]
    }
  }
}
```

### 2. Claude Desktop (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "easytrader": {
      "command": "node",
      "args": ["/Users/hesam/Projects/easytrader-mcp/bin/cli.js"]
    }
  }
}
```

### 3. Cursor (`.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "easytrader": {
      "command": "node",
      "args": ["/Users/hesam/Projects/easytrader-mcp/bin/cli.js"]
    }
  }
}
```

---

## 🧪 Testing

Run the automated self-test suite to verify live connectivity:
```bash
npm test
```

License: MIT
