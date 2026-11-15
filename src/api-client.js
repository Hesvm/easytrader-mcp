import axios from 'axios';
import { getSessionToken } from './auth.js';

const BASE_URL = 'https://api-mts.orbis.easytrader.ir';

export function createApiClient() {
  const token = getSessionToken();
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:132.0) Gecko/20100101 Firefox/132.0',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'fa,en-US;q=0.9,en;q=0.8',
    'Origin': 'https://d.easytrader.ir',
    'Referer': 'https://d.easytrader.ir/'
  };

  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  const client = axios.create({
    baseURL: BASE_URL,
    headers,
    timeout: 15000
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        const { status, data } = error.response;
        const msg = data?.message || data?.error || JSON.stringify(data) || error.message;
        const err = new Error(`EasyTrader API Error [${status}]: ${msg}`);
        err.status = status;
        err.data = data;
        return Promise.reject(err);
      }
      return Promise.reject(error);
    }
  );

  return client;
}

// ---------------------------------------------------------
// 1. User & Account APIs
// ---------------------------------------------------------

export async function getProfile() {
  const client = createApiClient();
  const res = await client.get('/finance/api/customers/profile-brief');
  return res.data;
}

export async function getAccountBalances() {
  const client = createApiClient();
  const res = await client.get('/finance/api/payment-account-balances');
  return res.data;
}

export async function getAccountMoney() {
  const client = createApiClient();
  const res = await client.get('/easy/api/money');
  return res.data;
}

export async function getTransactions({ page = 0, size = 20, from, to, accountHistoryType = 0, voucherType = 0, description = '' } = {}) {
  const client = createApiClient();
  const now = new Date();
  const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const payload = {
    page,
    size,
    accountHistoryType,
    voucherType,
    description,
    from: from || past.toISOString(),
    to: to || now.toISOString()
  };

  const res = await client.post('/easy/api/transaction/transactions', payload);
  return res.data;
}

// ---------------------------------------------------------
// 2. Portfolio & Assets APIs
// ---------------------------------------------------------

export async function getPortfolioPerformance() {
  const client = createApiClient();
  const res = await client.get('/assetmodule/api/performance');
  return res.data;
}

export async function getTodayActivities() {
  const client = createApiClient();
  const res = await client.get('/core/api/v2/order/today-activities');
  return res.data;
}

export async function getFundAssets() {
  const client = createApiClient();
  const res = await client.get('/fundvtwo/api/assets/');
  return res.data;
}

export async function getFundsList({ includeHami = false } = {}) {
  const client = createApiClient();
  const res = await client.get(`/fundvtwo/api/funds/?includeHami=${includeHami}`);
  return res.data;
}

export async function getBlockedAssets({ type = 1, statuses = 1 } = {}) {
  const client = createApiClient();
  const res = await client.get(`/block-asset/api/?type=${type}&statuses=${statuses}`);
  return res.data;
}

// ---------------------------------------------------------
// 3. Market Data & Symbol Analysis APIs
// ---------------------------------------------------------

export async function getMarketLive() {
  const client = createApiClient();
  const res = await client.get('/easy/api/market-live');
  return res.data;
}

export async function getOverallIndexDaily() {
  const client = createApiClient();
  const res = await client.get('/easy/api/market-live/index/OverallIndex/daily');
  return res.data;
}

export async function getMarketMap() {
  const client = createApiClient();
  const res = await client.get('/symbols/api/MarketData/market-map');
  return res.data;
}

export async function getEasyFilterData() {
  const client = createApiClient();
  const res = await client.get('/easy/api/EasyFilter/data');
  return res.data;
}

export async function getSymbolInfo(isin) {
  const client = createApiClient();
  const res = await client.post('/symbols/api/MarketData/symbol-info-data', { isin });
  return res.data;
}

export async function getMarketSheet(isin) {
  const client = createApiClient();
  const res = await client.get(`/ms/api/MarketSheet/sum/${isin}`);
  return res.data;
}

export async function getSymbolReturnChart(isin) {
  const client = createApiClient();
  const res = await client.post('/symbols/api/MarketData/return-chart-data', { isin });
  return res.data;
}

export async function getIndividualInstitutional(isin) {
  const client = createApiClient();
  const res = await client.post('/symbols/api/MarketData/indInstTrade', { isin });
  return res.data;
}

export async function getTechnicalAnalysis(isin) {
  const client = createApiClient();
  const res = await client.get(`/easy/api/symbol-analysis/technical-analysis?isin=${isin}`);
  return res.data;
}

