import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getSessionToken, updateSession } from './auth.js';
import * as api from './api-client.js';

export function createServer() {
  const server = new McpServer({
    name: 'easytrader-mcp',
    version: '1.0.0'
  });

  // ---------------------------------------------------------
  // 1. Auth & Session Tools
  // ---------------------------------------------------------

  server.tool(
    'easytrader_auth_status',
    'Check if the EasyTrader session token is active and verify account connectivity',
    {},
    async () => {
      const token = getSessionToken();
      if (!token) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                authenticated: false,
                message: 'No active session token found. Please use easytrader_update_session to set your Bearer token.'
              }, null, 2)
            }
          ]
        };
      }

      try {
        const profile = await api.getProfile();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                authenticated: true,
                message: 'EasyTrader session is valid and active.',
                user: profile
              }, null, 2)
            }
          ]
        };
      } catch (err) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                authenticated: false,
                error: err.message,
                status: err.status || 500,
                hint: 'Session token expired or invalid. Please copy a new Bearer token from Firefox DevTools and call easytrader_update_session.'
              }, null, 2)
            }
          ]
        };
      }
    }
  );

  server.tool(
    'easytrader_update_session',
    'Update the EasyTrader Bearer authentication token dynamically without restarting the server',
    {
      token: z.string().describe('The new Bearer token or raw JWT token from Firefox DevTools')
    },
    async ({ token }) => {
      try {
        const result = updateSession(token);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (err) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: false, error: err.message }, null, 2)
            }
          ]
        };
      }
    }
  );

  // ---------------------------------------------------------
  // 2. Account & Financial Tools
  // ---------------------------------------------------------

  server.tool(
    'easytrader_get_account_balance',
    'Get detailed account balance, buying power (T0, T1, T2), Hami fund balance, and blocked margin',
    {},
    async () => {
      try {
        const money = await api.getAccountMoney();
        const balances = await api.getAccountBalances();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                purchasingPower: money,
                bankAccountBalances: balances
              }, null, 2)
            }
          ]
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: err.message }, null, 2) }]
        };
      }
    }
  );

  server.tool(
    'easytrader_get_transactions',
    'Retrieve financial transactions history and cash flow statements with date filters',
    {
      page: z.number().optional().default(0).describe('Page number (0-indexed)'),
      size: z.number().optional().default(20).describe('Number of items per page'),
      from: z.string().optional().describe('Start ISO date string (e.g. 2026-10-01T00:00:00.000Z)'),
      to: z.string().optional().describe('End ISO date string'),
      description: z.string().optional().default('').describe('Optional filter by transaction description')
    },
    async (params) => {
      try {
        const data = await api.getTransactions(params);
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: err.message }, null, 2) }]
        };
      }
    }
  );

  // ---------------------------------------------------------
  // 3. Portfolio & Assets Tools
  // ---------------------------------------------------------

  server.tool(
    'easytrader_get_portfolio',
    'Get current stock portfolio performance, asset breakdown, breakeven prices, DPS, and holding quantities',
    {},
    async () => {
      try {
        const performance = await api.getPortfolioPerformance();
        const todayActivities = await api.getTodayActivities();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                holdings: performance.items || [],
                summary: {
                  totalItems: performance.items?.length || 0
                },
                todayActivities: todayActivities.portfolioItems || []
              }, null, 2)
            }
          ]
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: err.message }, null, 2) }]
        };
      }
    }
  );

  server.tool(
    'easytrader_get_funds',
    'Get user mutual fund assets and list of all available Mofid investment funds',
    {
      includeHami: z.boolean().optional().default(false).describe('Whether to include Hami money market fund in list')
    },
    async ({ includeHami }) => {
      try {
        const userAssets = await api.getFundAssets();
        const allFunds = await api.getFundsList({ includeHami });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                userFundAssets: userAssets,
                availableFunds: allFunds
              }, null, 2)
            }
          ]
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: err.message }, null, 2) }]
        };
      }
    }
  );

  // ---------------------------------------------------------
  // 4. Market Live, Index & Scanner Tools
  // ---------------------------------------------------------

  server.tool(
    'easytrader_get_market_overview',
    'Get live Tehran Stock Exchange (TSE) market overview, total volume, value, advance/decline counts, and Overall Index',
    {},
    async () => {
      try {
        const marketLive = await api.getMarketLive();
        const indexDaily = await api.getOverallIndexDaily();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                marketSummary: marketLive,
                overallIndex: indexDaily
              }, null, 2)
            }
          ]
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: err.message }, null, 2) }]
        };
      }
    }
  );

  server.tool(
    'easytrader_get_market_map',
    'Get comprehensive Market Map (heat map) of all sectors and tickers with real-time price change percentages',
    {},
    async () => {
      try {
        const map = await api.getMarketMap();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(map, null, 2)
            }
          ]
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: err.message }, null, 2) }]
        };
      }
    }
  );

  server.tool(
    'easytrader_get_easyfilter_data',
    'Get all filtered stock market symbols and industry grouping data from EasyFilter engine',
    {},
    async () => {
      try {
        const data = await api.getEasyFilterData();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2)
            }
          ]
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: err.message }, null, 2) }]
        };
      }
    }
  );

  // ---------------------------------------------------------
  // 5. Symbol Analysis & Market Depth Tools
  // ---------------------------------------------------------

  server.tool(
    'easytrader_get_symbol_details',
    'Get complete symbol information (closing price, last price, EPS, P/E, base volume, price limits, orderbook/market sheet)',
    {
      isin: z.string().describe('The ISIN code of the symbol (e.g. IRO1ALBZ0001, IRO3PZAZ0001, IRTKMOFD0001)')
    },
    async ({ isin }) => {
      try {
        const info = await api.getSymbolInfo(isin);
        let orderbook = null;
        try {
          orderbook = await api.getMarketSheet(isin);
        } catch {
          // ignore orderbook fetch error if outside market hours
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                symbolInfo: info,
                orderbook: orderbook
              }, null, 2)
            }
          ]
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: err.message }, null, 2) }]
        };
      }
    }
  );

  server.tool(
    'easytrader_get_symbol_analysis',
    'Get deep technical, fundamental, and institutional/individual (حقیقی-حقوقی) trade analysis for a symbol',
    {
      isin: z.string().describe('The ISIN code of the symbol')
    },
    async ({ isin }) => {
      try {
        const [technical, fundamental, indInst, trend, codal] = await Promise.allSettled([
          api.getTechnicalAnalysis(isin),
          api.getFundamentalAnalysis(isin),
          api.getIndividualInstitutional(isin),
          api.getIndTradingTrend(isin),
          api.getSymbolCodal(isin)
        ]);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                technical: technical.status === 'fulfilled' ? technical.value : null,
                fundamental: fundamental.status === 'fulfilled' ? fundamental.value : null,
                individualInstitutional: indInst.status === 'fulfilled' ? indInst.value : null,
                trend: trend.status === 'fulfilled' ? trend.value : null,
                codalAnnouncements: codal.status === 'fulfilled' ? codal.value : null
              }, null, 2)
            }
          ]
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: err.message }, null, 2) }]
        };
      }
    }
  );

  // ---------------------------------------------------------
  // 6. Order Placement & Management Tools (Write & Read)
  // ---------------------------------------------------------

  server.tool(
    'easytrader_get_orders',
    'Get currently active/open orders in the market book as well as historical order reports',
    {
      page: z.number().optional().default(1).describe('Page number for history'),
      pageSize: z.number().optional().default(10).describe('Page size for history')
    },
    async ({ page, pageSize }) => {
      try {
        const active = await api.getActiveOrders();
        const history = await api.getOrderHistory({ page, pageSize });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                activeOrders: active.orders || [],
                historyRecords: history.records || [],
                totalCount: history.totalCount
              }, null, 2)
            }
          ]
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: err.message }, null, 2) }]
        };
      }
    }
  );

  server.tool(
    'easytrader_send_order',
    'Submit a new Buy or Sell order to the Tehran Stock Exchange via EasyTrader OMS (Safe confirmation required)',
    {
      symbolIsin: z.string().describe('ISIN code of the symbol (e.g. IRO1ALBZ0001)'),
      price: z.number().positive().describe('Order price in Rials'),
      quantity: z.number().int().positive().describe('Order quantity / number of shares'),
      side: z.number().describe('0 for BUY (خرید), 1 for SELL (فروش)'),
      validityType: z.number().optional().default(0).describe('0: Day (روز), 1: ValidToDate (معتبر تا تاریخ), 2: FillAndKill (انجام و حذف), 3: GoodTillCancelled (معتبر تا لغو)'),
      validityDate: z.string().nullable().optional().describe('Validity date if validityType is 1 (ISO format)')
    },
    async ({ symbolIsin, price, quantity, side, validityType = 0, validityDate = null }) => {
      try {
        const result = await api.createOrder({
          symbolIsin,
          price,
          quantity,
          side,
          validityType,
          validityDate
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: side === 0 ? 'سفارش خرید با موفقیت ارسال شد' : 'سفارش فروش با موفقیت ارسال شد',
                result
              }, null, 2)
            }
          ]
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: false, error: err.message, details: err.data }, null, 2) }]
        };
      }
    }
  );

  server.tool(
    'easytrader_update_order',
    'Modify price or quantity of an existing open order in the market book',
    {
      orderId: z.string().describe('Existing order ID to modify'),
      symbolIsin: z.string().describe('ISIN code of the symbol'),
      price: z.number().positive().describe('New price in Rials'),
      quantity: z.number().int().positive().describe('New quantity / number of shares'),
      side: z.number().describe('0 for BUY, 1 for SELL'),
      validityType: z.number().optional().default(0),
      validityDate: z.string().nullable().optional()
    },
    async (params) => {
      try {
        const result = await api.updateOrder(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'سفارش با موفقیت ویرایش شد',
                result
              }, null, 2)
            }
          ]
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: false, error: err.message, details: err.data }, null, 2) }]
        };
      }
    }
  );

  server.tool(
    'easytrader_cancel_order',
    'Cancel an active open order in the market book by orderId',
    {
      orderId: z.string().describe('The ID of the order to cancel')
    },
    async ({ orderId }) => {
      try {
        const result = await api.cancelOrder({ orderId });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `سفارش ${orderId} با موفقیت لغو شد`,
                result
              }, null, 2)
            }
          ]
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: false, error: err.message, details: err.data }, null, 2) }]
        };
      }
    }
  );

  // ---------------------------------------------------------
  // 7. Draft Orders Tools
  // ---------------------------------------------------------

  server.tool(
    'easytrader_get_drafts',
    'Get saved order drafts from EasyTrader offline pre-order staging',
    {},
    async () => {
      try {
        const drafts = await api.getDrafts();
        return {
          content: [{ type: 'text', text: JSON.stringify(drafts, null, 2) }]
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: err.message }, null, 2) }]
        };
      }
    }
  );

  server.tool(
    'easytrader_create_draft',
    'Save an order draft in EasyTrader for later manual or automated execution',
    {
      symbolIsin: z.string().describe('ISIN code of the symbol'),
      price: z.number().positive().describe('Draft price'),
      quantity: z.number().int().positive().describe('Draft quantity'),
      side: z.number().describe('0 for BUY, 1 for SELL')
    },
    async (params) => {
      try {
        const result = await api.createDraft(params);
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: true, result }, null, 2) }]
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: false, error: err.message }, null, 2) }]
        };
      }
    }
  );

  // ---------------------------------------------------------
  // 8. Notifications & In-App Announcements Tools
  // ---------------------------------------------------------

  server.tool(
    'easytrader_get_notifications',
    'Get system notifications, trade executions, supervisor messages (پیام ناظر), and NSC announcements',
    {
      symbolIsin: z.string().optional().describe('Optional symbol ISIN to filter notifications')
    },
    async ({ symbolIsin }) => {
      try {
        const [instant, nsc] = await Promise.allSettled([
          api.getNotifications({ symbolIsin }),
          api.getNscNotifications({ symbolIsin })
        ]);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                systemMessages: instant.status === 'fulfilled' ? instant.value : null,
                nscSupervisorMessages: nsc.status === 'fulfilled' ? nsc.value : null
              }, null, 2)
            }
          ]
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: err.message }, null, 2) }]
        };
      }
    }
  );

  return server;
}

export async function runServer() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
