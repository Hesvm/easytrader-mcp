import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getSessionToken, updateSession, getSessionMetadata, extractFromDownloadsHar } from './auth.js';
import { extractFromRunningBrowsers, extractFromCDP } from './browser-extractor.js';
import { startBridge } from './bridge.js';
import * as api from './api-client.js';

export function createServer() {
  const server = new McpServer({
    name: 'easytrader-mcp',
    version: '1.2.0'
  });

  // ---------------------------------------------------------
  // 1. Auth & Session Tools
  // ---------------------------------------------------------

  server.tool(
    'easytrader_auth_status',
    'Check if the EasyTrader session token is active, inspect user profile and purchasing power',
    {},
    async () => {
      const token = getSessionToken();
      const meta = getSessionMetadata();

      if (!token) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                authenticated: false,
                sessionSource: meta.source,
                message: 'No active session token found.',
                zeroFrictionOptions: {
                  option1_extension: 'Install the lightweight EasyTrader AI Sync extension (extension/ in repository) in Firefox or Chrome for instant background sync.',
                  option2_bookmarklet: 'Call "easytrader_get_bookmarklet" and drag the bookmarklet to your browser bar. Click it on d.easytrader.ir for 1-click sync.',
                  option3_browser_tab: 'Open d.easytrader.ir in Google Chrome, Brave, Edge, or Arc. EasyTrader MCP auto-detects running tabs.',
                  option4_har_dump: 'Save a HAR network export from DevTools to ~/Downloads. It is ingested automatically.',
                  option5_cli_login: 'Run "npx easytrader-mcp login" in your terminal.'
                }
              }, null, 2)
            }
          ]
        };
      }

      try {
        const [profile, money] = await Promise.allSettled([
          api.getProfile(),
          api.getAccountMoney()
        ]);

        const profileData = profile.status === 'fulfilled' ? profile.value : null;
        const moneyData = money.status === 'fulfilled' ? money.value : null;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                authenticated: true,
                sessionSource: meta.source,
                message: 'EasyTrader session is valid and active.',
                user: profileData ? {
                  name: profileData.title || `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim(),
                  tradeCode: profileData.tradeCode || 'N/A'
                } : null,
                purchasingPower: moneyData?.buyPowerT0 !== undefined ? {
                  rials: moneyData.buyPowerT0,
                  tomans: Math.floor(moneyData.buyPowerT0 / 10).toLocaleString() + ' تومان',
                  hamiBalance: moneyData.hamiBalance ? Math.floor(moneyData.hamiBalance / 10).toLocaleString() + ' تومان' : null
                } : null
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
                hint: 'Session token expired or invalid. Use the EasyTrader extension, bookmarklet, or run "npx easytrader-mcp login".'
              }, null, 2)
            }
          ]
        };
      }
    }
  );

  server.tool(
    'easytrader_auto_auth',
    'Attempt multi-source zero-click automatic authentication (Running Browser tabs, CDP Remote Debugging, Downloads HAR dumps)',
    {},
    async () => {
      // 1. Try Running Browsers (Chrome, Brave, Edge, Arc via JXA)
      let extracted = extractFromRunningBrowsers();

      // 2. Try CDP Remote Debugging (port 9222/9223)
      if (!extracted) {
        try {
          extracted = await extractFromCDP();
        } catch {}
      }

      // 3. Try Downloads HAR dump
      if (!extracted) {
        try {
          const harToken = extractFromDownloadsHar();
          if (harToken) {
            extracted = { browser: 'Downloads HAR Archive', token: harToken };
          }
        } catch {}
      }

      if (extracted && extracted.token) {
        updateSession(extracted.token);
        try {
          const profile = await api.getProfile();
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                authenticated: true,
                source: extracted.browser,
                message: 'نشست کارگزاری مفید با موفقیت به صورت خودکار شناسایی و ذخیره شد.',
                user: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
                tradeCode: profile.tradeCode
              }, null, 2)
            }]
          };
        } catch (e) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                authenticated: true,
                source: extracted.browser,
                message: 'توکن با موفقیت استخراج و ذخیره شد.'
              }, null, 2)
            }]
          };
        }
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            authenticated: false,
            message: 'هیچ نشست فعالی در مرورگرهای در حال اجرا، پورت‌های دیباگ یا پوشه دانلودها یافت نشد.',
            suggestedActions: [
              'افزونه EasyTrader AI Sync را از پوشه extension نصب کنید',
              'یا از بوکمارکلت 1-کلیکی (easytrader_get_bookmarklet) استفاده نمایید',
              'یا یک تب d.easytrader.ir را در گوگل کروم یا بریو باز بگذارید'
            ]
          }, null, 2)
        }]
      };
    }
  );

  server.tool(
    'easytrader_get_bookmarklet',
    'Get the 1-Click Bookmarklet code for instant 0-friction session sync in any browser (Firefox, Safari, Chrome)',
    {},
    async () => {
      const code = `javascript:(function(){try{var t=null;for(var i=0;i<sessionStorage.length;i++){var k=sessionStorage.key(i);if(k&&k.indexOf('oidc')!==-1){var v=JSON.parse(sessionStorage.getItem(k));if(v&&v.access_token){t=v.access_token;break;}}}if(!t)t=localStorage.getItem('token');if(!t){alert('❌ توکن ورود یافت نشد. لطفا ابتدا وارد d.easytrader.ir شوید.');return;}fetch('http://127.0.0.1:4821',{method:'POST',body:t,headers:{'Content-Type':'text/plain'}}).then(function(r){return r.json();}).then(function(d){var toast=document.createElement('div');toast.innerHTML='✨ <b>نشست کارگزاری مفید با Antigravity MCP همگام شد!</b>';toast.style.cssText='position:fixed;bottom:24px;left:24px;background:#10b981;color:#fff;padding:12px 20px;border-radius:10px;font-family:sans-serif;font-size:14px;direction:rtl;z-index:999999;box-shadow:0 8px 24px rgba(0,0,0,0.2);';document.body.appendChild(toast);setTimeout(function(){toast.remove();},3500);}).catch(function(e){alert('⚠️ پل ارتباطی MCP (پورت 4821) در دسترس نیست. سرور MCP را اجرا کنید.');});}catch(e){alert('خطا: '+e.message);}})();`;

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            title: '1-Click EasyTrader Bookmarklet',
            instructions: 'کد زیر را به عنوان یک Bookmark در نوار بوکمارک مرورگر خود ذخیره کنید. هر بار در سایت d.easytrader.ir روی آن کلیک کنید، در ۰.۱ ثانیه نشست شما با هوش مصنوعی هماهنگ می‌شود.',
            bookmarkletCode: code
          }, null, 2)
        }]
      };
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

  // ---------------------------------------------------------
  // 7. Credit & PointX (بسته اعتباری و باشگاه مشتریان پلکان/پوینت‌ایکس)
  // ---------------------------------------------------------

  server.tool(
    'easytrader_get_credit_info',
    'Get user trading credit packages, PointX (Bashgah Mofid) balance, and active credit applications',
    {
      includeHistory: z.boolean().optional().default(false).describe('Whether to fetch PointX transaction history')
    },
    async ({ includeHistory }) => {
      try {
        const [points, packages, summary, history] = await Promise.allSettled([
          api.getPointXBalance(),
          api.getGrantableCreditPackages(),
          api.getCreditApplicationsSummary(),
          includeHistory ? api.getPointXHistory({ pageSize: 10 }) : Promise.resolve(null)
        ]);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                pointX: points.status === 'fulfilled' ? points.value : null,
                grantableCreditPackages: packages.status === 'fulfilled' ? packages.value : null,
                applicationsSummary: summary.status === 'fulfilled' ? summary.value : null,
                recentHistory: history?.status === 'fulfilled' ? history.value : null
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
    'easytrader_apply_credit',
    'Apply for an official Mofid Securities trading credit package using PointX / Bashgah points',
    {
      packageId: z.string().describe('The ID of the credit package to apply for'),
      applyPoint: z.boolean().optional().default(true).describe('Use points for discount/qualification')
    },
    async ({ packageId, applyPoint }) => {
      try {
        const result = await api.applyForCredit({ packageId, applyPoint });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: err.message }, null, 2) }]
        };
      }
    }
  );

  // ---------------------------------------------------------
  // 8. MofidCard & Debit Card Wallet (مفید کارت)
  // ---------------------------------------------------------

  server.tool(
    'easytrader_get_mofidcard',
    'Check MofidCard bank debit card balance (Rials), linked Sheba, national code, and card status',
    {},
    async () => {
      try {
        const [balance, userInfo] = await Promise.allSettled([
          api.getMofidCardBalance(),
          api.getMofidCardUserInfo()
        ]);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                cardBalance: balance.status === 'fulfilled' ? balance.value : null,
                cardUserInfo: userInfo.status === 'fulfilled' ? userInfo.value : null
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
  // 9. Derivatives & Options (قراردادهای اختیار معامله)
  // ---------------------------------------------------------

  server.tool(
    'easytrader_get_options',
    'Get user open option positions (قراردادهای اختیار خرید و فروش) and physical/cash settlement status',
    {},
    async () => {
      try {
        const [positions, settlements] = await Promise.allSettled([
          api.getOptionPositions(),
          api.getOptionSettlementStatus()
        ]);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                openPositions: positions.status === 'fulfilled' ? positions.value : null,
                settlementStatus: settlements.status === 'fulfilled' ? settlements.value : null
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
  // 10. Fund Issuance & Redemption (صدور و ابطال واحدهای سرمایه‌گذاری)
  // ---------------------------------------------------------

  server.tool(
    'easytrader_manage_fund_units',
    'Perform issuance (صدور) or redemption (ابطال) of Mofid investment fund units, or check transaction history',
    {
      action: z.enum(['issuance', 'redeem', 'transactions']).describe('Action: issuance (buy), redeem (sell), or transactions'),
      fundCode: z.string().describe('Fund Code (e.g. "10762" for Momtaz, or fund code from easytrader_get_funds)'),
      amount: z.number().optional().describe('Amount in Rials for issuance (required if action="issuance")'),
      unitCount: z.number().optional().describe('Number of fund units to redeem (required if action="redeem")')
    },
    async ({ action, fundCode, amount, unitCount }) => {
      try {
        if (action === 'transactions') {
          const txs = await api.getFundTransactions(fundCode);
          return { content: [{ type: 'text', text: JSON.stringify(txs, null, 2) }] };
        } else if (action === 'issuance') {
          if (!amount) throw new Error('amount is required for fund unit issuance');
          const res = await api.issueFundUnits({ fundCode, amount });
          return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
        } else if (action === 'redeem') {
          if (!unitCount) throw new Error('unitCount is required for fund unit redemption');
          const res = await api.redeemFundUnits({ fundCode, unitCount });
          return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
        }
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: err.message }, null, 2) }]
        };
      }
    }
  );

  // ---------------------------------------------------------
  // 11. Batch Symbol Quotes & Realtime Watchlist
  // ---------------------------------------------------------

  server.tool(
    'easytrader_get_batch_quotes',
    'Fetch real-time TSE market quotes (closing price, last price, change %, bid/ask queue, limits) for multiple tickers in a single call',
    {
      symbolIsins: z.array(z.string()).describe('List of Symbol ISINs (e.g. ["IRO1TAMN0001", "IRO1SAPA0001"])')
    },
    async ({ symbolIsins }) => {
      try {
        const data = await api.getBatchQuotes(symbolIsins);
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
  // 12. App Settings & Trading Configuration
  // ---------------------------------------------------------

  server.tool(
    'easytrader_client_settings',
    'Get or update EasyTrader client trading settings (buy/sell default volume, tick sizes, theme, price presets)',
    {
      action: z.enum(['get', 'update']).default('get').describe('Action: "get" to read current settings, "update" to modify'),
      settings: z.record(z.any()).optional().describe('Settings object to update when action="update"')
    },
    async ({ action, settings }) => {
      try {
        if (action === 'get') {
          const current = await api.getClientAppSettings();
          return { content: [{ type: 'text', text: JSON.stringify(current, null, 2) }] };
        } else {
          if (!settings) throw new Error('settings object is required when action="update"');
          const res = await api.updateClientAppSettings(settings);
          return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
        }
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: err.message }, null, 2) }]
        };
      }
    }
  );

  // ---------------------------------------------------------
  // 13. MofidCard Fund Transfers & Management (انتقال وجه آنی مفیدکارت)
  // ---------------------------------------------------------

  server.tool(
    'easytrader_manage_mofidcard_transfer',
    'Transfer money instantly between trading purchasing power and MofidCard debit card, view transaction history, or block card',
    {
      action: z.enum(['deposit', 'withdraw', 'history', 'block']).describe('Action: "deposit" to fund card from purchasing power, "withdraw" to return money from card to purchasing power, "history" for statement, "block" to freeze card'),
      amount: z.union([z.number(), z.string()]).optional().describe('Amount in Rials (required for deposit and withdraw)'),
      cardNumber: z.string().optional().describe('Card number (required for action="block")')
    },
    async ({ action, amount, cardNumber }) => {
      try {
        let result;
        if (action === 'deposit') {
          if (!amount) throw new Error('amount is required for action="deposit"');
          result = await api.depositToMofidCard(amount);
        } else if (action === 'withdraw') {
          if (!amount) throw new Error('amount is required for action="withdraw"');
          result = await api.withdrawFromMofidCard(amount);
        } else if (action === 'history') {
          result = await api.getMofidCardHistory();
        } else if (action === 'block') {
          if (!cardNumber) throw new Error('cardNumber is required for action="block"');
          result = await api.blockMofidCard(cardNumber);
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: err.message }, null, 2) }]
        };
      }
    }
  );

  // ---------------------------------------------------------
  // 14. IPO Management (عرضه‌های اولیه خودکار و آفلاین)
  // ---------------------------------------------------------

  server.tool(
    'easytrader_manage_ipo',
    'List active/past IPO orders, create automated offline IPO orders, or cancel pending IPO requests',
    {
      action: z.enum(['list', 'create', 'delete']).default('list').describe('Action: "list" to fetch customer IPO orders, "create" to place an IPO order, "delete" to cancel'),
      symbolIsins: z.array(z.string()).optional().default([]).describe('List of Symbol ISINs to query IPO orders for'),
      orderData: z.record(z.any()).optional().describe('IPO order parameters (required for action="create")'),
      orderId: z.union([z.number(), z.string()]).optional().describe('Order ID to cancel (required for action="delete")')
    },
    async ({ action, symbolIsins, orderData, orderId }) => {
      try {
        let result;
        if (action === 'list') {
          result = await api.getIpoOrders(symbolIsins);
        } else if (action === 'create') {
          if (!orderData) throw new Error('orderData object is required for action="create"');
          result = await api.createIpoOrder(orderData);
        } else if (action === 'delete') {
          if (!orderId) throw new Error('orderId is required for action="delete"');
          result = await api.deleteIpoOrder(orderId);
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: err.message }, null, 2) }]
        };
      }
    }
  );

  // ---------------------------------------------------------
  // 15. Offline Orders (سفارش‌های آفلاین / خارج از ساعات بازار)
  // ---------------------------------------------------------

  server.tool(
    'easytrader_manage_offline_orders',
    'Submit, list, or cancel offline orders placed outside TSE market hours for execution in the next pre-opening session',
    {
      action: z.enum(['list', 'create', 'cancel']).default('list').describe('Action: "list" for offline order history, "create" to submit offline order, "cancel" to cancel'),
      filters: z.record(z.any()).optional().default({}).describe('History filter options for action="list"'),
      order: z.record(z.any()).optional().describe('Single offline order request object for action="create"'),
      orders: z.array(z.record(z.any())).optional().describe('Array of order objects to cancel for action="cancel"')
    },
    async ({ action, filters, order, orders }) => {
      try {
        let result;
        if (action === 'list') {
          result = await api.getOfflineOrders(filters);
        } else if (action === 'create') {
          if (!order) throw new Error('order object is required for action="create"');
          result = await api.createOfflineOrder(order);
        } else if (action === 'cancel') {
          if (!orders) throw new Error('orders array is required for action="cancel"');
          result = await api.cancelOfflineOrder(orders);
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: err.message }, null, 2) }]
        };
      }
    }
  );

  // ---------------------------------------------------------
  // 16. Credit Collateral & Evaluation (ارزش تضمین و رتبه اعتباری پرتفوی)
  // ---------------------------------------------------------

  server.tool(
    'easytrader_get_credit_collateral',
    'Get total portfolio collateral guaranteed value for credit financing and check credit customer eligibility',
    {},
    async () => {
      try {
        const [guaranteedValue, isCreditCustomer] = await Promise.all([
          api.getCreditGuaranteedValue(),
          api.getIsCreditCustomer()
        ]);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ guaranteedValue, isCreditCustomer }, null, 2)
          }]
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: err.message }, null, 2) }]
        };
      }
    }
  );

  // ---------------------------------------------------------
  // 17. Family / Dependent Transfers (انتقال وجه حساب‌های تحت تکفل)
  // ---------------------------------------------------------

  server.tool(
    'easytrader_manage_family_transfers',
    'Manage money transfers between parent/guardian account and dependent child accounts within Mofid Securities',
    {
      action: z.enum(['has_children', 'children_list', 'transfer_history', 'transfer']).default('has_children').describe('Action to perform'),
      page: z.number().optional().default(1).describe('Page number for history'),
      size: z.number().optional().default(20).describe('Page size for history (max 50)'),
      transferData: z.record(z.any()).optional().describe('Transfer payload required when action="transfer"')
    },
    async ({ action, page, size, transferData }) => {
      try {
        let result;
        if (action === 'has_children') {
          result = await api.getHasChildren();
        } else if (action === 'children_list') {
          result = await api.getChildrenList();
        } else if (action === 'transfer_history') {
          result = await api.getFamilyTransfers({ page, size });
        } else if (action === 'transfer') {
          if (!transferData) throw new Error('transferData is required for action="transfer"');
          result = await api.transferFamilyMoney(transferData);
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: err.message }, null, 2) }]
        };
      }
    }
  );

  // ---------------------------------------------------------
  // 18. Account Security & Session Management (مدیریت نشست‌های فعال)
  // ---------------------------------------------------------

  server.tool(
    'easytrader_manage_sessions',
    'Terminate active login sessions or devices remotely for account security',
    {
      sessionIds: z.array(z.union([z.string(), z.number()])).describe('List of session IDs to terminate/remove')
    },
    async ({ sessionIds }) => {
      try {
        const result = await api.removeActiveSessions(sessionIds);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
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
  // Automatically start background loopback auth bridge for WebExtension / Bookmarklet 1-click sync
  try {
    startBridge({ quiet: true, unref: true });
  } catch {}

  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