export async function getFundamentalAnalysis(isin) {
  const client = createApiClient();
  const res = await client.get(`/easy/api/symbol-analysis/fundamental-analysis?isin=${isin}`);
  return res.data;
}

export async function getIndTradingTrend(isin) {
  const client = createApiClient();
  const res = await client.get(`/easy/api/symbol-analysis/ind-trading-trend?isin=${isin}`);
  return res.data;
}

export async function getMiniChart(symbol, days = 1) {
  const client = createApiClient();
  const res = await client.get(`/chart/api/v2/datafeed/miniChart/history?symbol=${encodeURIComponent(symbol)}&days=${days}`);
  return res.data;
}

export async function getSymbolCodal(isin) {
  const client = createApiClient();
  const res = await client.get(`/notification/api/v1/codal/${isin}`);
  return res.data;
}

// ---------------------------------------------------------
// 4. Order Management APIs (Read & Write)
// ---------------------------------------------------------

export async function getActiveOrders() {
  const client = createApiClient();
  const res = await client.get('/core/api/order');
  return res.data;
}

export async function getOrderHistory({ page = 1, pageSize = 20, filters = [], searchTadbir = true } = {}) {
  const client = createApiClient();
  const payload = {
    sieveModel: {
      page,
      pageSize,
      filters,
      sort: { column: 'createDateTime', dir: 1 }
    },
    searchTadbir
  };
  const res = await client.post('/easy/api/orderHistory/orderReport', payload);
  return res.data;
}

export async function createOrder({ symbolIsin, price, quantity, side = 0, validityType = 0, validityDate = null, orderFrom = 1 }) {
  const client = createApiClient();
  const payload = {
    order: {
      symbolIsin,
      price,
      quantity,
      side, // 0 = Buy, 1 = Sell
      validityType, // 0 = Day
      validityDate,
      orderFrom // 1 = OrbisDesktop
    }
  };
  const res = await client.post('/core/api/v2/order', payload);
  return res.data;
}

export async function updateOrder({ orderId, symbolIsin, price, quantity, side = 0, validityType = 0, validityDate = null, orderFrom = 1 }) {
  const client = createApiClient();
  const payload = {
    modifyOrder: {
      orderId,
      symbolIsin,
      price,
      quantity,
      side,
      validityType,
      validityDate,
      orderFrom
    }
  };
  const res = await client.put('/core/api/v2/order', payload);
  return res.data;
}

export async function cancelOrder({ orderId, orderFrom = 1 }) {
  const client = createApiClient();
  const res = await client.delete('/core/api/v2/delete-order', {
    data: { orderId, orderFrom }
  });
  return res.data;
}

export async function batchCancelOrders(orderIds) {
  const client = createApiClient();
  const res = await client.post('/core/api/order/batchDelete', {
    orderIds
  });
  return res.data;
}

// ---------------------------------------------------------
// 5. Draft Orders APIs
// ---------------------------------------------------------

export async function getDrafts() {
  const client = createApiClient();
  const res = await client.get('/easy/api/draft');
  return res.data;
}

export async function createDraft(draft) {
  const client = createApiClient();
  const res = await client.post('/easy/api/draft', { draft });
  return res.data;
}

export async function deleteDraft(draftId) {
  const client = createApiClient();
  const res = await client.delete(`/easy/api/draft/${draftId}`);
  return res.data;
}

// ---------------------------------------------------------
// 6. System & Notifications APIs
// ---------------------------------------------------------

export async function getNotifications({ appType = 1, deviceType = 1, from, to, symbolIsin } = {}) {
  const client = createApiClient();
  const now = new Date();
  const defaultTo = now.toISOString().slice(0, 10);
  const defaultFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const fromDate = from || defaultFrom;
  const toDate = to || defaultTo;

  let url = `/notification/api/v1/inapp-message/instant?appType=${appType}&deviceType=${deviceType}&from=${fromDate}&to=${toDate}`;
  if (symbolIsin) url += `&symbolIsin=${symbolIsin}`;
  const res = await client.get(url);
  return res.data;
}

export async function getNscNotifications({ from, to, symbolIsin } = {}) {
  const client = createApiClient();
  const now = new Date();
  const defaultTo = now.toISOString().slice(0, 10);
  const defaultFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const fromDate = from || defaultFrom;
  const toDate = to || defaultTo;

  let url = `/notification/api/v1/inapp-message/nsc?from=${fromDate}&to=${toDate}`;
  if (symbolIsin) url += `&symbolIsin=${symbolIsin}`;
  const res = await client.get(url);
  return res.data;
}

// ---------------------------------------------------------
// 7. Credit & PointX (اعتبار و امتیاز باشگاه مشتریان)
// ---------------------------------------------------------

export async function getCreditApplicationsSummary() {
  const client = createApiClient();
  const res = await client.get('/credit/api/creditApplications/summary');
  return res.data;
}

export async function getGrantableCreditPackages() {
  const client = createApiClient();
  const res = await client.get('/credit/api/GrantableCreditWithPackages?applyPoint=true');
  return res.data;
}

export async function getCreditApplications({ pageSize = 20, pageNumber = 1, activeMode = true } = {}) {
  const client = createApiClient();
  const res = await client.get(`/credit/api/creditApplications?pageSize=${pageSize}&pageNumber=${pageNumber}&activeMode=${activeMode}`);
  return res.data;
}

export async function applyForCredit({ packageId, applyPoint = true }) {
  const client = createApiClient();
  const res = await client.post('/credit/api/creditApplications', {
    packageId,
    applyPoint
  });
  return res.data;
}

export async function getPointXBalance() {
  const client = createApiClient();
  const res = await client.get('/credit/api/pointxPoint');
  return res.data;
}

export async function getPointXHistory({ pageSize = 20, pageIndex = 1 } = {}) {
  const client = createApiClient();
  const res = await client.get(`/credit/api/pointxHistory?pageSize=${pageSize}&pageIndex=${pageIndex}`);
  return res.data;
}

export async function getCreditGifts() {
  const client = createApiClient();
  const res = await client.get('/credit/api/creditGifts');
  return res.data;
}

// ---------------------------------------------------------
// 8. MofidCard / Debit Card & Wallet (مفید کارت و کیف پول)
// ---------------------------------------------------------

export async function getMofidCardBalance() {
  const client = createApiClient();
  const res = await client.get('/mofidcard/api/balance');
  return res.data;
}

export async function getMofidCardUserInfo() {
  const client = createApiClient();
  const res = await client.get('/mofidcard/api/user-info');
  return res.data;
}

export async function getMofidCardRegisterInfo() {
  const client = createApiClient();
  const res = await client.get('/mofidcard/api/register-info');
  return res.data;
}

// ---------------------------------------------------------
// 9. Derivatives & Options (معاملات ابزارهای مشتقه و اختیار معامله)
// ---------------------------------------------------------

export async function getOptionPositions() {
  const client = createApiClient();
  const res = await client.get('/option/api/Positions');
  return res.data;
}

export async function getOptionSettlementStatus() {
  const client = createApiClient();
  const res = await client.get('/option/api/Positions/settlements/gathering/status');
  return res.data;
}

export async function getOptionMarketMap(type = 0) {
  const client = createApiClient();
  const res = await client.get(`/symbols/api/OptionMarketData/${type}/Map`);
  return res.data;
}

// ---------------------------------------------------------
// 10. Mutual Fund Issuance & Redemption (صدور و ابطال واحدهای صندوق)
// ---------------------------------------------------------

export async function getFundTransactions(fundCode) {
  const client = createApiClient();
  const url = fundCode ? `/fundvtwo/api/transactions/${fundCode}` : '/fundvtwo/api/allTransactions/';
  const res = await client.get(url);
  return res.data;
}

export async function issueFundUnits({ fundCode, amount, paymentMethod = 'Balance' }) {
  const client = createApiClient();
  const res = await client.post('/fundvtwo/api/issuance', {
    fundCode,
    amount,
    paymentMethod
  });
  return res.data;
}

export async function redeemFundUnits({ fundCode, unitCount }) {
  const client = createApiClient();
  const res = await client.post('/fundvtwo/api/redeem', {
    fundCode,
    units: unitCount
  });
  return res.data;
}

// ---------------------------------------------------------
// 11. Batch Market Quotes & Quick Symbol Search
// ---------------------------------------------------------

export async function getBatchQuotes(isins) {
  const client = createApiClient();
  const isinList = Array.isArray(isins) ? isins : [isins];
  const res = await client.post('/symbols/api/marketdata/v2', isinList);
  return res.data;
}


// ---------------------------------------------------------
// 12. App Settings & Customization (تنظیمات کاربر در ایزی‌تریدر)
// ---------------------------------------------------------

export async function getClientAppSettings() {
  const client = createApiClient();
  const res = await client.get('/easy/api/clientAppSetting');
  return res.data;
}

export async function updateClientAppSettings(settings) {
  const client = createApiClient();
  const res = await client.post('/easy/api/clientAppSetting', settings);
  return res.data;
}

// ---------------------------------------------------------
// 13. MofidCard Money Transfer & Management
// ---------------------------------------------------------

export async function depositToMofidCard(amount) {
  const client = createApiClient();
  const res = await client.post('/mofidcard/api/deposit/', { amount: amount.toString() });
  return res.data;
}

export async function withdrawFromMofidCard(amount) {
  const client = createApiClient();
  const res = await client.post('/mofidcard/api/withdraw', { amount: amount.toString() });
  return res.data;
}

export async function getMofidCardHistory() {
  const client = createApiClient();
  const res = await client.get('/mofidcard/api/transaction-history');
  return res.data;
}

export async function blockMofidCard(cardNumber) {
  const client = createApiClient();
  const res = await client.post('/mofidcard/api/block-card', { cardNumber });
  return res.data;
}

// ---------------------------------------------------------
// 14. IPO (Initial Public Offerings - عرضه‌های اولیه)
// ---------------------------------------------------------

export async function getIpoOrders(symbolIsins = []) {
  const client = createApiClient();
  const isinList = Array.isArray(symbolIsins) ? symbolIsins : [symbolIsins];
  const res = await client.post('/ipo/api/ipo/customer/offline-orders', { symbolIsins: isinList });
  return res.data;
}

export async function createIpoOrder(orderData) {
  const client = createApiClient();
  const res = await client.post('/ipo/api/order', orderData);
  return res.data;
}

export async function deleteIpoOrder(orderId) {
  const client = createApiClient();
  const res = await client.delete('/ipo/api/order', { data: { orderId } });
  return res.data;
}

// ---------------------------------------------------------
// 15. Offline Orders (سفارش‌های آفلاین / خارج از ساعات بازار)
// ---------------------------------------------------------

export async function getOfflineOrders(filters = {}) {
  const client = createApiClient();
  const res = await client.post('/algo/api/offline/order-history', filters);
  return res.data;
}

export async function createOfflineOrder(order) {
  const client = createApiClient();
  const res = await client.post('/algo/api/offline/order', { request: order });
  return res.data;
}

export async function cancelOfflineOrder(orders) {
  const client = createApiClient();
  const orderList = Array.isArray(orders) ? orders : [orders];
  const res = await client.put('/algo/api/offline/order', { request: { orders: orderList } });
  return res.data;
}

// ---------------------------------------------------------
// 16. Credit Collateral & Evaluation (ارزش تضمین و ارزیابی اعتباری سبد)
// ---------------------------------------------------------

export async function getCreditGuaranteedValue() {
  const client = createApiClient();
  const res = await client.get('/credit/api/guaranteedValue');
  return res.data;
}

export async function getIsCreditCustomer() {
  const client = createApiClient();
  const res = await client.get('/credit/api/isCreditCustomer');
  return res.data;
}

// ---------------------------------------------------------
// 17. Family / Dependent Transfers (انتقال وجه حساب‌های تحت تکفل)
// ---------------------------------------------------------

export async function getHasChildren() {
  const client = createApiClient();
  const res = await client.get('/finance/api/customers/has-children');
  return res.data;
}

export async function getChildrenList() {
  const client = createApiClient();
  const res = await client.get('/finance/api/customers/customer-children');
  return res.data;
}

export async function getFamilyTransfers({ page = 1, size = 20 } = {}) {
  const client = createApiClient();
  const res = await client.get('/finance/api/payments/parent-child-transfers/paged', {
    params: { pageNumber: page, pageSize: size }
  });
  return res.data;
}

export async function transferFamilyMoney(transferData) {
  const client = createApiClient();
  const res = await client.post('/finance/api/payments/parent-child-transfer', transferData);
  return res.data;
}

// ---------------------------------------------------------
// 18. Account Security & Session Management (مدیریت نشست‌ها)
// ---------------------------------------------------------

export async function removeActiveSessions(sessionIds) {
  const client = createApiClient();
  const ids = Array.isArray(sessionIds) ? sessionIds : [sessionIds];
  const res = await client.post('/easy/api/account/remove-sessions', { ids });
  return res.data;
}

